import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, date, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at"),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete account"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const pdfUsage = pgTable("pdf_usage", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  ipAddress: text("ip_address"),
  usageDate: date("usage_date").notNull(),
  count: integer("count").notNull().default(0),
});

export type PdfUsage = typeof pdfUsage.$inferSelect;

export const pdfOperations = pgTable("pdf_operations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  userEmail: text("user_email"),
  ipAddress: text("ip_address"),
  operation: text("operation").notNull(),
  status: text("status").notNull().default("success"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PdfOperation = typeof pdfOperations.$inferSelect;

export const billingSettings = pgTable("billing_settings", {
  id: integer("id").primaryKey().default(1),
  stripeEnabled: boolean("stripe_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BillingSetting = typeof billingSettings.$inferSelect;

export const toggleStripeSchema = z.object({
  enabled: z.boolean(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  source: text("source").notNull().default("web"),
  category: text("category").notNull().default("general"),
  status: text("status").notNull().default("new"),
  isRead: boolean("is_read").notNull().default(false),
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  status: true,
  isRead: true,
  adminReply: true,
  repliedAt: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
