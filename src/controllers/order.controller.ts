import { Request, Response, NextFunction } from "express";
import { orderQueue } from "../config/queue.js";
import { sendOrderEvent } from "../services/kafka.service.js";
import { reserveBalanceAtomic } from "../scripts/wallet.lua.js";
import { BadRequestError } from "../errors/app-errors.js";

export const placeOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { symbol, type, side, quantity, price } = req.body;
        const userId = (req as any).user.id;

        // Step 1: Redis Lua Atomic Balance Check (<1ms in-memory)
        const totalCost = quantity * price;
        const balanceReserved = await reserveBalanceAtomic(userId, totalCost);

        if (!balanceReserved) {
            throw new BadRequestError("Insufficient wallet balance (Redis pre-check)");
        }

        const orderData = {
            userId,
            symbol,
            type,
            side,
            quantity,
            price,
            createdAt: new Date()
        };

        // Step 2: Queue for background processing
        const job = await orderQueue.add("process-order", orderData);

        // Step 3: Stream event to Kafka consumers
        await sendOrderEvent("order-events", orderData);

        return res.status(202).json({
            success: true,
            message: "Order placed successfully and is being processed",
            data: {
                jobId: job.id,
                status: "PENDING"
            }
        });
    } catch (error) {
        next(error);
    }
};
