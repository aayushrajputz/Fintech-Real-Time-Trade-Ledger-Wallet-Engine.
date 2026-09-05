import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

export const getLedgerHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const limit = Math.min(Number(req.query.limit) || 15, 100);
        const cursor = req.query.cursor as string | undefined;

        // Fetch User's Wallet ID
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            return res.status(200).json({
                success: true,
                data: [],
                nextCursor: null
            });
        }

        // Keyset Cursor Pagination Query: O(1) Index Seek
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                walletId: wallet.id,
                ...(cursor ? { id: { lt: cursor } } : {}) // Seek items strictly older than the cursor ID
            },
            take: limit + 1, // Fetch 1 extra to check if more pages exist
            orderBy: {
                id: "desc"
            }
        });

        let nextCursor: string | null = null;
        if (entries.length > limit) {
            const nextItem = entries.pop(); // Remove the 16th item
            nextCursor = nextItem?.id || null;
        }

        return res.status(200).json({
            success: true,
            data: entries,
            nextCursor
        });
    } catch (error) {
        next(error);
    }
};
