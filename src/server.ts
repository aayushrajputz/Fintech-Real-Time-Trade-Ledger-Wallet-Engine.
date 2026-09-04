import app from "./app.js"
import { env } from "./config/env.config.js"
import "./workers/order.worker.js";

app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
});   