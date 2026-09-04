import app from "./app.js"
import { env } from "./config/env.config.js"
import "./workers/order.worker.js";
import { connectKafkaProducer } from "./services/kafka.service.js";
import { runKafkaConsumer } from "./services/kafka.consumer.js";

connectKafkaProducer()
runKafkaConsumer();

app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
});    