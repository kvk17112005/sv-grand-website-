import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { config } from "./config.js";
import { pool } from "./db.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import bookingRoutes from "./routes/bookings.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

const PgSession = connectPgSimple(session);

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        const isLocalDev =
          !config.isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
        if (!origin || config.allowedOrigins.has(origin) || isLocalDev) {
          callback(null, true);
          return;
        }
        callback(new Error("This frontend origin is not allowed."));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", config.csrfHeader],
    })
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(
    session({
      name: config.cookieName,
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: false,
        pruneSessionInterval: 15 * 60,
      }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.sameSite,
        maxAge: config.sessionMaxAgeMs,
      },
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", publicRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
