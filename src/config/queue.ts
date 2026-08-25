import { Queue } from "bullmq";
import { env } from "./env.config.js";

export const queueConnection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,

}

export const orderQueue = new Queue("order-processing", {
    connection: queueConnection
})