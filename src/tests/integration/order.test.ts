import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Order Engine & Queue Integration Tests", () => {
    let authToken = "";

    const user = {
        name: "Order Tester",
        email: `order_${Date.now()}@example.com`,
        password: "password123"
    };

    beforeAll(async () => {
        const res = await request(app)
            .post("/api/v1/auth/signUp")
            .send(user);

        authToken = res.body.data.accessToken;

        await request(app)
            .post("/api/v1/wallet/deposit")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ amount: 100000, description: "Capital" });
    });

    it("should place order, return 202 Accepted, and push to queue", async () => {
        const idempotencyKey = `test-idemp-${Date.now()}`;

        const response = await request(app)
            .post("/api/v1/order/place")
            .set("Authorization", `Bearer ${authToken}`)
            .set("X-Idempotency-Key", idempotencyKey)
            .send({
                symbol: "BTC_USDT",
                type: "LIMIT",
                side: "BUY",
                quantity: 1,
                price: 45000
            });

        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("jobId");
        expect(response.body.data.status).toBe("PENDING");
    });
});
