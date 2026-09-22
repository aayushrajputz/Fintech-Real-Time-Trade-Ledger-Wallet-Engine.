export const SUPPORTED_BASE_ASSETS = [
    "BTC",
    "ETH",
    "SOL",
    "DOGE",
    "XRP",
    "ADA",
    "DOT",
    "MATIC",
    "BNB",
    "LTC",
] as const;

export type SupportedBaseAsset = typeof SUPPORTED_BASE_ASSETS[number];

export const ASSET_ALIASES: Record<string, SupportedBaseAsset> = {
    btc: "BTC",
    bitcoin: "BTC",
    eth: "ETH",
    ethereum: "ETH",
    ether: "ETH",
    sol: "SOL",
    solana: "SOL",
    doge: "DOGE",
    dogecoin: "DOGE",
    xrp: "XRP",
    ripple: "XRP",
    ada: "ADA",
    cardano: "ADA",
    dot: "DOT",
    polkadot: "DOT",
    matic: "MATIC",
    polygon: "MATIC",
    bnb: "BNB",
    binance: "BNB",
    ltc: "LTC",
    litecoin: "LTC",
};

export interface ResolvedPair {
    valid: boolean;
    symbol?: string;        // e.g. "BTC/INR"
    baseAsset?: SupportedBaseAsset; // e.g. "BTC"
    quoteAsset?: "INR" | "USDT";
    error?: string;
}

export function resolveTradingPair(rawInput: string, defaultQuote: "INR" | "USDT" = "INR"): ResolvedPair {
    if (!rawInput || typeof rawInput !== "string") {
        return { valid: false, error: "Symbol input must be a non-empty string." };
    }


    const cleaned = rawInput.trim().toLowerCase().replace("/inr", "").replace("/usdt", "").replace("inr", "").replace("usdt", "");


    const matchedAsset = ASSET_ALIASES[cleaned];

    if (!matchedAsset) {
        return {
            valid: false,
            error: `Unsupported asset '${rawInput}'. Supported trading assets on FinFlow are: ${SUPPORTED_BASE_ASSETS.join(", ")}.`,
        };
    }

    return {
        valid: true,
        symbol: `${matchedAsset}/${defaultQuote}`,
        baseAsset: matchedAsset,
        quoteAsset: defaultQuote,
    };
}
