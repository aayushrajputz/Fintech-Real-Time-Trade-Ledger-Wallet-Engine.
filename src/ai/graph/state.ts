import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export const AgentStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (existingMessages, newMessages) => {
            return existingMessages.concat(newMessages)
        },
        default: () => []
    }),
    senderUserId: Annotation<string>({
        reducer: (_, next) => next,
        default: () => " "
    }),

    stepCount: Annotation<number>({
        reducer: (current, increment) => current + (increment ?? 1),
        default: () => 0
    })
})

export type AgentState = typeof AgentStateAnnotation.State

