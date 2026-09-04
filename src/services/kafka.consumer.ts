import { consumer } from "../config/kafka.js";
import { logger } from "../utils/logger.js";

export const runKafkaConsumer = async () => {
    try {
        await consumer.connect();
        logger.info("Connected to Kafka Consumer successfully");

        await consumer.subscribe({
            topic: "order-events",
            fromBeginning: true
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageValue = message.value?.toString();
                if (!messageValue) return;

                const eventData = JSON.parse(messageValue);

                logger.info(`[Kafka Stream] Received order event Topic: [${topic}] Partition: [${partition}]`, {
                    key: message.key?.toString(),
                    eventData
                });
            }
        });
    } catch (error) {
        logger.error("[Kafka Stream] Failed to Connect or Listen to Kafka", error);
    }
};
