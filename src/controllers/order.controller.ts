import { Request, Response, NextFunction } from "express";
import { orderQueue } from "../config/queue.js";
import { sendOrderEvent } from "../services/kafka.service.js";

export const placeOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { symbol, type, side, quantity, price } = req.body;
        const userId = (req as any).user.id;

        const orderData = {
            userId,
            symbol,
            type,
            side,
            quantity,
            price,
            createdAt: new Date()
        };

        const job = await orderQueue.add("process-order", orderData);

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
