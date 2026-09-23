import OpenAI from "openai"

export function extimateTokenCount(text: string): number {
    if (!text) {
        return 0
    }
    return Math.ceil(text.length / 4)
}

export function estimateMessagesTokens(messages: OpenAI.ChatCompletionMessageParam[]): number {
    let totalTokens = 0;
    for (const msg of messages) {
        if (typeof msg.content === "string") {
            totalTokens += extimateTokenCount(msg.content);
        }
        if ("tool_calls" in msg && Array.isArray(msg.tool_calls)) {
            for (const tc of msg.tool_calls as any) {
                if (tc.function && tc.function.arguments) {
                    totalTokens += extimateTokenCount(tc.function.arguments);
                }
            }
        }
        totalTokens += 3
    }
    return totalTokens
}

export function pruneConversationHistory(
    messages: OpenAI.ChatCompletionMessageParam[],
    maxLimit = 4000
): OpenAI.ChatCompletionMessageParam[] {
    if (estimateMessagesTokens(messages) <= maxLimit) {
        return messages;
    }

    const systemPrompt = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const pruned = [...nonSystemMessages];

    while (pruned.length > 2 && estimateMessagesTokens(systemPrompt ? [systemPrompt, ...pruned] : pruned) > maxLimit) {
        pruned.shift();
    }

    return systemPrompt ? [systemPrompt, ...pruned] : pruned;
}
