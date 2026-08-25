import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { errorHandler } from "./middleware/error.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import teamsRoutes from "./routes/teams.routes";
import membersRoutes from "./routes/members.routes";
import paymentsRoutes from "./routes/payments.routes";
import submissionsRoutes from "./routes/submissions.routes";
import battleRoyaleRoutes from "./routes/battleRoyale.routes";
import judgesRoutes from "./routes/judges.routes";
import qrRoutes from "./routes/qr.routes";
import attendanceRoutes from "./routes/attendance.routes";
import adminRoutes from "./routes/admin.routes";
import notificationsRoutes from "./routes/notifications.routes";
import configRoutes from "./routes/config.routes";
import auditRoutes from "./routes/audit.routes";
import sseRoutes from "./routes/sse.routes";
import migrationRoutes from "./routes/migration.routes";

const app = express();
const PORT = process.env.PORT || 3001;

// -------------------------------------------------------------------------
// Security & parsing middleware
// -------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  compression({
    filter: (req, res) => {
      // Never compress SSE responses — compression middleware buffers them
      // and prevents real-time event delivery to clients.
      if (req.headers.accept === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

// Dynamic file-serving handler: redirects to Supabase Storage in production, or serves locally in dev
const uploadServeHandler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Capture whatever comes after /uploads/* or /api/uploads/*
  const storageKey = req.params[0];
  
  if (process.env.STORAGE_PROVIDER === "supabase") {
    try {
      const { supabase } = await import("./lib/storage");
      if (!supabase) {
        return res.status(500).send("Supabase client is not initialized");
      }
      
      const parts = storageKey.split("/");
      const bucketName = parts[0];
      const fileName = parts.slice(1).join("/");
      
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      
      if (!data?.publicUrl) {
        return res.status(404).send("File not found in Supabase Storage");
      }
      
      return res.redirect(data.publicUrl);
    } catch (err) {
      return next(err);
    }
  } else {
    const filePath = path.join(uploadsDir, storageKey);
    return res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send("File not found");
      }
    });
  }
};

app.get("/uploads/*", uploadServeHandler);
app.get("/api/uploads/*", uploadServeHandler);

// -------------------------------------------------------------------------
// API Routes
// -------------------------------------------------------------------------
// IMPORTANT: Custom /api/auth/session-info routes MUST be registered BEFORE
// the better-auth catch-all below, because the better-auth handler responds
// 404 to unknown paths and never calls next() — otherwise these routes would
// be unreachable and the Google OAuth flow would break.
app.use("/api/auth/session-info", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/battle-royale", battleRoyaleRoutes);
app.use("/api/judges", judgesRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/config", configRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/sse", sseRoutes);
app.use("/api/migration", migrationRoutes);

// -------------------------------------------------------------------------
// better-auth handler (handles /api/auth/sign-in, /callback, /get-session...)
// MUST stay after all custom routes: it answers 404 on unknown paths and
// never calls next(), so it would shadow any route registered beneath it.
// -------------------------------------------------------------------------
app.all("/api/auth/*", toNodeHandler(auth));

// -------------------------------------------------------------------------
// Health check
// -------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------------------
// Error handler (must be last)
// -------------------------------------------------------------------------
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 COMPSPHERE API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
