import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state.js";
import { callModelNode, callToolNode } from "./nodes.js";
import { shouldContinue } from "./edges.js";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";

// 1. Postgres connection pool
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// 2. Postgres Checkpoint Saver
export const checkpointer = new PostgresSaver(pool);

// 3. Setup Tables (Run once: creates `checkpoints`, `checkpoint_blobs`, `checkpoint_writes`)
await checkpointer.setup();

// 4. Initialize Graph Workflow
const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("model", callModelNode)
    .addNode("tools", callToolNode)
    .addEdge(START, "model")
    .addConditionalEdges("model", shouldContinue, ["tools", END])
    .addEdge("tools", "model");

// 5. Compile with Persistent Postgres Checkpointer!
export const ledgerGraph = workflow.compile({
    checkpointer: checkpointer,
});
