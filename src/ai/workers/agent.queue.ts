import { Queue } from "bullmq"
import { redis } from "../../config/redis.js"


export interface AgentTaskJobData {
    taskId: string,
    userId: string,
    userPrompt: string,
    threadId: string,
    timestamp: number
}

export interface EnqueuedTaskResult {
    jobiId: string,
    status: "QUEUED",
    estimatedWaitMs: number
}

export const agentTaskQueue = new Queue<AgentTaskJobData>("agent-task", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,

    }
})


export async function enqueueAgentTask(
    userId: string,
    userPrompt: string,
    threadId: string
): Promise<EnqueuedTaskResult> {
    const taskId = `task-${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveThreadId = threadId || `thread_${userId}`;

    const job = await agentTaskQueue.add("execute-langgraph-agent",
        {
            taskId,
            userId,
            userPrompt,
            threadId: effectiveThreadId,
            timestamp: Date.now(),
        },
        {
            jobId: taskId,
        }
    )
    return {
        jobiId: job.id as string,
        status: "QUEUED",
        estimatedWaitMs: 150,
    }
}