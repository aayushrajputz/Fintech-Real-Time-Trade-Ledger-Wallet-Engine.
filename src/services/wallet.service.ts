import { BadRequestError } from "../errors/app-errors.js";
import * as walletRepo from "../repositories/wallet.repository.js";
import { redis } from "../config/redis.js";

// Helper: Sync wallet balance from PostgreSQL to Redis Hash
const syncWalletToRedis = async (userId: string) => {
    const wallet = await walletRepo.findByUserId(userId);
    if (wallet) {
        const walletKey = `wallet:${userId}`;
        await redis.hset(walletKey, "balance", Number(wallet.balance).toString());
        await redis.hset(walletKey, "locked", Number(wallet.locked).toString());
    }
};

export const createWallet = async (userId: string) => {
    const existingWallet = await walletRepo.findByUserId(userId);
    if (existingWallet) {
        throw new BadRequestError("Wallet already exists for this user");
    }
    const wallet = await walletRepo.create({ userId });

    // Sync new wallet to Redis (balance = 0, locked = 0)
    await syncWalletToRedis(userId);

    return wallet;
};

export const deposit = async (userId: string, amount: number) => {
    if (amount <= 0) {
        throw new BadRequestError("Deposit amount must be greater than 0");
    }

    const wallet = await walletRepo.findByUserId(userId);
    if (!wallet) {
        throw new BadRequestError("Wallet not found");
    }

    const result = await walletRepo.depositFunds(wallet.id, amount, "Wallet Deposit");

    // Sync updated balance to Redis after successful DB deposit
    await syncWalletToRedis(userId);

    return result;
};

export const withdraw = async (userId: string, amount: number) => {
    if (amount <= 0) {
        throw new BadRequestError("Withdraw amount must be greater than 0");
    }

    const wallet = await walletRepo.findByUserId(userId);
    if (!wallet) {
        throw new BadRequestError("Wallet not found");
    }

    if (Number(wallet.balance) < amount) {
        throw new BadRequestError("Insufficient wallet balance");
    }

    return walletRepo.withdrawFunds(wallet.id, amount, "Wallet Withdraw");
};

export const transfer = async (senderUserId: string, reciverUserId: string, amount: number) => {
    if (amount <= 0) {
        throw new BadRequestError(" Transfer amount must be greater than 0")
    }
    if (senderUserId === reciverUserId) {
        throw new BadRequestError("Cannot transfer fund yourself")
    }
    const senderWallet = await walletRepo.findByUserId(senderUserId)
    if (!senderWallet) {
        throw new BadRequestError("Sender wallet is not found ")
    }
    const reciverWallet = await walletRepo.findByUserId(reciverUserId)
    if (!reciverWallet) {
        throw new BadRequestError("Reciver wallet is not found ")
    }
    if (Number(senderWallet.balance) < amount) {
        throw new BadRequestError("Insufficient wallet balance to Transfer ")
    }
    return walletRepo.transferFunds(senderWallet.id, reciverWallet.id, amount)
}

export const ledgerHistory = async (userId: string, limit: number, cursor?: string) => {
    const wallet = await walletRepo.findByUserId(userId);
    if (!wallet) {
        throw new BadRequestError("Wallet Not found")
    }
    const entries = await walletRepo.getLedgerHistory(wallet.id, limit, cursor);
    const nextCursor = entries.length === limit ? entries[entries.length - 1].id : null;
    return {
        entries,
        nextCursor,
    }
}