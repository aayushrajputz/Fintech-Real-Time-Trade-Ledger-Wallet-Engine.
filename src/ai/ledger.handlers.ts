import { success } from "zod";
import { redis } from "../config/redis.js";
import * as walletRepo from "../repositories/wallet.repository.js";
import * as walletService from "../services/wallet.service.js";


export interface GetWalletBalanceArgs {
    userId: string
}

export async function executeGetWalletBalance(args: GetWalletBalanceArgs) {
    const walletKey = `wallet:${args.userId}`;

    try {
        const cachedBalance = await redis.hget(walletKey, "balance");
        const cachedLocked = await redis.hget(walletKey, "locked");
        if (cachedBalance !== null && cachedLocked !== null) {
            return {
                userId: args.userId,
                balance: parseFloat(cachedBalance),
                locked: parseFloat(cachedLocked),
                source: "REDIS_CACHE",
            };
        }
    } catch (err) {
        console.warn("Redis read failed, falling back to DB");
    }

    try {
        const wallet = await walletRepo.findByUserId(args.userId);
        if (!wallet) {
            return {
                error: `Wallet not found for userId: ${args.userId}`,
            };
        }

        await redis.hset(walletKey, "balance", wallet.balance.toString());
        await redis.hset(walletKey, "locked", wallet.locked.toString());
        return {
            userId: args.userId,
            balance: Number(wallet.balance),
            locked: Number(wallet.locked),
            source: "POSTGRESQL",
        };
    } catch (err: any) {
        return {
            error: `Database lookup failed: ${err.message}`,
        };
    }
}


export interface TransferFundsArgs {
    senderUserId: string;
    reciverUserId: string;
    amount: number;
}

export async function executeTransferFunds(args: TransferFundsArgs) {
    try {
        const result = await walletService.transfer(
            args.senderUserId,
            args.reciverUserId,
            args.amount
        );

        return {
            success: true,
            senderUserId: args.senderUserId,
            reciverUserId: args.reciverUserId,
            amount: args.amount,
            message: "funds transferred successfully",
            ledgerResult: result
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Error processing transfer"
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
