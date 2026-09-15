import OpenAI from "openai";
import { openai } from "./ledger.calling.js";
import { ledgerTools } from "./ledger.calling.js";
import {
    executeGetWalletBalance,
    executeTransferFunds,
    executeGetTransactionHistory,
} from "./ledger.handlers.js";

export async function dispatchToolCall(toolName: string, rawArgs: string) {
    const args = JSON.parse(rawArgs);

    switch (toolName) {
        case "get_wallet_balance":
            return await executeGetWalletBalance(args);

        case "transfer_funds":
            return await executeTransferFunds(args);

        case "get_transaction_history":
            return await executeGetTransactionHistory(args);

        default:
            return { error: `Unknown tool requested: ${toolName}` };
    }
}

export async function runAgent(userPrompt: string) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content:
                "You are an AI Ledger & Wallet Assistant. Use the provided tools to fetch balances, transfer funds, or view transaction history. Always be precise with user IDs and amounts.",
        },
        {
            role: "user",
            content: userPrompt,
        },
    ];

    console.log(`\n [User Prompt]: "${userPrompt}"`);

    // Multi-step ReAct Loop (Max 5 turns to prevent infinite loops)
    const MAX_STEPS = 5;
    for (let step = 0; step < MAX_STEPS; step++) {
        const response = await openai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: messages,
            tools: ledgerTools,
            tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;
        messages.push(responseMessage);

        // If LLM has no more tool calls, it gave the final natural language answer
        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
            console.log(" [AI Final Answer]:\n", responseMessage.content);
            return responseMessage.content;
        }

        // Execute every tool requested by LLM in this turn
        for (const toolCall of responseMessage.tool_calls) {
            if (toolCall.type !== "function") continue;

            const toolName = toolCall.function.name;
            const toolArgs = toolCall.function.arguments;

            console.log(` [Executing Tool]: ${toolName} with Args: ${toolArgs}`);

            const toolResult = await dispatchToolCall(toolName, toolArgs);

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
            });
        }
    }

    return "Reached maximum execution steps.";
}
