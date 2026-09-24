import OpenAI from "openai";
import { validateToolArgs } from "./schema/ledger.schema.js";
import { runGraphAgent } from "./graph/runner.js";
import {
    executeGetWalletBalance,
    executeTransferFunds,
    executeGetTransactionHistory,
    executeSearchUser,
    executePlaceTradingOrder,
    executeGetMarketTicker
} from "./ledger.handlers.js";
import { checkAiRateLimit } from "./utils/rateLimiter.js";
import { IdempotencyCheck } from "./utils/idempotency.js";


export async function dispatchToolCall(toolName: string, rawArgs: string) {


    if (!currentAuthUser) {
        return { error: "UNAUTHORIZED: No active user session." };
    }
    const sessionUserId = currentAuthUser.id
    const validation = validateToolArgs(toolName, rawArgs);
    if (!validation.success) {
        return {
            success: false,
            error: validation.error,
        };
    }
    const args = validation.data;
    if (args.receiverUserId === currentAuthUser?.id) {
        return { error: "receiver cannot be same as sender" }
    }

    switch (toolName) {
        case "get_wallet_balance":
            return await executeGetWalletBalance({ userId: sessionUserId });
        case "transfer_funds":

            const idempotencyKey = `tx:${currentAuthUser.id}:${args.receiverUserId}:${args.amount}`;
            const lock = await IdempotencyCheck.checkAndLock(idempotencyKey)
            if (lock.isDuplicate) {
                if (lock.status === "COMPLETED") {
                    return { cached: true, ...lock.cachedResult }
                }
                return { error: "Transaction already in progress" }
            }
            try {
                const result = await executeTransferFunds({
                    senderUserId: currentAuthUser.id,
                    receiverUserId: args.receiverUserId,
                    amount: args.amount,
                });
                // Save successful result
                await IdempotencyCheck.saveResults(idempotencyKey, result);
                return result;
            } catch (err: any) {
                // Error aaya toh lock release karo taaki user retry kar sake
                await IdempotencyCheck.releaseLock(idempotencyKey);
                return { error: err.message };
            }


        case "get_transaction_history":
            return await executeGetTransactionHistory({
                userId: sessionUserId,
                limit: args.limit || 5,
            });
        case "search_user":
            return await executeSearchUser(args);

        case "place_trading_order":
            return await executePlaceTradingOrder({
                userId: sessionUserId,
                symbol: args.symbol,
                side: args.side,
                price: args.price,
                quantity: args.quantity,
            });
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
    if (!currentAuthUser) {
        return "Authentication required. Please login first"
    }
    const rateLimiter = await checkAiRateLimit(currentAuthUser.id, 10, 60);
    if (!rateLimiter.allowed) {
        return `Rate limit exceeded. Please try again after ${rateLimiter.retryAfterSeconds} seconds`
    }
    const promptCheck = sanitizeUserPrompt(userPrompt);
    if (!promptCheck.safe) {
        return promptCheck.reason;
    }
    return await runGraphAgent(userPrompt);


}

export function sanitizeUserPrompt(prompt: string): { safe: boolean; reason?: string } {
    const maliciousPatterns = [
        /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
        /system\s+override/i,
        /you\s+are\s+now\s+(in\s+)?(developer|dan|unrestricted)\s+mode/i,
        /bypass\s+(all\s+)?(security|rules|guardrails)/i,
        /admin\s+privilege/i,
        /as\s+root\s+user/i,
    ];

    for (const pattern of maliciousPatterns) {
        if (pattern.test(prompt)) {
            return {
                safe: false,
                reason: "SECURITY VIOLATION: Adversarial prompt injection. Request rejected.",
            };
        }
    }

    return { safe: true };
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
}

// Function to get the dynamically generated system prompt for the current user
export function getAgentSystemPrompt(user: AuthUserContext): string {
    return `You are FinFlow AI - an Enterprise Ledger & Trading Assistant.
CURRENT AUTHENTICATED USER CONTEXT:
- Name: ${user.name}
- User ID: ${user.id}
- Email: ${user.email}

STRICT FINANCIAL SAFETY & COMPLIANCE GUARDRAILS:
1. IDENTITY & PRIVACY LOCK:
   - You can ONLY view wallet balance and transaction history for the logged-in user: ${user.name} (${user.id}).
   - REJECT any request to check other users' balances or wallets immediately. NEVER offer to view another user's balance.
2. SENDER & RECEIVER RULES:
   - You can NEVER initiate transfers where the sender is not ${user.id}.
   - The sender and receiver CANNOT be the same person. If user says "send me money" or transfers to themselves, REJECT immediately with: "Invalid Operation: You cannot transfer funds to yourself."
3. AUTONOMOUS TRANSFER CHAINING:
   - When user asks to transfer to someone by name/email (e.g. "Send 500 to Bob"), follow this exact deterministic flow:
     Step 1: Use 'search_user' to get the recipient's UUID.
     Step 2: Directly execute 'transfer_funds' with the recipient's UUID and amount.
     Step 3: Confirm transfer with transaction status.
   - Do NOT ask conversational questions if you already found the recipient. Execute the transfer!
4. STRICT INPUT REJECTION:
   - If user provides negative or zero amount, REJECT IT IMMEDIATELY.
5. IMMUTABILITY OF LEDGER:
   - Once executed, transactions cannot be reversed or refunded.
6. REAL-TIME MARKET INTELLIGENCE:
   - Use 'get_market_ticker' for live crypto prices.
   - Use 'place_trading_order' for executing trades.`;
}
