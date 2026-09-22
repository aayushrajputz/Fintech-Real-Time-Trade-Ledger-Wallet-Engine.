import { z } from "zod";
import { resolveTradingPair } from "../utils/symbol.resolver.js";

export const UserUUIDSchema = z.object({
    userId: z.string().uuid().min(36, "invalid uuid"),


})

export const TransferFundSchema = z.object({
    receiverUserId: z.string().uuid().min(36, "invalid uuid"),
    amount: z.number().positive().max(1000000, "limit exceeded"),


})

export const PlaceTradingOrderSchema = z.object({
    symbol: z.string().transform((val, ctx) => {
        const resolved = resolveTradingPair(val);
        if (!resolved.valid || !resolved.symbol) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: resolved.error || "Invalid trading pair",
            });
            return z.NEVER;
        }
        return resolved.symbol;
    }),
    side: z.enum(["BUY", "SELL"]),
    price: z.number().positive({ message: "Price must be strictly > 0" }),
    quantity: z.number().positive({ message: "Quantity must be strictly > 0" }),
});

export const SearchUserSchema = z.object({
    query: z.string().min(2, "search")
})

export const GetTransactionHistorySchema = z.object({
    limit: z.number().min(1).max(50, "limit exceed").optional()

})

export const GetMarketTickerSchema = z.object({
    symbol: z.string().transform((val, ctx) => {
        const resolved = resolveTradingPair(val);
        if (!resolved.valid || !resolved.baseAsset) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: resolved.error || "Invalid coin symbol",
            });
            return z.NEVER;
        }
        return resolved.baseAsset;
    }),
});

export const GetWalletBalanceSchema = z.object({
    userId: z.string().uuid().optional(),
});

export const ToolValidationSchema: Record<string, z.ZodSchema<any>> = {
    get_wallet_balance: GetWalletBalanceSchema,
    transfer_funds: TransferFundSchema,
    get_transaction_history: GetTransactionHistorySchema,
    search_user: SearchUserSchema,
    place_trading_order: PlaceTradingOrderSchema,
    get_market_ticker: GetMarketTickerSchema,
};
export function validateToolArgs(toolName: string, rawArgs: string) {
    let parsed: any;
    try {
        parsed = JSON.parse(rawArgs);
    } catch (e: any) {
        return { success: false, error: "Malformed JSON payload. Please provide valid JSON." };
    }
    const schema = ToolValidationSchema[toolName];
    if (!schema) {
        return {
            success: false,
            error: `Unknown tool name: ${toolName}`,
        };
    }
    const result = schema.safeParse(parsed);
    if (!result.success) {
        const formattedErrors = result.error.issues

            .map((err) => `[Field: ${err.path.join(".") || "root"}] -> ${err.message}`)
            .join("; ");
        return {
            success: false,
            error: `Validation Error for tool '${toolName}': ${formattedErrors}. Please correct the arguments.`,
        };
    }
    return { success: true, data: result.data };
}




export type TransferFundDTO = z.infer<typeof TransferFundSchema>;
export type PlaceTradingOrderDTO = z.infer<typeof PlaceTradingOrderSchema>;
export type SearchUserDTO = z.infer<typeof SearchUserSchema>;
export type GetTransactionHistoryDTO = z.infer<typeof GetTransactionHistorySchema>;
export type GetMarketTickerDTO = z.infer<typeof GetMarketTickerSchema>;
export type GetWalletBalanceDTO = z.infer<typeof GetWalletBalanceSchema>;
