import { Redis } from "ioredis";
import dotenv from "dotenv";
import { env } from "./env.config.js";
dotenv.config();

export const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
})

redis.on("connect", () => {
    console.log("Redis connected sucessfully");

})

redis.on("error", () => {
    console.error("Redis connection error ")
}) 