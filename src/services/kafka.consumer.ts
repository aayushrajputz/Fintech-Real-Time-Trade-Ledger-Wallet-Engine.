import { consumer } from "../config/kafka.js";
import { logger } from "../utils/logger.js";
import { redis } from "../config/redis.js";
import { matchOrder } from "./matching.service.js";
import { prisma } from "../config/db.js";

export const runKafkaConsumer = async () => {
    try {
        await consumer.connect();
        logger.info("Connected to Kafka Consumer successfully");

        await consumer.subscribe({
            topic: "order-events",
            fromBeginning: false
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageValue = message.value?.toString();
                if (!messageValue) return;

                try {
                    const eventData = JSON.parse(messageValue);
                    const orderId = eventData.orderId;

                    // 1. DISTRIBUTED IDEMPOTENT DEDUPLICATION GUARD (Redis SET NX EX 86400)
                    const dedupKey = `order:consumed:${orderId}`;
                    const isNewMessage = await redis.set(dedupKey, "PROCESSING", "EX", 86400, "NX");

                    if (!isNewMessage) {
                        logger.warn(`[Kafka Idempotency] Duplicate delivery skipped for orderId: ${orderId}`);
                        return;
                    }

                    logger.info(`[Kafka Stream] Ingesting order event for matching: ${orderId}`, {
                        key: message.key?.toString(),
                        symbol: eventData.symbol,
                        side: eventData.side,
                        price: eventData.price,
                        quantity: eventData.quantity,
                        source: eventData.source || "AI_AGENT"
                    });

                    // 2. Fetch full DB order and trigger matching engine
                    const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
                    if (dbOrder && dbOrder.status === "PENDING") {
                        await matchOrder(dbOrder);
                        await redis.set(dedupKey, "MATCHED", "EX", 86400);
                        logger.info(`[Kafka Stream] Order ${orderId} matched & settled successfully`);
                    }
                } catch (err: any) {
                    logger.error(`[Kafka Stream Error] Failed processing order event:`, err);
                }
            }
        });
    } catch (error) {
        logger.error("[Kafka Stream] Failed to Connect or Listen to Kafka", error);
    }
};
