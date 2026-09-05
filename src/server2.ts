import app from "./app.js"
import { connectKafkaProducer } from "./services/kafka.service.js";
import { runKafkaConsumer } from "./services/kafka.consumer.js";
import { redis } from "./config/redis.js";

const PORT = 8001;

connectKafkaProducer();
runKafkaConsumer();

// Seed test user wallet balance in Redis for load testing
redis.hset("wallet:test-user-id", "balance", "1000000000").catch(() => {});
redis.hset("wallet:test-user-id", "locked", "0").catch(() => {});

app.listen(PORT, () => {
    console.log(`⚡ Node Instance 2 running on port ${PORT}`);
});
