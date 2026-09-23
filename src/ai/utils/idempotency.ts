
import { redis } from "../../config/redis.js";
export interface IdempotencyCheckResult {
    isDuplicate: boolean;
    status?: "IN_PROGRESS" | "COMPLETED";
    cachedResult?: any;

}

export class IdempotencyCheck {
    private static TTL_SECONDS = 60 * 60 * 24
    private static LOCK_TTL_SECONDS = 60;

    static async checkAndLock(idempotencyKey: string): Promise<IdempotencyCheckResult> {
        const redisKey = `idempotency:${idempotencyKey}`;
        const acquired = await redis.set(redisKey, JSON.stringify({ status: "IN_PROGRESS" }), "EX", this.LOCK_TTL_SECONDS, "NX")

        if (acquired === "OK") {
            return { isDuplicate: false, status: "IN_PROGRESS" }
        }
        const existing = await redis.get(redisKey);
        if (!existing) {
            return { isDuplicate: false, status: "IN_PROGRESS" }
        }
        const parsed = JSON.parse(existing);
        return {
            isDuplicate: true,
            status: parsed.status,
            cachedResult: parsed.result || null,
        }
    }
    static async saveResults(idempotencyKey: string, result: any): Promise<void> {
        const redisKey = `idempotency:${idempotencyKey}`;
        await redis.set(redisKey, JSON.stringify({ status: "COMPLETED", result }), "EX", this.TTL_SECONDS)
    }
    static async releaseLock(idempotencyKey: string): Promise<void> {
        const redisKey = `idempotency:${idempotencyKey}`;
        await redis.del(redisKey);
    }
}    
