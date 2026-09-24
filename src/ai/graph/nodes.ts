import { ChatOpenAI } from "@langchain/openai"
import { AgentState } from "./state.js"
import { ledgerTools } from "../ledger.calling.js";
import { dispatchToolCall } from "../runner.js";
import { ToolMessage } from "@langchain/core/messages";

export const model = new ChatOpenAI({
    modelName: "gpt-oss-120b",
    temperature: 0,
}).bindTools(ledgerTools);

export async function callModelNode(state: AgentState) {
    const response = await model.invoke(state.messages)
    return { messages: [response], stepCount: 1 }
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

