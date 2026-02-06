import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { pdfUsage, users, pdfOperations } from "@shared/schema";
import { eq, and, sql, desc, gte, count } from "drizzle-orm";
import { verifyToken } from "./auth";

async function checkUserActive(userId: string): Promise<{ isActive: boolean; plan: string; effectivePlan: string } | null> {
  const [user] = await db.select({ 
    isActive: users.isActive, 
    plan: users.plan,
    planExpiresAt: users.planExpiresAt 
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) return null;
  
  let effectivePlan = user.plan;
  if (user.plan === "pro" && user.planExpiresAt && user.planExpiresAt < new Date()) {
    effectivePlan = "free";
  }
  
  return { isActive: user.isActive, plan: user.plan, effectivePlan };
}

const LIMITS = {
  anonymous: {
    maxOpsPerDay: 8,
    maxFileSizeMB: 5,
    maxPages: 25,
  },
  free: {
    maxOpsPerDay: 15,
    maxFileSizeMB: 10,
    maxPages: 40,
  },
  pro: {
    maxOpsPerDay: Infinity,
    maxFileSizeMB: Infinity,
    maxPages: Infinity,
  },
};

interface PdfLimitsRequest extends Request {
  pdfUser?: {
    id: string;
    email: string;
    plan: string;
  } | null;
  clientIp?: string;
  userPlan?: "anonymous" | "free" | "pro";
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "unknown";
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

async function getDailyUsageCount(userId: string | null, ipAddress: string): Promise<number> {
  const today = getTodayDate();
  
  let result;
  if (userId) {
    result = await db
      .select({ count: pdfUsage.count })
      .from(pdfUsage)
      .where(and(eq(pdfUsage.userId, userId), eq(pdfUsage.usageDate, today)))
      .limit(1);
  } else {
    result = await db
      .select({ count: pdfUsage.count })
      .from(pdfUsage)
      .where(and(eq(pdfUsage.ipAddress, ipAddress), eq(pdfUsage.usageDate, today)))
      .limit(1);
  }
  
  return result.length > 0 ? result[0].count : 0;
}

export async function incrementUsage(userId: string | null, ipAddress: string): Promise<void> {
  const today = getTodayDate();
  
  if (userId) {
    const existing = await db
      .select()
      .from(pdfUsage)
      .where(and(eq(pdfUsage.userId, userId), eq(pdfUsage.usageDate, today)))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(pdfUsage)
        .set({ count: sql`${pdfUsage.count} + 1` })
        .where(eq(pdfUsage.id, existing[0].id));
    } else {
      await db.insert(pdfUsage).values({
        userId,
        ipAddress: null,
        usageDate: today,
        count: 1,
      });
    }
  } else {
    const existing = await db
      .select()
      .from(pdfUsage)
      .where(and(eq(pdfUsage.ipAddress, ipAddress), eq(pdfUsage.usageDate, today)))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(pdfUsage)
        .set({ count: sql`${pdfUsage.count} + 1` })
        .where(eq(pdfUsage.id, existing[0].id));
    } else {
      await db.insert(pdfUsage).values({
        userId: null,
        ipAddress,
        usageDate: today,
        count: 1,
      });
    }
  }
}

