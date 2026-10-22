export type OrderSide = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET" | "STOP";

export interface OrderEventDTO {
    orderId: string;
    userId: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    quantity: number;
    totalValue: number;
    idempotencyKey: string;
    source: "AI_AGENT" | "REST_API";
    timestamp: number;
}

export interface OrderPublishResult {
    success: boolean,
    orderId: string,
    message: string,
    event?: OrderEventDTO,
    error?: string

}