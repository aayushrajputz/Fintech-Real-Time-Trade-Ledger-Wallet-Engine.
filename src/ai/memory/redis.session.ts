import { redis } from "../../config/redis.js"
import { BaseMessage, mapChatMessagesToStoredMessages, mapStoredMessageToChatMessage } from "@langchain/core/messages"

export interface SessionData {
    userId: string;
    messages: BaseMessage[];
    lastSummary?: string;
    updateAt: number;
}

const SESSION_TTL_SECONDS = 86400

export async function saveUserSession(
    userId: string,
    messages: BaseMessage[],
    lastSummary?: string
): Promise<void> {
    const sessionKey = `ai:session:${userId}`

    const serializedMessages = mapChatMessagesToStoredMessages(messages);

    const payload = JSON.stringify({
        userId,
        messages: serializedMessages,
        lastSummary: lastSummary ?? null,
        updatedAt: Date.now(),

    })
    await redis.setex(sessionKey, SESSION_TTL_SECONDS, payload)
}

export async function getUserSession(userId: string): Promise<{
    messages: BaseMessage[],
    lastSummary?: string;
} | null> {
    const sessionKey = `ai:session:${userId}`;
    const rawData = await redis.get(sessionKey);

    if (!rawData) {
        return null
    }
    try {
        const parsed = JSON.parse(rawData)
        const messages: BaseMessage[] = (parsed.messages || []).map((msg: any) => mapStoredMessageToChatMessage(msg))
        return {
            messages,
            lastSummary: parsed.lastSummary ?? undefined,
        }
    } catch {
        return null
    }
}

export async function aquireSessionLock(userId: string, ttlSeconds = 10): Promise<boolean> {
    const lockKey = `ai:lock:${userId}`;
    const acquired = await redis.set(lockKey, "LOCKED", "EX", ttlSeconds, "NX")
    return acquired === "OK"
}

export async function releaseSessionLock(userId: string): Promise<void> {
    const lockKey = `ai:lock:${userId}`;
    await redis.del(lockKey);
}