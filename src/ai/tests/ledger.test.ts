import { describe, it, expect, beforeEach } from "vitest";
import { validateToolArgs } from "../schema/ledger.schema.js";
import { dispatchToolCall, setAuthUser } from "../runner.js";

describe("🛡️ Day 2: Zod Runtime Validation & Auth Security Suite", () => {
    const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Alice Tester",
        email: "alice@test.com",
    };

    const targetReceiver = "987fcdeb-51a2-43f7-9abc-def012345678";


    beforeEach(() => {
        setAuthUser(mockUser);
    });

    describe("1. Zod Boundary & Input Validation", () => {
        it("should REJECT negative transfer amount", () => {
            const rawArgs = JSON.stringify({
                receiverUserId: targetReceiver,
                amount: -500,
            });
            const result = validateToolArgs("transfer_funds", rawArgs);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("Validation Error");
            }
        });

        it("should REJECT transfer amount > ₹10,00,000", () => {
            const rawArgs = JSON.stringify({
                receiverUserId: targetReceiver,
                amount: 5000000,
            });
            const result = validateToolArgs("transfer_funds", rawArgs);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("limit exceeded");
            }
        });

        it("should REJECT invalid UUID format", () => {
            const rawArgs = JSON.stringify({
                receiverUserId: "invalid-hacker-id",
                amount: 100,
            });
            const result = validateToolArgs("transfer_funds", rawArgs);
            expect(result.success).toBe(false);
        });

        it("should ACCEPT valid trading order", () => {
            const rawArgs = JSON.stringify({
                symbol: "BTC/INR",
                side: "BUY",
                price: 8500000,
                quantity: 0.1,
            });
            const result = validateToolArgs("place_trading_order", rawArgs);
            expect(result.success).toBe(true);
        });
    });

    describe("2. Auth Security & Business Rules", () => {
        it("should REJECT self-transfer (Sender == Receiver)", async () => {
            const rawArgs = JSON.stringify({
                receiverUserId: mockUser.id, // Alice sending to Alice
                amount: 500,
            });
            const result: any = await dispatchToolCall("transfer_funds", rawArgs);
            expect(result.error).toContain("receiver cannot be same as sender");
        });
    });
});
