import { Request, Response, NextFunction } from "express";
import { asyncLocalStorage } from "../utils/async-storage.js";
import { randomUUID } from "node:crypto";

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers["x-correlation-id"] as string || randomUUID();

    const store = { correlationId }

    res.setHeader("X-correlation-id", correlationId);

    asyncLocalStorage.run(store, () => {
        next();
    });
};