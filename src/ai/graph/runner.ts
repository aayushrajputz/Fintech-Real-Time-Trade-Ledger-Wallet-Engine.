import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { multiAgentGraph } from "./multi_agent/graph.js"
import { currentAuthUser, getAgentSystemPrompt } from "../runner.js"


export async function runGraphAgent(userPrompt: string) {
    if (!currentAuthUser) return "Authentication required. Please login first.";

    const config = {
        configurable: {
            thread_id: `user_session_${currentAuthUser.id}`
        }
    };

    const currentState = await multiAgentGraph.getState(config);

    const messagesSend = [];

    if (!currentState.values || !currentState.values.messages || currentState.values.messages.length === 0) {
        messagesSend.push(new SystemMessage({ content: getAgentSystemPrompt(currentAuthUser) }));
    }

    messagesSend.push(new HumanMessage({ content: userPrompt }));

    const finalStage = await multiAgentGraph.invoke({
        messages: messagesSend,
        senderUserId: currentAuthUser.id,
        stepCount: 0
    }, config);

    const lastMessage = finalStage.messages[finalStage.messages.length - 1];
    return lastMessage ? lastMessage.content : "No response generated.";
}

