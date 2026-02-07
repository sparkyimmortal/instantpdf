import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import { register, login, getMe, changePassword, authMiddleware, getMyOperations, deleteAccount, forgotPassword, resetPassword } from "./auth";
import { checkPdfLimits, incrementUsage, getPdfLimitsData, logOperation, getUserLimits } from "./pdfLimits";
import { requireAdmin, listUsers, updateUserPlan, disableUser, enableUser, getStats, getActivityLogs, getSystemHealth, exportUsers, bulkDisableUsers, bulkEnableUsers, listContactSubmissions, getContactSubmission, updateContactStatus, toggleContactRead, replyToContact } from "./admin";
import { createCheckout, getStripeStatus, toggleStripe, initializeBillingSettingsIfMissing } from "./billing";
import { submitContact } from "./contact";

const GO_BACKEND_PORT = 8080;
let goBackendProcess: ChildProcess | null = null;
let goBackendStarted = false;

// Set up PDF proxy middleware - called early before other middleware
export function setupPdfProxy(app: Express) {
  const pdfApiPath = "/api/pdf";
  const otherPdfPaths = ["/pdf", "/downloads", "/previews"];
  
  app.use(pdfApiPath, checkPdfLimits as any);
  
  app.use(
    pdfApiPath,
    createProxyMiddleware({
      target: `http://localhost:${GO_BACKEND_PORT}`,
      changeOrigin: true,
      timeout: 300000,
      proxyTimeout: 300000,
      pathRewrite: undefined,
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.path = (req as any).originalUrl || req.url;
          const limitsData = getPdfLimitsData(req as Request);
          if (limitsData) {
            proxyReq.setHeader("X-PDF-Max-Pages", String(limitsData.maxPages));
            proxyReq.setHeader("X-PDF-User-Plan", limitsData.userPlan);
          }
        },
        proxyRes: async (proxyRes, req) => {
          if (proxyRes.statusCode && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
            const limitsData = getPdfLimitsData(req as Request);
            if (limitsData) {
              const operation = ((req as any).originalUrl || req.url).replace("/api/pdf/", "").split("?")[0];
              const contentLength = parseInt(req.headers["content-length"] || "0", 10);
              const pdfUser = (req as any).pdfUser;
              
              logOperation(
                limitsData.userId,
                pdfUser?.email || null,
                limitsData.clientIp,
                operation,
                "success",
                contentLength || null
              );
              
              if (limitsData.userPlan !== "pro") {
                try {
                  await incrementUsage(limitsData.userId, limitsData.clientIp);
                } catch (error) {
                  console.error("Failed to increment PDF usage:", error);
                }
              }
            }
          }
        },
        error: (err, req, res) => {
          console.error("PDF proxy error:", err);
          if (res && "writeHead" in res) {
            (res as any).writeHead(502, { "Content-Type": "application/json" });
            (res as any).end(JSON.stringify({ error: "PDF backend unavailable" }));
          }
        },
      },
    })
  );
  
  app.use(
    otherPdfPaths,
    createProxyMiddleware({
      target: `http://localhost:${GO_BACKEND_PORT}`,
      changeOrigin: true,
      timeout: 300000,
      proxyTimeout: 300000,
      pathRewrite: undefined,
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.path = (req as any).originalUrl || req.url;
        },
        error: (err, req, res) => {
          console.error("PDF proxy error:", err);
          if (res && "writeHead" in res) {
            (res as any).writeHead(502, { "Content-Type": "application/json" });
            (res as any).end(JSON.stringify({ error: "PDF backend unavailable" }));
          }
        },
      },
    })
  );
}

