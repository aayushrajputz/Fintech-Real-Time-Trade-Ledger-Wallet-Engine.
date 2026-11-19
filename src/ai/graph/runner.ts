import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { multiAgentGraph } from "./multi_agent/graph.js"
import { currentAuthUser, getAgentSystemPrompt } from "../runner.js"
import type { Response } from "express";
export interface AuthUserContext {
    id: string;
    name?: string;
    email?: string;
}

export async function runGraphAgent(userPrompt: string) {
    if (!currentAuthUser) return "Authentication required. Please login first.";

    const config = {
        configurable: {
            thread_id: `user_session_${currentAuthUser.id}`
        }
    };

    const currentState = await multiAgentGraph.getState(config);

    const messagesSend = [];

    if (!currentState.values || !currentState.values.messages || currentState.values.messages.length === 0) {
        messagesSend.push(new SystemMessage({ content: getAgentSystemPrompt(currentAuthUser) }));
    }

    messagesSend.push(new HumanMessage({ content: userPrompt }));

    const finalStage = await multiAgentGraph.invoke({
        messages: messagesSend,
        senderUserId: currentAuthUser.id,
        stepCount: 0,
    }, config);

    const lastMessage = finalStage.messages[finalStage.messages.length - 1];
    return lastMessage ? lastMessage.content : "No response generated.";
}

// ─────────────────────────────────────────────────────────────
// Day 20: Real-Time SSE Streaming
// Streams LangGraph execution events to client via Server-Sent Events.
// Tool execution statuses are emitted as separate SSE events so the
// client can render live progress (🔍 Validating → ⚡ Reserving → ✅ Settled).
// ─────────────────────────────────────────────────────────────
const TOOL_STATUS_MAP: Record<string, string> = {
    get_wallet_balance: " Fetching wallet balance...",
    audit_entity_graph: "🕸️ Traversing Knowledge Graph & analyzing multi-hop risk paths...",
    transfer_funds: " Reserving funds & executing transfer...",
    get_transaction_history: " Loading transaction history...",
    search_user: " Searching user...",
    place_trading_order: " Placing trading order on exchange...",
    get_market_ticker: " Fetching live market data...",
};

export async function streamGraphAgent(
    userPrompt: string,
    user: AuthUserContext,
    res: Response,
    signal?: AbortSignal): Promise<void> {
    if (!user) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Authentication required." })}\n\n`);
        res.end();
        return;
    }

    const config = {
        configurable: {
            thread_id: `user_session_${user.id}`
        },
        signal // <-- AbortSignal LangGraph ko pass ho gaya!
    };

    const currentState = await multiAgentGraph.getState(config);
    const messagesSend = [];

    if (!currentState.values?.messages?.length) {
        messagesSend.push(new SystemMessage({ content: getAgentSystemPrompt(user as any) }));
    }
    messagesSend.push(new HumanMessage({ content: userPrompt }));

    // Emit SSE helper
    const emit = (event: string, data: object) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    emit("status", { message: "🧠 Agent thinking..." });

    try {
        // streamEvents(..., { version: "v2" }) real-time sub-token aur tool events yield karta hai
        const eventStream = multiAgentGraph.streamEvents(
            { messages: messagesSend, senderUserId: user.id, stepCount: 0 },
            { ...config, version: "v2" }
        );

        for await (const event of eventStream) {
            // Client agar disconnect ho chuka hai toh loop turant break karo
            if (signal?.aborted) break;

            const eventType = event.event;

            // 1. Live Token Streaming: LLM jab ek-ek word generate karta hai
            if (eventType === "on_chat_model_stream") {
                const chunkContent = event.data?.chunk?.content;
                if (typeof chunkContent === "string" && chunkContent.length > 0) {
                    emit("token", { token: chunkContent });
                }
            }

            // 2. Supervisor Routing Event
            else if (eventType === "on_chain_start" && event.name === "supervisor") {
                emit("status", { message: "🧠 Supervisor analyzing request..." });
            }

            // 3. Tool Execution Started: Client ko UI indicator dikhao
            else if (eventType === "on_tool_start") {
                const toolName = event.name;
                const statusText = TOOL_STATUS_MAP[toolName] ?? `⚙️ Running ${toolName}...`;
                emit("tool_status", { tool: toolName, status: "STARTING", message: statusText });
            }

            // 4. Tool Execution Ended: UI par checkmark
            else if (eventType === "on_tool_end") {
                const toolName = event.name;
                emit("tool_status", { tool: toolName, status: "COMPLETED", message: `✅ Completed ${toolName}` });
            }
        }

        // Final completion state fetch karo definitive summary ke liye
        const finalState = await multiAgentGraph.getState(config);
        const lastMsg = finalState.values?.messages?.at(-1);
        const finalContent = typeof lastMsg?.content === "string"
            ? lastMsg.content
            : JSON.stringify(lastMsg?.content ?? "");

        emit("done", { message: "✅ Agent completed.", final: finalContent });

    } catch (err: any) {
        if (signal?.aborted) {
            emit("status", { message: "⚠️ Execution aborted by client." });
        } else {
            emit("error", { message: err?.message ?? "Internal agent error." });
        }
    } finally {
        res.end();
    }
}