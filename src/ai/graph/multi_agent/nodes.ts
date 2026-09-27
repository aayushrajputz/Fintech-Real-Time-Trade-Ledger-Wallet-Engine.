import { AIMessage, BaseMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { AgentState } from "../state.js";
import { supervisorModel, treasuryAgentModel, tradingAgentModel, SupervisorDesion } from "./agents.js";
import { dispatchToolCall, setAuthUser } from "../../runner.js";

export async function supervisorNode(state: AgentState) {
    const supervisorPrompt = new SystemMessage({
        content: `You are the FinFlow Executive AI Supervisor.
        
        You manage two specialized financial worker agents:
        1. 'treasury': Handles wallet balances, P2P transfers, user discovery, and transaction history.
        2. 'trading': Handles real-time crypto prices, Binance market tickers, and orderbook trade execution.
        RULES:
       - Evaluate the user's intent and conversation history.
        - If a task needs treasury action, return next: 'treasury'.
        - If a task needs market prices or trading, return next: 'trading'.
        - If the task is completed or is a conversational greeting/question, return next: 'FINISH' with a clear, professional 'finalAnswer'. `
    })

    const messageWithSupervisorPrompt = [supervisorPrompt, ...state.messages];
    const decision: SupervisorDesion = await supervisorModel.invoke(messageWithSupervisorPrompt)
    console.log(`Decided -> '${decision.next}' (Reason: ${decision.reasoning})`);

    if (decision.next === "FINISH" && decision.finalAnswer) {
        return {
            messages: [new AIMessage({
                content: decision.finalAnswer,

            })],
            stepCount: 1,
            next: "FINISH"
        }
    }
    return {
        stepCount: 1,
        next: decision.next
    }

}

export async function treasuryWorkerNode(state: AgentState) {
    console.log("💼 [Treasury Worker]: Executing wallet & ledger intent...");
    const response = await treasuryAgentModel.invoke(state.messages);
    const newMessages: BaseMessage[] = [response];
    // Agar model ne tools maange hain, execute karo
    if (response.tool_calls && response.tool_calls.length > 0) {
        for (const tc of response.tool_calls) {
            console.log(`⚡ [Treasury Tool]: Executing ${tc.name}`);
            const rawArgs = JSON.stringify(tc.args);
            const result = await dispatchToolCall(tc.name, rawArgs);
            newMessages.push(
                new ToolMessage({
                    tool_call_id: tc.id ?? "",
                    content: JSON.stringify(result),
                    name: tc.name,
                })
            );
        }
    }
    return {
        messages: newMessages,
        stepCount: 1,
    };
}
export async function tradingWorkerNode(state: AgentState) {
    console.log(" Trading Worker: Executing market & orderbook intent...");
    const response = await tradingAgentModel.invoke(state.messages);
    const newMessages: BaseMessage[] = [response];
    // Agar trading tools maange hain, execute karo
    if (response.tool_calls && response.tool_calls.length > 0) {
        for (const tc of response.tool_calls) {
            console.log(` Trading Tool: Executing ${tc.name}`);
            const rawArgs = JSON.stringify(tc.args);
            const result = await dispatchToolCall(tc.name, rawArgs);
            newMessages.push(
                new ToolMessage({
                    tool_call_id: tc.id ?? "",
                    content: JSON.stringify(result),
                    name: tc.name,
                })
            );
        }
    }
    return {
        messages: newMessages,
        stepCount: 1,
    };
}