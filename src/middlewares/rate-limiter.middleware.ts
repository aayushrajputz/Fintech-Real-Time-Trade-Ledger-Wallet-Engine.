import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";

export const rateLimiter = (maxRequests: number, windowSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const ip = req.ip;
        const key = `rate-limit:${ip}:${req.originalUrl}`;
        const currentReq = await redis.incr(key)

        if (currentReq === 1) {
            await redis.expire(key, windowSeconds)
        }
        if (currentReq > maxRequests) {
            return res.status(429).json({
                success: false,
                error: "To many requests.Please try again later."
            })
        }
        next();
    }
}