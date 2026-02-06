import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, pdfOperations } from "@shared/schema";
import { eq, desc, count, gte, and, sql } from "drizzle-orm";
import { verifyToken, AuthRequest } from "./auth";
import { getUsageStats, getRecentOperations } from "./pdfLimits";

export interface AdminRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    plan: string;
    role: string;
  };
}

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
  
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Account is disabled" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.adminUser = {
    id: user.id,
    email: user.email,
    plan: user.plan,
    role: user.role,
  };

  next();
}

export async function listUsers(req: AdminRequest, res: Response) {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    res.json({ users: allUsers });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateUserPlan(req: AdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { plan, validityDays } = req.body;

    if (!plan || !["free", "pro"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan. Must be 'free' or 'pro'" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let planExpiresAt: Date | null = null;
    
    if (plan === "pro" && validityDays && validityDays !== "lifetime") {
      const days = parseInt(validityDays, 10);
      if (days > 0) {
        planExpiresAt = new Date();
        planExpiresAt.setDate(planExpiresAt.getDate() + days);
      }
    }

    await db.update(users).set({ 
      plan,
      planExpiresAt: plan === "free" ? null : planExpiresAt
    }).where(eq(users.id, id));

    res.json({ 
      message: `User plan updated to ${plan}`, 
      userId: id, 
      plan,
      planExpiresAt
    });
  } catch (error) {
    console.error("Update user plan error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function disableUser(req: AdminRequest, res: Response) {
  try {
    const { id } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.adminUser?.id === id) {
      return res.status(400).json({ error: "Cannot disable your own account" });
    }

    await db.update(users).set({ isActive: false }).where(eq(users.id, id));

    res.json({ message: "User account disabled", userId: id });
  } catch (error) {
    console.error("Disable user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function enableUser(req: AdminRequest, res: Response) {
  try {
    const { id } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await db.update(users).set({ isActive: true }).where(eq(users.id, id));

    res.json({ message: "User account enabled", userId: id });
  } catch (error) {
    console.error("Enable user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getStats(req: AdminRequest, res: Response) {
  try {
    const stats = await getUsageStats();
    
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [proUsers] = await db.select({ count: count() }).from(users).where(eq(users.plan, "pro"));
    const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [newUsersThisMonth] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    res.json({
      operations: stats,
      users: {
        total: totalUsers?.count || 0,
        pro: proUsers?.count || 0,
        active: activeUsers?.count || 0,
        newThisMonth: newUsersThisMonth?.count || 0,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getActivityLogs(req: AdminRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const operations = await getRecentOperations(Math.min(limit, 100));
    res.json({ operations });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getSystemHealth(req: AdminRequest, res: Response) {
  try {
    let dbStatus = "healthy";
    try {
      await db.select({ count: count() }).from(users).limit(1);
    } catch {
      dbStatus = "error";
    }

    let goBackendStatus = "healthy";
    try {
      const response = await fetch("http://localhost:8080/health", { 
        signal: AbortSignal.timeout(3000) 
      });
      if (!response.ok) goBackendStatus = "error";
    } catch {
      goBackendStatus = "error";
    }

    res.json({
      status: dbStatus === "healthy" && goBackendStatus === "healthy" ? "healthy" : "degraded",
      components: {
        database: dbStatus,
        pdfBackend: goBackendStatus,
        server: "healthy",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get system health error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function exportUsers(req: AdminRequest, res: Response) {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    const csv = [
      "ID,Email,Plan,Plan Expires At,Role,Active,Created At",
      ...allUsers.map(u => 
        `${u.id},${u.email},${u.plan},${u.planExpiresAt || ""},${u.role},${u.isActive},${u.createdAt}`
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users_export.csv");
    res.send(csv);
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function bulkDisableUsers(req: AdminRequest, res: Response) {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds must be a non-empty array" });
    }

    const adminId = req.adminUser?.id;
    const filteredIds = userIds.filter((id: string) => id !== adminId);

    let updated = 0;
    for (const id of filteredIds) {
      await db.update(users).set({ isActive: false }).where(eq(users.id, id));
      updated++;
    }

    res.json({ message: `${updated} users disabled`, updated });
  } catch (error) {
    console.error("Bulk disable users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function bulkEnableUsers(req: AdminRequest, res: Response) {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds must be a non-empty array" });
    }

    let updated = 0;
    for (const id of userIds) {
      await db.update(users).set({ isActive: true }).where(eq(users.id, id));
      updated++;
    }

    res.json({ message: `${updated} users enabled`, updated });
  } catch (error) {
    console.error("Bulk enable users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
