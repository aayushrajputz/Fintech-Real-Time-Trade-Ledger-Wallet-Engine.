import { Worker, Job } from "bullmq";
import { queueConnection } from "../config/queue.js";
import { logger } from "../utils/logger.js";
import * as orderService from "../services/order.service.js";

const orderWorker = new Worker(
    "order-processing",
    async (job: Job) => {
        logger.info(`Processing order ${job.id}`, { data: job.data });

        const { userId, symbol, type, side, quantity, price } = job.data;

        // Actual execution of order matching & ledger updates
        const result = await orderService.placeOrder(
            userId,
            symbol,
            type,
            side,
            quantity,
            price
        );

        return result;
    },
    {
        connection: queueConnection,
        concurrency: 5
    }
);

orderWorker.on("failed", (job, error) => {
    logger.error(`Order job failed: ${job?.id}`, error);
});

orderWorker.on("completed", (job) => {
    logger.info(`Order job success: ${job.id}`);
});

export default orderWorker;
