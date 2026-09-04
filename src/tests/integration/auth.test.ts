import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Authentication API Integration Tests", () => {

    const testUser = {
        name: "Test Engineer",
        email: `test_${Date.now()}@example.com`,
        password: "password123"
    };

    it("should successfully sign up a new user and auto-create wallet", async () => {
        const response = await request(app)
            .post("/api/v1/auth/signUp")
            .send(testUser);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body.user).toHaveProperty("email", testUser.email);
    });

    it("should fail signup if email already exists", async () => {
        const response = await request(app)
            .post("/api/v1/auth/signUp")
            .send(testUser);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    it("should successfully login with correct credentials", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
    });
});
