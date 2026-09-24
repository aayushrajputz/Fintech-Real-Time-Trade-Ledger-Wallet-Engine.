import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ledgerGraph } from "./graph.js"
import { currentAuthUser, getAgentSystemPrompt } from "../runner.js"


export async function runGraphAgent(userPrompt: string) {
    if (!currentAuthUser) return "Authentication required. Please login first.";


    const initialState = {
        messages: [
            new SystemMessage({
                content: getAgentSystemPrompt(currentAuthUser)

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

