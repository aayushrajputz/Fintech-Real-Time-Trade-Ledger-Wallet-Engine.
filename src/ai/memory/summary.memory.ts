import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { MODEL_CONFIG } from "../utils/model.router.js";

const summarizerModel = new ChatOpenAI({
    modelName: MODEL_CONFIG.FAST || "openai/gpt-oss-20b",
    temperature: 0,
})

export function shouldCompactMessages(messages: BaseMessage[], threshold = 8): boolean {
    return messages.length > threshold
}


export async function compactMessagesWithSummary(messages: BaseMessage[], keepRecent = 4): Promise<{
    compactedMessages: BaseMessage[];
    summaryText: string;
}> {
    if (messages.length <= keepRecent) {
        return { compactedMessages: messages, summaryText: "" };
    }

    const olderMessages = messages.slice(0, -keepRecent);
    const recentMessages = messages.slice(-keepRecent);
    const conversationText = olderMessages
        .map((m) => {
            const role = m instanceof HumanMessage ? "User" : m instanceof AIMessage ? "AI" : "System";
            return `${role}: ${m.content}`;
        })
        .join("\n");
    const prompt = `Summarize the following financial assistant conversation history into 2 concise bullet points focusing only on key user intents, amounts, recipient names, and actions taken:\n\n${conversationText}\n\nConcise Summary:`;

    const summaryResponse = await summarizerModel.invoke([new HumanMessage({ content: prompt })])
    const summaryText = summaryResponse.content as string;

    const memoryMessages = new SystemMessage({
        content: `previous conversation summary :\n${summaryText}`
    })

    return {
        compactedMessages: [memoryMessages, ...recentMessages],
        summaryText
    }
}