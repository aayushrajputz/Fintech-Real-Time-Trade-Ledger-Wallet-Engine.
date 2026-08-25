import { AsyncLocalStorage } from "node:async_hooks";

export interface LogContext {
    correlationId: string;
    userId?: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

