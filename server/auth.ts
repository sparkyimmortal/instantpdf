import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "./db";
import { users, pdfUsage, pdfOperations, registerSchema, loginSchema, changePasswordSchema, deleteAccountSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getUserOperations } from "./pdfLimits";
import { sendWelcomeEmail } from "./email";

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is not set. Generating a random secret for this session.");
}

declare global {
  var __jwtSecret: string | undefined;
}

function getJwtSecret(): string {
  if (JWT_SECRET) return JWT_SECRET;
  if (!global.__jwtSecret) {
    global.__jwtSecret = crypto.randomBytes(32).toString("hex");
  }
  return global.__jwtSecret!;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    plan: string;
  };
}

export function generateToken(user: { id: string; email: string; plan: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { id: string; email: string; plan: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { id: string; email: string; plan: string };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = decoded;
  next();
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

export async function register(req: Request, res: Response) {
  try {
    const result = registerSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
    }).returning();

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      plan: newUser.plan,
    });

    sendWelcomeEmail(newUser.email).catch(() => {});

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        plan: newUser.plan,
        planExpiresAt: newUser.planExpiresAt,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      plan: user.plan,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = changePasswordSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { currentPassword, newPassword } = result.data;

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, req.user.id));

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyOperations(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const operations = await getUserOperations(req.user.id);
    res.json({ operations });
  } catch (error) {
    console.error("Get my operations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = deleteAccountSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { password } = result.data;

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    await db.delete(pdfOperations).where(eq(pdfOperations.userId, req.user.id));
    await db.delete(pdfUsage).where(eq(pdfUsage.userId, req.user.id));
    await db.delete(users).where(eq(users.id, req.user.id));

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    res.json({ message: "If an account with that email exists, a password reset link has been sent." });

    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.update(users).set({
      resetToken,
      resetTokenExpiresAt,
    }).where(eq(users.id, user.id));

    const { sendPasswordResetEmail } = await import("./email");
    sendPasswordResetEmail(user.email, resetToken).catch(() => {});
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const [user] = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await db.update(users).set({
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    }).where(eq(users.id, user.id));

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
