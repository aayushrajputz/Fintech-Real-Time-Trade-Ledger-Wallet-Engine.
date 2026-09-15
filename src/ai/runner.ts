import OpenAI from "openai";
import { openai } from "./ledger.calling.js";
import { ledgerTools } from "./ledger.calling.js";
import {
    executeGetWalletBalance,
    executeTransferFunds,
    executeGetTransactionHistory,
    executeSearchUser,
    executePlaceTradingOrder,
    executeGetMarketTicker
} from "./ledger.handlers.js";

export async function dispatchToolCall(toolName: string, rawArgs: string) {
    const args = JSON.parse(rawArgs);

    // Security Check: Inject Authenticated User ID if missing
    const userId = currentAuthUser ? currentAuthUser.id : args.userId;

    switch (toolName) {
        case "get_wallet_balance":
            return await executeGetWalletBalance({ ...args, userId: args.userId || userId });

        case "transfer_funds":
            return await executeTransferFunds({ ...args, senderUserId: userId, receiverUserId: args.receiverUserId || args.receiverUserId });

        case "get_transaction_history":
            return await executeGetTransactionHistory({ ...args, userId: args.userId || userId });

        case "search_user":
            return await executeSearchUser(args);

        case "place_trading_order":
            return await executePlaceTradingOrder({ ...args, userId: userId });

        case "get_market_ticker":
            return await executeGetMarketTicker(args);

        default:
            return { error: `Unknown tool requested: ${toolName}` };
    }
}


// Global in-memory conversation state
export let conversationHistory: OpenAI.ChatCompletionMessageParam[] = [
    {
        role: "system",
        content:
            "You are an AI Ledger & Wallet Assistant. You have tools to search users by name, fetch balances, transfer funds, and view history. When user mentions a name like 'Alice' or 'Bob', use 'search_user' tool first to find their UUID.",
    },
];

export async function runAgent(userPrompt: string) {
    conversationHistory.push({
        role: "user",
        content: userPrompt,
    });

    const MAX_STEPS = 5;
    for (let step = 0; step < MAX_STEPS; step++) {
        const response = await openai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: conversationHistory,
            tools: ledgerTools,
            tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;
        conversationHistory.push(responseMessage);

        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
            console.log(" [AI Final Answer]:\n", responseMessage.content);
            return responseMessage.content;
        }

        for (const toolCall of responseMessage.tool_calls) {
            if (toolCall.type !== "function") continue;

            const toolName = toolCall.function.name;
            const toolArgs = toolCall.function.arguments;

            console.log(` [Executing Tool]: ${toolName} with Args: ${toolArgs}`);

            const toolResult = await dispatchToolCall(toolName, toolArgs);

            conversationHistory.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
            });
        }
    }

    return "Reached maximum execution steps.";
}

// 1. Authenticated User Context Interface
export interface AuthUserContext {
    id: string;
    name: string;
    email: string;
}

// Store current logged-in user in memory
export let currentAuthUser: AuthUserContext | null = null;

// Function to set the logged-in session
export function setAuthUser(user: AuthUserContext) {
    currentAuthUser = user;

    // Re-initialize conversation history with user's specific context & security rules
    conversationHistory = [
        {
            role: "system",
            content: `You are an AI Ledger & Trading Assistant for the Fintech exchange.
The CURRENT AUTHENTICATED USER is:
- Name: ${user.name}
- User ID: ${user.id}
- Email: ${user.email}

SECURITY & EXECUTION RULES:
1. Whenever the user refers to "my balance", "my account", or "place order", ALWAYS use their Authenticated User ID (${user.id}).
2. For fund transfers, the sender is ALWAYS the authenticated user (${user.id}).
3. For trading orders, the order owner is ALWAYS the authenticated user (${user.id}).
4. Use 'search_user' only to resolve recipient IDs for transfers.`,
        },
    ];
}
