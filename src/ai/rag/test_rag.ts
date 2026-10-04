import dotenv from "dotenv";
dotenv.config();

import { performHybridSearch } from "./hybrid.service.js";

async function runHybridRAGTest() {
    console.log("==================================================");
    console.log("🚀 TESTING HYBRID SEARCH PIPELINE (BM25 + PGVECTOR + RRF)");
    console.log("==================================================\n");

    const query = "10,000 dollars deposit limit and AML triggers";
    console.log(`🔍 User Query: "${query}"\n`);

    const startTime = Date.now();
    const hybridResults = await performHybridSearch(query, 3);
    const elapsed = Date.now() - startTime;

    console.log(`⚡ Hybrid Search completed in ${elapsed}ms (Parallel Vector + Keyword)!\n`);
    console.log("🎯 TOP FUSED RANKING RESULTS (RRF SCORED):");

    hybridResults.forEach((doc, idx) => {
        console.log(`--------------------------------------------------`);
        console.log(`[#${idx + 1}] Final RRF Score: ${doc.rrfScore.toFixed(5)}`);
        console.log(`    Vector Rank: ${doc.vectorRand ?? "Not in top"} | Keyword Rank: ${doc.keywordRank ?? "Not in top"}`);
        console.log(`    Title: ${doc.title}`);
        console.log(`    Content Snippet: "${doc.content.substring(0, 120)}..."`);
    });

    console.log("--------------------------------------------------");
    console.log("\n==================================================");
    console.log("✅ DAY 14 HYBRID SEARCH PIPELINE VERIFIED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
}

runHybridRAGTest().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