async function waitForHealthCheck(maxRetries = 10, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${GO_BACKEND_PORT}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Backend not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

function buildGoBackend(workDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Building Go PDF backend...");
    const build = spawn("go", ["build", "-o", "pdf-backend", "."], {
      cwd: workDir,
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/go/bin:${process.env.PATH}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    
    build.stdout?.on("data", (data) => {
      console.log(`[go build] ${data.toString().trim()}`);
    });
    
    build.stderr?.on("data", (data) => {
      console.error(`[go build] ${data.toString().trim()}`);
    });
    
    build.on("error", (err) => {
      console.error("Failed to build Go backend:", err);
      reject(err);
    });
    
    build.on("close", (code) => {
      if (code === 0) {
        console.log("Go PDF backend built successfully");
        resolve();
      } else {
        reject(new Error(`Go build failed with code ${code}`));
      }
    });
  });
}

function startGoBackend(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const goBackendPath = path.join(process.cwd(), "pdf-backend", "pdf-backend");
    const workDir = path.join(process.cwd(), "pdf-backend");
    
    // Build the Go backend first
    try {
      await buildGoBackend(workDir);
    } catch (err) {
      console.error("Failed to build Go backend, trying to start existing binary...", err);
    }
    
    console.log(`Starting Go PDF backend from: ${goBackendPath}`);
    
    goBackendProcess = spawn(goBackendPath, [], {
      cwd: workDir,
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/go/bin:${process.env.PATH}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    goBackendProcess.stdout?.on("data", (data) => {
      console.log(`[pdf-backend] ${data.toString().trim()}`);
    });

    goBackendProcess.stderr?.on("data", (data) => {
      console.error(`[pdf-backend] ${data.toString().trim()}`);
    });

    goBackendProcess.on("error", (err) => {
      console.error("Failed to start Go backend:", err);
      reject(err);
    });

    goBackendProcess.on("close", (code) => {
      console.log(`Go backend exited with code ${code}`);
      goBackendProcess = null;
    });

    // Wait for health check instead of fixed timeout
    const isHealthy = await waitForHealthCheck();
    if (isHealthy) {
      console.log("Go PDF backend started successfully");
      resolve();
    } else {
      reject(new Error("Go backend failed health check"));
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  try {
    await startGoBackend();
  } catch (err) {
    console.error("Warning: Go PDF backend failed to start. PDF processing may not work.", err);
  }

  try {
    await initializeBillingSettingsIfMissing();
  } catch (err) {
    console.error("Warning: Failed to initialize billing settings:", err);
  }

  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", authMiddleware, getMe);
  app.post("/api/auth/change-password", authMiddleware, changePassword);
  app.get("/api/auth/my-operations", authMiddleware, getMyOperations);
  app.post("/api/auth/delete-account", authMiddleware, deleteAccount);
  app.post("/api/auth/forgot-password", forgotPassword);
  app.post("/api/auth/reset-password", resetPassword);
  app.get("/api/auth/limits", getUserLimits);

  app.get("/api/admin/users", requireAdmin as any, listUsers as any);
  app.post("/api/admin/users/:id/plan", requireAdmin as any, updateUserPlan as any);
  app.post("/api/admin/users/:id/disable", requireAdmin as any, disableUser as any);
  app.post("/api/admin/users/:id/enable", requireAdmin as any, enableUser as any);
  
  app.get("/api/admin/stats", requireAdmin as any, getStats as any);
  app.get("/api/admin/activity", requireAdmin as any, getActivityLogs as any);
  app.get("/api/admin/health", requireAdmin as any, getSystemHealth as any);
  app.get("/api/admin/export", requireAdmin as any, exportUsers as any);
  app.post("/api/admin/bulk-disable", requireAdmin as any, bulkDisableUsers as any);
  app.post("/api/admin/bulk-enable", requireAdmin as any, bulkEnableUsers as any);

  app.get("/api/admin/settings/stripe", requireAdmin as any, getStripeStatus as any);
  app.post("/api/admin/settings/stripe", requireAdmin as any, toggleStripe as any);

  app.post("/api/billing/create-checkout", createCheckout as any);

  app.post("/api/contact", submitContact);
  app.get("/api/admin/contacts", requireAdmin as any, listContactSubmissions as any);
  app.get("/api/admin/contacts/:id", requireAdmin as any, getContactSubmission as any);
  app.post("/api/admin/contacts/:id/status", requireAdmin as any, updateContactStatus as any);
  app.post("/api/admin/contacts/:id/read", requireAdmin as any, toggleContactRead as any);
  app.post("/api/admin/contacts/:id/reply", requireAdmin as any, replyToContact as any);

  process.on("SIGTERM", () => {
    if (goBackendProcess) {
      goBackendProcess.kill();
    }
  });

  process.on("SIGINT", () => {
    if (goBackendProcess) {
      goBackendProcess.kill();
    }
  });

  return httpServer;
}
