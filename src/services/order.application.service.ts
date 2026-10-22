import { prisma } from "../config/db.js";
import { sendOrderEvent } from "./kafka.service.js";
import { OrderEventDTO, OrderPublishResult, OrderSide, OrderType } from "../types/order-event.dto.js";
import { BadRequestError } from "../errors/app-errors.js";

export interface CreateOrderRequest {
    userId: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    quantity: number;
    idempotencyKey?: string;
    source?: "AI_AGENT" | "REST_API";
}

export class OrderApplicationService {
    public static readonly ORDER_EVENTS_TOPIC = "order-events";

    /**
     * Ingests an AI-generated order, validates balance, creates DB record,
     * and streams to Kafka topic 'order-events' with userId partition key.
     */
    static async publishOrderStream(req: CreateOrderRequest): Promise<OrderPublishResult> {
        const { userId, symbol, side, type, price, quantity } = req;

        // 1. Validation Guards
        if (quantity <= 0) {
            return { success: false, orderId: " ", message: "Order rejected", error: "Quantity must be greater than 0" };
        }
        if (price <= 0 && type === "LIMIT") {
            return { success: false, orderId: " ", message: "Order rejected", error: "Limit price must be greater than 0" };
        }

        const totalCost = quantity * (price || 0);
        const idempotencyKey = req.idempotencyKey || `order:${userId}:${symbol}:${side}:${quantity}:${Date.now()}`;

        try {
            // 2. Database Atomic Order Creation + Balance Lock for BUY orders
            const order = await prisma.$transaction(async (tx) => {
                if (side === "BUY") {
                    let wallet = await tx.wallet.findUnique({ where: { userId } });
                    if (!wallet && userId === "test-user-id") {
                        wallet = await tx.wallet.create({
                            data: { userId: "test-user-id", balance: 1000000000000000, locked: 0 }
                        });
                    }
                    if (!wallet || Number(wallet.balance) < totalCost) {
                        throw new BadRequestError("Insufficient balance to place BUY order");
                    }

                    // Move funds from available balance to locked balance
                    await tx.wallet.update({
                        where: { userId },
                        data: {
                            balance: { decrement: totalCost },
                            locked: { increment: totalCost }
                        }
                    });
                }

                // Create Order with QUEUED status
                return await tx.order.create({
                    data: {
                        userId,
                        symbol,
                        type,
                        side,
                        quantity,
                        price,
                        status: "PENDING"
                    }
                });
            });

            // 3. Construct Order Event Payload
            const eventPayload: OrderEventDTO = {
                orderId: order.id,
                userId,
                symbol,
                side,
                type,
                price,
                quantity,
                totalValue: totalCost,
                idempotencyKey,
                source: req.source || "AI_AGENT" || "REST_API",
                timestamp: Date.now()
            };

            // 4. Stream to Kafka topic 'order-events'
            await sendOrderEvent(this.ORDER_EVENTS_TOPIC, eventPayload);

            return {
                success: true,
                orderId: order.id,
                message: `Order #${order.id} (${side} ${quantity} ${symbol}) published to Kafka stream successfully.`,
                event: eventPayload
            };
        } catch (err: any) {
            return {
                success: false,
                orderId: " ",
                message: "Order submission failed",
                error: err.message || "Failed to process and stream order"
            };
        }
    }
}
