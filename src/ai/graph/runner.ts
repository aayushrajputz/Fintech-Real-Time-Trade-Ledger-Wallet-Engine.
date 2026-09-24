import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ledgerGraph } from "./graph.js"
import { currentAuthUser } from "../runner.js"


export async function runGraphAgent(userPrompt: string) {
    if (!currentAuthUser) return "Authentication required. Please login first.";


    const initialState = {
        messages: [
            new SystemMessage({
                content: "You are an AI Ledger & Wallet Assistant. You have tools to search users by name, fetch balances, transfer funds, and view history. When user mentions a name like 'Alice' or 'Bob', use 'search_user' tool first to find their UUID."

            }),
            new HumanMessage({ content: userPrompt })
        ],
        senderUserId: (currentAuthUser.id),
        stepCount: 0
    }
    const finalStage = await ledgerGraph.invoke(initialState);
    const lastMessage = finalStage.messages[finalStage.messages.length - 1];
    return lastMessage ? lastMessage.content : "No response generated.";


}

