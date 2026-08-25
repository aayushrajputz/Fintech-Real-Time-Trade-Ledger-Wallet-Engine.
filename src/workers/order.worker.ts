import { Worker, Job } from "bullmq";
import { queueConnection } from "../config/queue.js";
import { logger } from "../utils/logger.js";

const orderWorker = new Worker(
    "order-processing",
    async (job: Job) => {
        logger.info(`Processing order ${job.id}`, { data: job.data });
        logger.info(`Order job completed ${job.id}`);
    },
    {
        connection: queueConnection,
        concurrency: 5
    }
)

orderWorker.on("failed", (job, error) => {
    logger.error(`Order job failed: ${job?.id}`, error)
})

orderWorker.on("completed", (job) => {
    logger.info(`Order job success: ${job.id}`)
})

export default orderWorker;