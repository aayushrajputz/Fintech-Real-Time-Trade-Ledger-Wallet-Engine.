import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/error.middlewares.js";
import authRoutes from "./routes/auth.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import orderRoutes from "./routes/order.routes.js"
import "./config/redis.js";
import { correlationMiddleware } from "./middlewares/correlation.middleware.js";
import client from "prom-client";
import { metricsMiddleware } from "./middlewares/metrics.middleware.js"

const app = express();

// Middleware Chain (Guards)
app.use(metricsMiddleware);
app.use(correlationMiddleware);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(cookieParser());

// Health Check Route
app.get("/metrics", async (req, res) => {
    res.setHeader("Content-Type", client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/order", orderRoutes);


// Error Handler (LAST!)
app.use(globalErrorHandler);

export default app;
