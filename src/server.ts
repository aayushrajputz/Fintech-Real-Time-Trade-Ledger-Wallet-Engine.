import app from "./app.js"
import { env } from "./config/env.config.js"
import "./workers/order.worker.js";
import { connectKafkaProducer } from "./services/kafka.service.js";
import { runKafkaConsumer } from "./services/kafka.consumer.js";
import { runAnalyticsConsumer } from "./services/analytics.consumer.js";
import { runTradeSettlementConsumer } from "./services/trade-settlement.consumer.js";
import { redis } from "./config/redis.js";

connectKafkaProducer()
runKafkaConsumer();
runAnalyticsConsumer();
runTradeSettlementConsumer();

// Seed test user wallet balance in Redis for load testing
redis.hset("wallet:test-user-id", "balance", "1000000000").catch(() => {});
redis.hset("wallet:test-user-id", "locked", "0").catch(() => {});

app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
});    