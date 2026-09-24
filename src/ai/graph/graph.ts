import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state.js";
import { callModelNode, callToolNode } from "./nodes.js";
import { shouldContinue } from "./edges.js";

// 1. Initialize Graph with State Annotation
const workflow = new StateGraph(AgentStateAnnotation)
    // 2. Add Worker Nodes
    .addNode("model", callModelNode)
    .addNode("tools", callToolNode)

    // 3. Define Flow: START -> model
    .addEdge(START, "model")

    // 4. Conditional Edge: Model ke baad kya tools chalane hain ya END?
    .addConditionalEdges("model", shouldContinue, ["tools", END])

    // 5. Fixed Edge: Tools chalne ke baad wapas model ko info do!
    .addEdge("tools", "model");

// 6. Compile the graph into an executable Runnable
export const ledgerGraph = workflow.compile();