export async function checkPdfLimits(req: PdfLimitsRequest, res: Response, next: NextFunction) {
  try {
    const clientIp = getClientIp(req);
    req.clientIp = clientIp;
    
    let userId: string | null = null;
    let userPlan: "anonymous" | "free" | "pro" = "anonymous";
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        const userStatus = await checkUserActive(decoded.id);
        if (userStatus) {
          if (!userStatus.isActive) {
            return res.status(403).json({ 
              error: "Account is disabled",
              reason: "account_disabled"
            });
          }
          userId = decoded.id;
          userPlan = userStatus.effectivePlan === "pro" ? "pro" : "free";
          req.pdfUser = decoded;
        }
      }
    }
    
    req.userPlan = userPlan;
    
    if (userPlan === "pro") {
      return next();
    }
    
    const limits = LIMITS[userPlan];
    
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    const maxBytes = limits.maxFileSizeMB * 1024 * 1024;
    
    if (contentLength > maxBytes) {
      if (userPlan === "anonymous") {
        return res.status(401).json({ 
          error: "Please log in to increase your limits",
          reason: "file_size_exceeded",
          limit: `${limits.maxFileSizeMB}MB`
        });
      } else {
        return res.status(429).json({ 
          error: "Daily limit reached. Upgrade to Pro for higher limits.",
          reason: "file_size_exceeded",
          limit: `${limits.maxFileSizeMB}MB`
        });
      }
    }
    
    const dailyCount = await getDailyUsageCount(userId, clientIp);
    
    if (dailyCount >= limits.maxOpsPerDay) {
      if (userPlan === "anonymous") {
        return res.status(401).json({ 
          error: "Please log in to increase your limits",
          reason: "daily_limit_exceeded",
          limit: limits.maxOpsPerDay
        });
      } else {
        return res.status(429).json({ 
          error: "Daily limit reached. Upgrade to Pro for higher limits.",
          reason: "daily_limit_exceeded",
          limit: limits.maxOpsPerDay
        });
      }
    }
    
    (req as any).pdfLimitsData = {
      userId,
      clientIp,
      userPlan,
      maxPages: limits.maxPages,
    };
    
    next();
  } catch (error) {
    console.error("PDF limits check error:", error);
    next();
  }
}

export function getMaxPages(req: Request): number {
  const data = (req as any).pdfLimitsData;
  if (!data) return LIMITS.anonymous.maxPages;
  return data.maxPages;
}

export function getPdfLimitsData(req: Request): { userId: string | null; clientIp: string; userPlan: string; maxPages: number } | null {
  return (req as any).pdfLimitsData || null;
}

export async function logOperation(
  userId: string | null,
  userEmail: string | null,
  ipAddress: string,
  operation: string,
  status: string = "success",
  fileSize: number | null = null
): Promise<void> {
  try {
    await db.insert(pdfOperations).values({
      userId,
      userEmail,
      ipAddress,
      operation,
      status,
      fileSize,
    });
  } catch (error) {
    console.error("Failed to log operation:", error);
  }
}

export async function getRecentOperations(limit: number = 50) {
  return db
    .select()
    .from(pdfOperations)
    .orderBy(desc(pdfOperations.createdAt))
    .limit(limit);
}

export async function getUserOperations(userId: string, limit: number = 20) {
  return db
    .select()
    .from(pdfOperations)
    .where(eq(pdfOperations.userId, userId))
    .orderBy(desc(pdfOperations.createdAt))
    .limit(limit);
}

export async function getUsageStats() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [todayOps] = await db
    .select({ count: count() })
    .from(pdfOperations)
    .where(gte(pdfOperations.createdAt, new Date(today)));

  const [weekOps] = await db
    .select({ count: count() })
    .from(pdfOperations)
    .where(gte(pdfOperations.createdAt, new Date(weekAgo)));

  const [monthOps] = await db
    .select({ count: count() })
    .from(pdfOperations)
    .where(gte(pdfOperations.createdAt, new Date(monthAgo)));

  const [totalOps] = await db
    .select({ count: count() })
    .from(pdfOperations);

  const opsByType = await db
    .select({
      operation: pdfOperations.operation,
      count: count(),
    })
    .from(pdfOperations)
    .groupBy(pdfOperations.operation)
    .orderBy(desc(count()));

  return {
    today: todayOps?.count || 0,
    thisWeek: weekOps?.count || 0,
    thisMonth: monthOps?.count || 0,
    total: totalOps?.count || 0,
    byOperation: opsByType,
  };
}

export async function getUserLimits(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let userPlan: "anonymous" | "free" | "pro" = "anonymous";

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.id;
        const userStatus = await checkUserActive(decoded.id);
        if (userStatus?.isActive) {
          userPlan = userStatus.effectivePlan as "free" | "pro";
        }
      }
    }

    const clientIp = getClientIp(req);
    const used = await getDailyUsageCount(userId, clientIp);
    const limits = LIMITS[userPlan];

    res.json({
      used,
      limit: limits.maxOpsPerDay === Infinity ? 999 : limits.maxOpsPerDay,
      plan: userPlan,
      maxFileSizeMB: limits.maxFileSizeMB === Infinity ? 999 : limits.maxFileSizeMB,
      maxPages: limits.maxPages === Infinity ? 999 : limits.maxPages,
    });
  } catch (error) {
    console.error("Get user limits error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
