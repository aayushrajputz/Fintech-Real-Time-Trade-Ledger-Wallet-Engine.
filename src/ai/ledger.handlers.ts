import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import * as walletRepo from "../repositories/wallet.repository.js";
import * as walletService from "../services/wallet.service.js";
import * as orderService from "../services/order.service.js"



export interface GetWalletBalanceArgs {
    userId: string
}

export async function executeGetWalletBalance(args: GetWalletBalanceArgs) {
    const walletKey = `wallet:${args.userId}`;

    // 1. Direct DB Query for 100% Accuracy (Source of Truth)
    try {
        const wallet = await walletRepo.findByUserId(args.userId);
        if (!wallet) {
            return {
                error: `Wallet not found for userId: ${args.userId}`,
            };
        }

        // 2. Sync / Correct the Redis Cache immediately
        await redis.hset(walletKey, "balance", wallet.balance.toString());
        await redis.hset(walletKey, "locked", wallet.locked.toString());

        return {
            userId: args.userId,
            balance: Number(wallet.balance),
            locked: Number(wallet.locked),
            source: "POSTGRESQL_SYNCED",
        };
    } catch (err: any) {
        // If DB is temporarily down, fallback to Redis Read
        const cachedBalance = await redis.hget(walletKey, "balance");
        const cachedLocked = await redis.hget(walletKey, "locked");

        if (cachedBalance !== null) {
            return {
                userId: args.userId,
                balance: parseFloat(cachedBalance),
                locked: parseFloat(cachedLocked || "0"),
                source: "REDIS_FALLBACK",
            };
        }

        return {
            error: `Failed to fetch wallet: ${err.message}`,
        };
    }
}



export interface TransferFundsArgs {
    senderUserId: string;
    receiverUserId: string;
    amount: number;
}

export async function executeTransferFunds(args: TransferFundsArgs) {
    try {
        const amount = Number(args.amount)
        const result = await walletService.transfer(
            args.senderUserId,
            args.receiverUserId,
            amount
        );

        return {
            success: true,
            senderUserId: args.senderUserId,
            receiverUserId: args.receiverUserId,
            amount: args.amount,
            message: "funds transferred successfully",
            ledgerResult: result
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "Error processing transfer"
        }
    }
}
export interface GetTransactionHistoryArgs {
    userId: string;
    limit?: number;
}

export async function executeGetTransactionHistory(args: GetTransactionHistoryArgs) {
    try {
        const limit = args.limit || 5;
        const history = await walletService.ledgerHistory(args.userId, limit);

        return {
            success: true,
            userId: args.userId,
            count: history.entries.length,
            transactions: history.entries.map((entry) => ({
                id: entry.id,
                type: entry.type,
                amount: Number(entry.amount),
                balanceAfter: Number(entry.balance),
                description: entry.description,
                date: entry.createdAt,
            })),
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "Failed to fetch transaction history",
        };
    }
}
export async function executeSearchUser(args: { query: string }) {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: args.query, mode: "insensitive" } },
                    { email: { contains: args.query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            take: 5,
        });
        if (users.length === 0) {
            return { found: false, message: `No user found matching '${args.query}'` };
        }
        return {
            found: true,
            users: users,
        };
    } catch (err: any) {
        return { found: false, error: err.message };
    }
}
export async function executePlaceTradingOrder(args: {
    userId: string;
    symbol: string;
    side: "BUY" | "SELL";
    price: number;
    quantity: number;
}) {
    try {
        const order = await orderService.placeOrder(
            args.userId,
            args.symbol,
            "LIMIT",
            args.side,
            args.quantity,
            args.price
        );

        return {
            success: true,
            message: "Order placed and queued to Go Matching Engine",
            orderId: order.id,
            symbol: order.symbol,
            side: order.side,
            price: Number(order.price),
            quantity: Number(order.quantity),
            status: order.status,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Failed to place order",
        };
    }
}


export async function executeGetMarketTicker(args: { symbol: string }) {
    try {
        // 1. Clean Symbol format: e.g. "BTC/INR", "ETH", "sol" -> "BTC", "ETH", "SOL"
        const rawSymbol = args.symbol.toUpperCase().replace("/INR", "").replace("/USDT", "").trim();
        const redisKey = `ticker:${rawSymbol}INR`;

        // 2. Fast Path: Check Redis Ticker Cache
        const cachedPrice = await redis.get(redisKey);
        if (cachedPrice) {
            return {
                symbol: `${rawSymbol}/INR`,
                lastPrice: parseFloat(cachedPrice),
                currency: "INR",
                source: "REDIS_LIVE_CACHE",
            };
        }

        // 3. Real-Time Fetch from Global Public Exchange API (Binance USDT -> INR conversion)
        // 1 USD ~ 86.5 INR benchmark
        const USD_TO_INR = 86.5;
        const binancePair = `${rawSymbol}USDT`;

        const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${binancePair}`
        );

        if (response.ok) {
            const data: any = await response.json();
            const priceInUsd = parseFloat(data.price);
            const priceInInr = Math.round(priceInUsd * USD_TO_INR * 100) / 100;

            // Cache in Redis for 10 seconds TTL
            await redis.set(redisKey, priceInInr.toString(), "EX", 10);

            return {
                symbol: `${rawSymbol}/INR`,
                lastPrice: priceInInr,
                priceInUSD: priceInUsd,
                currency: "INR",
                source: "BINANCE_REALTIME_MARKET",
                timestamp: new Date().toISOString(),
            };
        }

        // Fallback if coin not found on Binance
        return {
            symbol: args.symbol,
            error: `Could not fetch live price for symbol '${args.symbol}'. Please check the ticker name (e.g. BTC, ETH, SOL, DOGE).`,
        };
    } catch (err: any) {
        return {
            error: `Live market fetch failed: ${err.message}`,
        };
    }
}
