import { kafka } from "../config/kafka.js";
import { prisma } from "../config/db.js";

const consumer = kafka.consumer({ groupId: "settlement-group" });

interface TradeEvent {
    buyOrderId: string;
    sellOrderId: string;
    symbol: string;
    price: number;
    quantity: number;
}

export const runTradeSettlementConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: "trade-events", fromBeginning: false });

        console.log("⚡ Trade Settlement Kafka Consumer Listening on topic: trade-events...");

        await consumer.run({
            eachMessage: async ({ message }) => {
                if (!message.value) return;

                try {
                    const trade: TradeEvent = JSON.parse(message.value.toString());
                    console.log(`💳 [Settling Trade] ${trade.symbol} Qty: ${trade.quantity} @ Price: ${trade.price}`);

                    // Verify if buy & sell orders exist in DB before linking foreign keys
                    const [buyOrder, sellOrder] = await Promise.all([
                        trade.buyOrderId ? prisma.order.findUnique({ where: { id: trade.buyOrderId } }) : null,
                        trade.sellOrderId ? prisma.order.findUnique({ where: { id: trade.sellOrderId } }) : null,
                    ]);

                    if (buyOrder && sellOrder) {
                        await prisma.trade.create({
                            data: {
                                buyOrderId: trade.buyOrderId,
                                sellOrderId: trade.sellOrderId,
                                price: trade.price,
                                quantity: trade.quantity,
                            }
                        });
                        console.log(`✅ Real Trade Settled in DB: ${trade.symbol}`);
                    } else {
                        console.log(`ℹ️ [In-Memory Trade Settled] ${trade.symbol} ${trade.quantity} @ ${trade.price}`);
                    }
                } catch (dbErr) {
                    console.error("❌ Error settling trade event:", dbErr);
                }
            },
        });
    } catch (error) {
        console.error("❌ Trade Settlement Consumer Connection Error:", error);
    }
};
