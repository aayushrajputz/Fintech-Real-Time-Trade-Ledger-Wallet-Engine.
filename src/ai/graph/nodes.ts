import { ChatOpenAI } from "@langchain/openai"
import { AgentState } from "./state.js"
import { ledgerTools } from "../ledger.calling.js";
import { dispatchToolCall, currentAuthUser } from "../runner.js";
import { ToolMessage } from "@langchain/core/messages";
import { pruneConversationHistory } from "../utils/token.manager.js";
import { trackUsage, formatCost } from "../utils/cost.tracker.js";
import { routeModel } from "../utils/model.router.js"

export async function callModelNode(state: AgentState) {
    // 1. DYNAMIC MODEL ROUTING
    const latestUserMsg = state.messages
        .filter((m) => m._getType() === "human" || (m as any).role === "user")
        .pop()?.content?.toString() || "";
    const selectedModelName = routeModel(latestUserMsg, state.messages.length);

    // 2. CONTEXT PRUNING
    const prunedMessages = pruneConversationHistory(state.messages as any, 4000);

    // 3. DYNAMIC MODEL INSTANTIATION
    const model = new ChatOpenAI({
        modelName: selectedModelName,
        temperature: 0,
    }).bindTools(ledgerTools);

    // 4. INVOKE LLM
    const response = await model.invoke(prunedMessages as any);

    // 5. COST & TOKEN TRACKING
    if (response.usage_metadata && currentAuthUser) {
        const metrics = await trackUsage(
            currentAuthUser.id,
            selectedModelName,
            response.usage_metadata.input_tokens,
            response.usage_metadata.output_tokens
        );
        console.log(`[Session Cost]: ${formatCost(metrics.totalCostUSD)} | Total Tokens: ${metrics.totalTokens} | Model: ${selectedModelName}`);
    }

    return {
        messages: [response],
        stepCount: 1
    };
}

export async function callToolNode(state: AgentState) {
    const lastMessage = state.messages[state.messages.length - 1];
    // Agar last message AIMessage nahi hai ya tool_calls nahi hai, return empty
    if (!lastMessage || !("tool_calls" in lastMessage) || !lastMessage.tool_calls) {
        return { messages: [] };
    }
    const toolMessages: ToolMessage[] = [];
    // Saare requested tools ko execute karo
    for (const toolCall of lastMessage.tool_calls as any) {
        console.log(`Graph Tool Node: Executing ${toolCall.name}`);

        // Tere existing dispatchToolCall ko raw string args pass karo
        const rawArgs = typeof toolCall.args === "string"
            ? toolCall.args
            : JSON.stringify(toolCall.args);
        const result = await dispatchToolCall(toolCall.name, rawArgs);
        // OpenAI/LangChain Standard ToolMessage create karo
        toolMessages.push(
            new ToolMessage({
                tool_call_id: toolCall.id ?? " ",
                content: JSON.stringify(result),
                name: toolCall.name,
            })
        );
    }
    // Reducer automatically in naye ToolMessages ko state.messages me concat karega
    return {
        messages: toolMessages,
    };
}

