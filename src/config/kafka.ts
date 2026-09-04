import { Kafka, logLevel } from "kafkajs";


export const kafka = new Kafka({
    clientId: "fintech-order-engine",
    brokers: ["localhost:9092"],
    logLevel: logLevel.ERROR,
})

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "order-matching-group" })