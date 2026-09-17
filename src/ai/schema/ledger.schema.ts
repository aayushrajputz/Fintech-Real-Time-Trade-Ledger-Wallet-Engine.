import { z } from "zod";

export const UserUUIDSchema = z.object({
    userId: z.string().uuid().min(36, "invalid uuid"),


})

export const TransferFundSchema = z.object({
    receiverUserId: z.string().uuid().min(36, "invalid uuid"),
    amount: z.number().positive().max(1000000, "limit exceeded"),


})

export const PlaceTradingOrderSchema = z.object({
    symbol: z.string().regex(/^[A-Z0-9]{2,10}(\/(INR|USDT))?$/i, "Invalid pair format"),
    side: z.enum(["BUY", "SELL"]),
    price: z.number().positive(),
    quantity: z.number().positive(),

})

export const SearchUserSchema = z.object({
    query: z.string().min(2, "search")
})

export const GetTransactionHistorySchema = z.object({
    limit: z.number().min(1).max(50, "limit exceed").optional()

})

export const GetMarketTickerSchema = z.object({
    symbol: z.string().min(2, "Symbol must be at least 2 chars")
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