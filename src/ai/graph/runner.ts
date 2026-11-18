import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { multiAgentGraph } from "./multi_agent/graph.js"
import { currentAuthUser, getAgentSystemPrompt } from "../runner.js"
import type { Response } from "express";

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
    get_wallet_balance: "🔍 Fetching wallet balance...",
    transfer_funds: "⚡ Reserving funds & executing transfer...",
    get_transaction_history: "📋 Loading transaction history...",
    search_user: "🔍 Searching user...",
    place_trading_order: "📈 Placing trading order on exchange...",
    get_market_ticker: "📊 Fetching live market data...",
};

export async function streamGraphAgent(userPrompt: string, res: Response): Promise<void> {
    if (!currentAuthUser) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Authentication required." })}\n\n`);
        res.end();
        return;
    }

    const config = {
        configurable: {
            thread_id: `user_session_${currentAuthUser.id}`
        }
    };

    const currentState = await multiAgentGraph.getState(config);
    const messagesSend = [];

    if (!currentState.values?.messages?.length) {
        messagesSend.push(new SystemMessage({ content: getAgentSystemPrompt(currentAuthUser) }));
    }
    messagesSend.push(new HumanMessage({ content: userPrompt }));

    // Emit SSE helper
    const emit = (event: string, data: object) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    emit("status", { message: "🧠 Agent thinking..." });

    try {
        const stream = await multiAgentGraph.stream(
            { messages: messagesSend, senderUserId: currentAuthUser.id, stepCount: 0 },
            { ...config, streamMode: "updates" }
        );

        for await (const chunk of stream) {
            for (const [nodeName, nodeUpdate] of Object.entries(chunk)) {
                const update = nodeUpdate as any;

                // ── Tool execution status events ──────────────────────
                if (nodeName === "tools" || nodeName === "tool_node") {
                    const toolMsgs = update?.messages ?? [];
                    for (const msg of toolMsgs) {
                        const toolName = (msg as any)?.name ?? "unknown_tool";
                        const statusText = TOOL_STATUS_MAP[toolName] ?? `⚙️ Running ${toolName}...`;
                        emit("tool_status", { tool: toolName, message: statusText });
                    }
                }

                // ── Node routing updates (supervisor decisions) ───────
                if (nodeName === "supervisor") {
                    const next = update?.next;
                    if (next && next !== "FINISH") {
                        emit("status", { message: `🔀 Routing to ${next} agent...` });
                    }
                }

                // ── Token streaming for final AI text response ────────
                const messages = update?.messages ?? [];
                for (const msg of messages) {
                    const msgType = (msg as any)?._getType?.() ?? (msg as any)?.type;
                    if (msgType === "ai" || msgType === "AIMessageChunk") {
                        const content = (msg as any)?.content;
                        if (typeof content === "string" && content.trim()) {
                            emit("token", { token: content });
                        }
                        // If streaming chunks (content_blocks / chunks)
                        if (Array.isArray(content)) {
                            for (const block of content) {
                                if (block?.type === "text" && block.text) {
                                    emit("token", { token: block.text });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Final state to get the definitive last message
        const finalState = await multiAgentGraph.getState(config);
        const lastMsg = finalState.values?.messages?.at(-1);
        const finalContent = typeof lastMsg?.content === "string"
            ? lastMsg.content
            : JSON.stringify(lastMsg?.content ?? "");

        emit("done", { message: "✅ Agent completed.", final: finalContent });

    } catch (err: any) {
        emit("error", { message: err?.message ?? "Internal agent error." });
    } finally {
        res.end();
    }
}

