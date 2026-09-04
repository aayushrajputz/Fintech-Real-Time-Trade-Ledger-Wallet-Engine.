import { Request, Response, NextFunction } from "express";
import client from "prom-client";

client.collectDefaultMetrics({ register: client.register });


export const httpRequestCounter = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests processed",
    labelNames: ["method", "route", "status_code"]
});


export const httpRequestDurationMicroseconds = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startEpoch = Date.now();

    res.on("finish", () => {
        const responseTimeInSeconds = (Date.now() - startEpoch) / 1000;
        const route = req.route ? req.route.path : req.baseUrl || req.path;
        const statusCode = res.statusCode.toString();

        httpRequestCounter.labels(req.method, route, statusCode).inc();
        httpRequestDurationMicroseconds.labels(req.method, route, statusCode).observe(responseTimeInSeconds);
    });

    next();
};
