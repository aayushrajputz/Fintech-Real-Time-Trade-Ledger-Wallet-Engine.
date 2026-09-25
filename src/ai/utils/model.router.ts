export type ModelTier = "FAST" | "HEAVY";

export const MODEL_CONFIG = {
    FAST: "openai/gpt-oss-20b",
    HEAVY: "openai/gpt-oss-120b",
};

export function routeModel(userPrompt: string, historyLength: number): string {
    const complexKeywords = [
        "compare",
        "rebalance",
        "portfolio",
        "calculate",
        "slippage",
        "analyze",
        "audit",
        "advise",
        "strategy",
        "recommend",
        "search",
        "market",
        "coin",
        "graph",
        "chart",
        "trend",
        "volatility",
        "performance",
        "compare",
        "analyze",
        "best",
        "top",
        "research",
    ]
    const lower = userPrompt.toLowerCase();
    const isComplex = complexKeywords.some((k) => lower.includes(k));

    if (isComplex || historyLength > 4) {
        console.log(`Model router: selected Heavy tier model ${MODEL_CONFIG.HEAVY}`);
        return MODEL_CONFIG.HEAVY

    }
    console.log(`Model router: selected Fast tier model ${MODEL_CONFIG.FAST}`);
    return MODEL_CONFIG.FAST;
}
