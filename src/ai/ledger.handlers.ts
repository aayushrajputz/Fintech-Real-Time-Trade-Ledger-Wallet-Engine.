import { redis } from "../config/redis.js";
import * as walletRepo from "../repositories/wallet.repository.js";


export interface GetWalletBalanceArgs {
    userId: string
}

export async function executeGetWalletBalance(args: GetWalletBalanceArgs) {
    const walletKey = `wallet: ${args.userId}`
    const cachedBalance = await redis.hget(walletKey, "balance")
    const cachedLocked = await redis.hget(walletKey, "locked amount")

    if (cachedBalance !== null && cachedLocked !== null) {
        return {
            userId: args.userId,
            balance: parseFloat(cachedBalance),
            locked: parseFloat(cachedLocked),
            source: "REDIS_CACHE"

        }
    }
    const wallet = await walletRepo.findByUserId(args.userId)
    if (!wallet) {
        return {
            error: `wallet not found for userId : ${args.userId}`
        }
    }
    await redis.hset(walletKey, "balance", wallet.balance.toString());
    await redis.hset(walletKey, "lockedAmount", wallet.locked.toString())

    return {
        userId: args.userId,
        balance: Number(wallet.balance),
        locked: (wallet.locked),
        source: "postgresql"
    }


} 