import { redis } from "../../config/redis.js"

export interface RateLimitResult {
    allowed: boolean,
    remaining: number,
    retryAfterSeconds?: number
}

export async function checkAiRateLimit(userId: string, maxRequests: number = 10, windowInSeconds: number = 60): Promise<RateLimitResult> {
    const now = Date.now();
    const clearBefore = now - windowInSeconds * 1000
    const key = `ratelimit:ai:${userId}`;
    const pipeline = redis.multi();
    pipeline.zremrangebyscore(key, 0, clearBefore);
    pipeline.zadd(key, now, `${now}- ${now} - ${Math.random()}`)
    pipeline.zcard(key);
    pipeline.expire(key, windowInSeconds);

    const results = await pipeline.exec()

    const currentReqCount = (results?.[2]?.[1] as number) || 0;

    if (currentReqCount > maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: windowInSeconds
        }
    }
    return {
        allowed: true,
        remaining: maxRequests - currentReqCount,
        retryAfterSeconds: windowInSeconds
    }
}  