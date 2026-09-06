import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../errors/app-errors.js";
import { redis } from "../config/redis.js";

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!idempotencyKey) {
        return next(new BadRequestError("X-idempotency-key header is required"));
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    // Step 1: Pehle Atomic Lock acquire karne ki koshish karein
    const isAcquired = await redis.set(
        cacheKey,
        JSON.stringify({ status: "PROCESSING" }),
        "EX",
        60,
        "NX"
    );

    if (!isAcquired) {
        const existing = await redis.get(cacheKey);
        if (existing) {
            const { status, body } = JSON.parse(existing);
            if (status === "PROCESSING") {
                return res.status(409).json({
                    success: false,
                    error: "Request is already being processed. Please wait."
                });
            }
            return res.status(status).json(body);
        }
        return res.status(409).json({
            success: false,
            error: "Duplicate request in progress"
        });
    }

    // Step 2: Response cache interceptor
    const originalJson = res.json;
    res.json = function (body: any) {
        if (res.statusCode >= 500) {
            redis.del(cacheKey);
        } else {
            redis.set(cacheKey, JSON.stringify({ status: res.statusCode, body }), "EX", 86400);
        }
        return originalJson.call(res, body);
    } as any;

    // Step 3: Abb controller execute karein
    next();
};
