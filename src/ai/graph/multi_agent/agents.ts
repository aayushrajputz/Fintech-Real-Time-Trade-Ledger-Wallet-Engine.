import { ChatOpenAI } from "@langchain/openai";
import { ledgerTools } from "../../ledger.calling.js";
import { z } from "zod";
import { MODEL_CONFIG, } from "../../utils/model.router.js"

export const treasuryTools = ledgerTools.filter((t) => {
    const name = (t as any).function?.name
    return ["get_wallet_balance", "transfer_funds", "get_transaction_history", "search_user"].includes(name)
});

export const tradingTools = ledgerTools.filter((t) => {
    const name = (t as any).function?.name;
    return ["get_market_ticker", "place_trading_order"].includes(name)
});

export const treasuryAgentModel = new ChatOpenAI({
    modelName: MODEL_CONFIG.FAST || "openai/gpt-oss-20b",
    temperature: 0,
}).bindTools(treasuryTools)

export const tradingAgentModel = new ChatOpenAI({
    modelName: MODEL_CONFIG.HEAVY || "openai/gpt-oss-120b",
    temperature: 0,
}).bindTools(tradingTools)


export const SupervisorDecisionSchema = z.object({
    next: z.enum(["treasury", "trading", "FINISH"]).describe("The next specialized worker to act, or FINISH if the user request is completely resolved."),
    reasoning: z.string().describe("Brief explanation of why this routing decision was made."),
    finalAnswer: z.string().nullable().describe("The final user-facing response if 'next' is FINISH.")
})

export type SupervisorDesion = z.infer<typeof SupervisorDecisionSchema>

export const supervisorModel = new ChatOpenAI({
    modelName: MODEL_CONFIG.HEAVY,
    temperature: 0
}).withStructuredOutput(SupervisorDecisionSchema)

