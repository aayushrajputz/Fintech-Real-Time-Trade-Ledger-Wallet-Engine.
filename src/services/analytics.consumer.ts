
import { kafka } from "../config/kafka.js"
import { logger } from "../utils/logger.js"

const analyticsConsumer = kafka.consumer({ groupId: "analytics-group" });

export const runAnalyticsConsumer = async () => {
    try {
        await analyticsConsumer.connect();
        logger.info("[Kafka Analytics Service] Connected successfully")
        await analyticsConsumer.subscribe({ topic: "order-events", fromBeginning: true });
        await analyticsConsumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageValue = message.value?.toString();
                if (!messageValue)
                    return
                const eventData = JSON.parse(messageValue)
                logger.info(`Analytics Stream Logged Transaction for audit: Order by user[${eventData.userId}] for symbol[${eventData.symbol}]`)
            }
        })
    } catch (error) {
        logger.error("[Kafka Analytics Service] Failed to connect or listen to Kafka", error);
    }
}