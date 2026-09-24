import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ledgerGraph } from "./graph.js"
import { currentAuthUser, getAgentSystemPrompt } from "../runner.js"


export async function runGraphAgent(userPrompt: string) {
    if (!currentAuthUser) return "Authentication required. Please login first.";

    const config = {
        configurable: {
            thread_id: `user_session_${currentAuthUser.id}`
        }
    };

    // 1. Check if state already exists for this thread
    const currentState = await ledgerGraph.getState(config);

    const messagesSend = [];

    // Agar thread bilkul naya hai (empty history), toh pehle SystemMessage inject karo
    if (!currentState.values || !currentState.values.messages || currentState.values.messages.length === 0) {
        messagesSend.push(new SystemMessage({ content: getAgentSystemPrompt(currentAuthUser) }));
    }

    // Naya Human message append karo
    messagesSend.push(new HumanMessage({ content: userPrompt }));

    // 2. Invoke graph with only delta
    const finalStage = await ledgerGraph.invoke({
        messages: messagesSend,
        senderUserId: currentAuthUser.id,
        stepCount: 0
    }, config);

    const lastMessage = finalStage.messages[finalStage.messages.length - 1];
    return lastMessage ? lastMessage.content : "No response generated.";
}

