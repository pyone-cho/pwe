import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { apiLimiter } from "./middleware/rateLimit.middleware";
import { errorHandler } from "./middleware/errorHandler";
import { openApiSpec } from "./swagger/openapi";

// Routes
import authRoutes from "./routes/auth.routes";
import orgRoutes from "./routes/org.routes";
import memberRoutes from "./routes/member.routes";
import eventRoutes from "./routes/event.routes";
import registrationRoutes from "./routes/registration.routes";
import attendanceRoutes from "./routes/attendance.routes";
import paymentRoutes from "./routes/payment.routes";
import announcementRoutes from "./routes/announcement.routes";
import reportRoutes from "./routes/report.routes";

const app = express();

// Trust proxy (nginx reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Rate limiting
app.use("/api/", apiLimiter);

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger UI — disabled in production
if (process.env.NODE_ENV !== "production") {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "PWE API Docs",
  }));

  app.get("/docs.json", (_req, res) => {
    res.json(openApiSpec);
  });
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/org`, orgRoutes);
app.use(`${API_PREFIX}/members`, memberRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}`, registrationRoutes);
app.use(`${API_PREFIX}`, attendanceRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
});

// Error handler
app.use(errorHandler);

export default app;
