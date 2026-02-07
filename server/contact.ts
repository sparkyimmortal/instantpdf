import { Request, Response } from "express";
import { db } from "./db";
import { contactSubmissions, insertContactSchema } from "@shared/schema";
import { sendContactNotification } from "./email";
import { sql } from "drizzle-orm";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_HOUR = 5;
const ipSubmissionTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipSubmissionTimestamps.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  ipSubmissionTimestamps.set(ip, recent);
  return recent.length >= MAX_SUBMISSIONS_PER_HOUR;
}

function recordSubmission(ip: string) {
  const timestamps = ipSubmissionTimestamps.get(ip) || [];
  timestamps.push(Date.now());
  ipSubmissionTimestamps.set(ip, timestamps);
}

export async function submitContact(req: Request, res: Response) {
  try {
    const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";

    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many submissions. Please try again later." });
    }

    const parsed = insertContactSchema.safeParse({
      ...req.body,
      source: req.body.source || "web",
      category: req.body.category || "general",
    });

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const validSources = ["web", "mobile"];
    const validCategories = ["general", "billing", "bug", "feature"];

    if (!validSources.includes(parsed.data.source || "web")) {
      return res.status(400).json({ error: "Invalid source. Must be 'web' or 'mobile'" });
    }

    if (!validCategories.includes(parsed.data.category || "general")) {
      return res.status(400).json({ error: "Invalid category. Must be 'general', 'billing', 'bug', or 'feature'" });
    }

    const [submission] = await db
      .insert(contactSubmissions)
      .values(parsed.data)
      .returning();

    recordSubmission(ip);

    sendContactNotification(
      parsed.data.name,
      parsed.data.email,
      parsed.data.subject || "(No subject)",
      parsed.data.message,
      parsed.data.source || "web",
      parsed.data.category || "general"
    ).catch(() => {});

    res.json({ success: true, id: submission.id });
  } catch (error) {
    console.error("Contact submission error:", error);
    res.status(500).json({ error: "Failed to submit message" });
  }
}
