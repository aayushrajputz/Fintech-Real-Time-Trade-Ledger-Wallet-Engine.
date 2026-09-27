import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateAnnotation } from "../state.js";
import { supervisorNode, treasuryWorkerNode, tradingWorkerNode } from "./nodes.js";
import { checkpointer } from "../graph.js";
import { supervisorModel } from "./agents.js";

function supervisorRouter(state: AgentState): "treasury" | "trading" | typeof END {
    if (state.stepCount >= 10) return END
    if (state.next === "treasury") return "treasury"
    if (state.next === "trading") return "trading"
    return END


}
const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("supervisor", supervisorNode)
    .addNode("treasury", treasuryWorkerNode)
    .addNode("trading", tradingWorkerNode)
    .addEdge(START, "supervisor")
    .addConditionalEdges("supervisor", supervisorRouter,
        ["treasury", "trading", END])
    .addEdge("treasury", "supervisor")
    .addEdge("trading", "supervisor")

export const multiAgentGraph = workflow.compile({
    checkpointer
})



