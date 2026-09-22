import { describe, it, expect } from "vitest";
import { resolveTradingPair } from "../utils/symbol.resolver.js";
import {
    PlaceTradingOrderSchema,
    GetMarketTickerSchema,
    TransferFundSchema,
    validateToolArgs,
} from "../schema/ledger.schema.js";

describe("🎯 Day 3: Structured Outputs, Dynamic Enum Recovery & DTO Suite", () => {
    describe("1. Dynamic Symbol Normalizer & Fuzzy Matching", () => {
        it("should normalize 'bitcoin' to 'BTC/INR'", () => {
            const resolved = resolveTradingPair("bitcoin");
            expect(resolved.valid).toBe(true);
            expect(resolved.symbol).toBe("BTC/INR");
            expect(resolved.baseAsset).toBe("BTC");
        });

        it("should normalize 'sol' to 'SOL/INR'", () => {
            const resolved = resolveTradingPair("sol");
            expect(resolved.valid).toBe(true);
            expect(resolved.symbol).toBe("SOL/INR");
            expect(resolved.baseAsset).toBe("SOL");
        });

        it("should normalize 'dogecoin' to 'DOGE/INR'", () => {
            const resolved = resolveTradingPair("dogecoin");
            expect(resolved.valid).toBe(true);
            expect(resolved.symbol).toBe("DOGE/INR");
        });

        it("should REJECT unsupported token 'PEPE' with informative supported list", () => {
            const resolved = resolveTradingPair("PEPE");
            expect(resolved.valid).toBe(false);
            expect(resolved.error).toContain("Unsupported asset 'PEPE'");
            expect(resolved.error).toContain("BTC, ETH, SOL");
        });
    });

    describe("2. Zod Transform Integration with PlaceTradingOrderSchema", () => {
        it("should auto-transform 'ethereum' in trading order to 'ETH/INR'", () => {
            const payload = {
                symbol: "ethereum",
                side: "BUY",
                price: 250000,
                quantity: 1.5,
            };

            const result = PlaceTradingOrderSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.symbol).toBe("ETH/INR");
            }
        });

        it("should REJECT unlisted coin inside validateToolArgs for trading order", () => {
            const rawArgs = JSON.stringify({
                symbol: "SHIBA_INU_RANDOM",
                side: "BUY",
                price: 10,
                quantity: 100,
            });

            const result = validateToolArgs("place_trading_order", rawArgs);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("Unsupported asset");
            }
        });

        it("should auto-transform 'solana' in get_market_ticker to 'SOL'", () => {
            const rawArgs = JSON.stringify({
                symbol: "solana",
            });

            const result = validateToolArgs("get_market_ticker", rawArgs);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.symbol).toBe("SOL");
            }
        });
    });
});
