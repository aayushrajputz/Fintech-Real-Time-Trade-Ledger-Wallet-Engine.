import { BadRequestError } from "../errors/app-errors.js";
import { prisma } from "../config/db.js";

export const create = async (data: { userId: string }) => {
    return await prisma.wallet.create({
        data: {
            userId: data.userId,
            balance: 0.0,
            locked: 0.0
        }
    });
};


export const findByUserId = async (userId: string) => {
    return await prisma.wallet.findUnique({
        where: { userId }
    });
};



export const depositFunds = async (walletId: string, amount: number, description: string) => {
    return await prisma.$transaction(async (tx: any) => {
        // 1. Update Wallet Balance
        const updatedWallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
                balance: { increment: amount },

            }
        });

        // 2. Log Credit Ledger Entry
        const ledgerEntry = await tx.ledgerEntry.create({
            data: {
                walletId,
                amount,
                type: "CREDIT",
                description,
                balance: updatedWallet.balance
            }
        });

        return { wallet: updatedWallet, ledgerEntry };
    });
};

export const withdrawFunds = async (walletId: string, amount: number, description: string) => {
    return await prisma.$transaction(async (tx: any) => {

        const [wallet] = await tx.$queryRaw<any[]>`
            SELECT * FROM "Wallet" WHERE id = ${walletId} FOR UPDATE
        `;
        if (!wallet) {
            throw new BadRequestError("Wallet not found");
        }

        if (Number(wallet.balance) < amount) {
            throw new BadRequestError("Insufficient wallet balance");
        }

        const updatedWallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
                balance: { decrement: amount }
            }
        });

        const ledgerEntry = await tx.ledgerEntry.create({
            data: {
                walletId,
                amount,
                type: "DEBIT",
                description,
                balance: updatedWallet.balance
            }
        });
        return { wallet: updatedWallet, ledgerEntry };
    });
};
export const transferFunds = async (senderWalletId: string, recepientWalletId: string, amount: number) => {
    return await prisma.$transaction(async (tx: any) => {

        const [firstId, secondId] = senderWalletId < recepientWalletId ? [senderWalletId, recepientWalletId] : [recepientWalletId, senderWalletId];


        await tx.$queryRaw`SELECT * FROM "Wallet" WHERE id = ${firstId} FOR UPDATE`;
        await tx.$queryRaw`SELECT * FROM "Wallet" WHERE id = ${secondId} FOR UPDATE`;


        const senderWallet = await tx.wallet.findUnique({ where: { id: senderWalletId } });
        if (!senderWallet || Number(senderWallet.balance) < amount) {
            throw new BadRequestError("Insufficient wallet balance for transfer");
        }

        // 4. Update balances
        const updatedSenderWallet = await tx.wallet.update({
            where: { id: senderWalletId },
            data: {
                balance:
                    { decrement: amount }
            }
        });

        const updatedReceiverWallet = await tx.wallet.update({
            where: { id: recepientWalletId },
            data: {
                balance:
                    { increment: amount }
            }
        });

        // 5. Create Ledger entries for audit trail
        await tx.ledgerEntry.create({
            data: {
                walletId: senderWalletId,
                amount,
                type: "DEBIT",
                description: "Transfer to wallet",
                balance: updatedSenderWallet.balance
            }
        });

        await tx.ledgerEntry.create({
            data: {
                walletId: recepientWalletId,
                amount,
                type: "CREDIT",
                description: "Transfer from wallet",
                balance: updatedReceiverWallet.balance
            }
        });

        return { senderWallet: updatedSenderWallet, recepientWallet: updatedReceiverWallet };
    });
};

export const getLedgerHistory = async (walletId: string, limit: number, cursor?: string) => {
    return await prisma.ledgerEntry.findMany({
        where: {
            walletId,
        },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
            createdAt: "desc"
        }
    })
}
