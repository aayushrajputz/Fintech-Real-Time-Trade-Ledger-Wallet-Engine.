import { IdempotencyCheck } from "../ai/utils/idempotency.js";
import * as walletService from "./wallet.service.js";
import { BadRequestError } from "../errors/app-errors.js";

export interface SafeTransferDTO {
    senderUserId: string;
    receiverUserId: string;
    amount: number;
    customIdempotencyKey?: string;
}

export interface SafeTransferResponse {
    success: boolean;
    transactionId?: string;
    senderUserId: string;
    receiverUserId: string;
    amount: number;
    message: string;
    cached?: boolean;
    error?: string;
}

export class WalletApplicationService {
    public static readonly MAX_SINGLE_TRANSFER_LIMIT = 100000; // ₹1,00,000

    /**
     * Hardened Application Service Layer for P2P Transfers.
     * Encapsulates:
     *  1. Invariant Policy Checks (Amount, Same-user guard, Upper limits)
     *  2. Distributed Idempotency Lock via Redis (SETNX EX 60)
     *  3. Atomic PostgreSQL Ledger settlement + Redis Sync
     *  4. 24h Result Caching for Duplicate Submissions
     */
    static async executeSafeP2PTransfer(dto: SafeTransferDTO): Promise<SafeTransferResponse> {
        const { senderUserId, receiverUserId, amount } = dto;

        // 1. POLICY GUARDS
        if (amount <= 0) {
            return {
                success: false,
                senderUserId,
                receiverUserId,
                amount,
                message: "Transfer rejected",
                error: "Amount must be strictly greater than 0.",
            };
        }

        if (senderUserId === receiverUserId) {
            return {
                success: false,
                senderUserId,
                receiverUserId,
                amount,
                message: "Transfer rejected",
                error: "Sender and receiver cannot be the same user account.",
            };
        }

        if (amount > this.MAX_SINGLE_TRANSFER_LIMIT) {
            return {
                success: false,
                senderUserId,
                receiverUserId,
                amount,
                message: "Transfer rejected",
                error: `Transfer amount (₹${amount}) exceeds max single transaction limit of ₹${this.MAX_SINGLE_TRANSFER_LIMIT}.`,
            };
        }

        // 2. DISTRIBUTED IDEMPOTENCY LOCK
        const idempotencyKey = dto.customIdempotencyKey || `tx:${senderUserId}:${receiverUserId}:${amount}`;
        const lock = await IdempotencyCheck.checkAndLock(idempotencyKey);

        if (lock.isDuplicate) {
            if (lock.status === "COMPLETED" && lock.cachedResult) {
                return {
                    cached: true,
                    ...lock.cachedResult,
                };
            }
            return {
                success: false,
                senderUserId,
                receiverUserId,
                amount,
                message: "Request throttled",
                error: "Identical transaction is already being processed.",
            };
        }

        try {
            // 3. ATOMIC LEDGER EXECUTION (DB + Redis Cache Sync)
            const result = await walletService.transfer(senderUserId, receiverUserId, amount);

            const response: SafeTransferResponse = {
                success: true,
                transactionId: (result as any)?.id || `tx_${Date.now()}`,
                senderUserId,
                receiverUserId,
                amount,
                message: `Successfully transferred ₹${amount} from ${senderUserId} to ${receiverUserId}.`,
            };

            // 4. PERSIST IDEMPOTENCY RESULT (24H TTL)
            await IdempotencyCheck.saveResults(idempotencyKey, response);

            return response;
        } catch (err: any) {
            // Release lock on failure so the client can retry
            await IdempotencyCheck.releaseLock(idempotencyKey);

            return {
                success: false,
                senderUserId,
                receiverUserId,
                amount,
                message: "Transfer failed",
                error: err instanceof BadRequestError ? err.message : err.message || "Internal transfer error",
            };
        }
    }
}
