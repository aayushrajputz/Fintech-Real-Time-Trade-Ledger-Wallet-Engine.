import winston from "winston";
import { asyncLocalStorage } from "./async-storage.js";


const correlationFormat = winston.format((info) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
        info.correlationId = store.correlationId;
        if (store.userId) {
            info.userId = store.userId;
        }
    }
    return info;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
        correlationFormat(),
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: "logs/errors.log", level: "error"
        }),
        new winston.transports.File({
            filename: "logs/combined.log", level: "info"
        })
    ]


});