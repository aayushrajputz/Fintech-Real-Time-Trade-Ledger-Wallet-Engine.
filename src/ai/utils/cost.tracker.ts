
import { redis } from "../../config/redis.js"
export interface ModelPrice {
    input: number,
    output: number
}

export const MODEL_PRICING: Record<string, ModelPrice> = {
    "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
    "openai/gpt-oss-120b": { input: 2.00, output: 8.00 },
    "default": { input: 0.50, output: 2.00 }
}

export interface SessionMetrics {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    totalCostUSD: number,
    apiCallsCount: number
}
let currentSessionMetrics: SessionMetrics = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    totalCostUSD: 0,
    apiCallsCount: 0
};

export async function trackUsage(userId: string, model: string, promptTokens: number, completionTokens: number): Promise<SessionMetrics> {

    let metrics = await getUserSessionMetrix(userId);
    if (!metrics) {
        metrics = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            totalCostUSD: 0,
            apiCallsCount: 0
        };
    }
    const pricing = MODEL_PRICING[model] || MODEL_PRICING["default"];
    const totalTokens = promptTokens + completionTokens
    const cost = (promptTokens * pricing.input + completionTokens * pricing.output) / 1000000
    metrics.promptTokens += promptTokens;
    metrics.completionTokens += completionTokens;
    metrics.totalTokens += totalTokens;
    metrics.totalCostUSD += cost;
    metrics.apiCallsCount += 1;
    await safeSessionMetrics(userId, metrics);
    return metrics
}

export function getSessionMetrics(): SessionMetrics {
    return { ...currentSessionMetrics }
}

export function resetSessionMetrics(): void {
    currentSessionMetrics = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalCostUSD: 0,
        apiCallsCount: 0
    };
}

export function formatCost(costUSD: number): string {
    return `${costUSD.toFixed(6)}`
}

export async function safeSessionMetrics(userId: string, metrics: SessionMetrics): Promise<void> {
    try {
        await redis.setex(`sessionMetrics:${userId}`, 86400, JSON.stringify(metrics))
    } catch (error) {
        console.error("failed to cache session metrics", error)

    }
}

export async function getUserSessionMetrix(userId: string): Promise<SessionMetrics | null> {
    try {
        const cachedData = await redis.get(`sessionMetrics:${userId}`)
        if (cachedData) {
            return JSON.parse(cachedData)
        }
        return null

    } catch (error) {
        console.error("Failed to retrieve cached session metrics", error)
        return null
    }
}
