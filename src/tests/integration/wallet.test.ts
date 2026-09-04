import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Wallet API Integration Tests", () => {
    let authToken = "";

    const user = {
        name: "Wallet Tester",
        email: `wallet_${Date.now()}@example.com`,
        password: "password123"
    };

    beforeAll(async () => {
        const res = await request(app)
            .post("/api/v1/auth/signUp")
            .send(user);



        authToken = res.body.accessToken;

    });

    it("should reject deposit without valid authorization token", async () => {
        const response = await request(app)
            .post("/api/v1/wallet/deposit")
            .send({ amount: 1000, description: "Test Deposit" });

        expect(response.status).toBe(401);
    });

    it("should successfully deposit funds with valid token", async () => {
        const response = await request(app)
            .post("/api/v1/wallet/deposit")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ amount: 5000, description: "Initial Funds" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
