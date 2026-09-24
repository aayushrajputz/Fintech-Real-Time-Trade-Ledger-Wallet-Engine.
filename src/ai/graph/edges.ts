import { END } from "@langchain/langgraph";
import { AgentState } from "./state.js";

const MAX_AGENT_STEPS = 8;

export function shouldContinue(state: AgentState): "tools" | typeof END {
    if (state.stepCount >= MAX_AGENT_STEPS) {
        console.warn(`Max steps reached ${MAX_AGENT_STEPS}`)
        return END
    }
    const lastMessage = state.messages[state.messages.length - 1]

    if (lastMessage && "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
        return "tools"
    }
    else {
        return END
    }

}

