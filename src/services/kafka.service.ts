import { producer } from "../config/kafka.js"
import { logger } from "../utils/logger.js"

export const connectKafkaProducer = async () => {
    try {
        await producer.connect();
        logger.info("Kafka producer connected sucessfully")
    } catch (error) {
        logger.error("Kafka producer connection failed", error)
    }
}


export const sendOrderEvent = async (topic: string, eventData: any) => {
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: eventData.userId || "order-key",
                    value: JSON.stringify(eventData),
                }
            ]
        });

    } catch (err) {
        logger.error(`Failed to publish order event to kafka : `, err);
    }
} 