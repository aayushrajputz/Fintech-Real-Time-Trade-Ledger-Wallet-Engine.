import dotenv from "dotenv";
dotenv.config();

import { insertDocsKnowledge, searchSimilarDocs } from "./vector.repository.js";

async function runVectorRAGTest() {
    console.log("==================================================");
    console.log("🚀 STARTING FINFLOW PGVECTOR RAG TEST");
    console.log("==================================================\n");

    // 1. Seed Financial Compliance Documents into PostgreSQL
    console.log("📥 Step 1: Seeding Compliance Documents with 1536-dim Embeddings...");

    const doc1Id = await insertDocsKnowledge({
        title: "Daily Transfer & Withdrawal Limits",
        content: "Users with Basic Tier can transfer up to $1,000 daily. Verified Pro Tier users have a maximum daily transfer limit of $50,000 with zero fee.",
        category: "COMPLIANCE_POLICY"
    });
    console.log(`✅ Inserted Doc 1: Daily Transfer Limits (ID: ${doc1Id})`);

    const doc2Id = await insertDocsKnowledge({
        title: "Identity Verification & AML KYC Rules",
        content: "Anti-Money Laundering (AML) policy requires Government Photo ID and Proof of Address for all cumulative withdrawals exceeding $2,000. Unverified accounts cannot withdraw large sums.",
        category: "COMPLIANCE_POLICY"
    });
    console.log(`✅ Inserted Doc 2: KYC & AML Rules (ID: ${doc2Id})`);

    const doc3Id = await insertDocsKnowledge({
        title: "Refund and Chargeback Settlement",
        content: "Blockchain and crypto ledger transfers are final and irreversible. Fiat payment reversals require 7 business days for dispute resolution.",
        category: "REFUND_POLICY"
    });
    console.log(`✅ Inserted Doc 3: Refund & Chargebacks (ID: ${doc3Id})\n`);

    // 2. Perform Semantic Vector Search with Unseen Query
    console.log("--------------------------------------------------");
    console.log("🔍 Step 2: Running pgvector Cosine Search (<=>)...");
    const userQuery = "Can I withdraw 10,000 dollars without showing my passport or identity proof?";
    console.log(`User Query: "${userQuery}"`);
    console.log("--------------------------------------------------\n");

    const startTime = Date.now();
    const matchedDocs = await searchSimilarDocs(userQuery, undefined, 2);
    const elapsed = Date.now() - startTime;

    console.log(`⚡ Search completed in ${elapsed}ms!\n`);
    console.log("🎯 TOP MATCHING DOCUMENTS FROM POSTGRESQL:");
    matchedDocs.forEach((doc, idx) => {
        console.log(`[#${idx + 1}] Similarity Score: ${(Number(doc.similarity) * 100).toFixed(2)}%`);
        console.log(`    Title: ${doc.title}`);
        console.log(`    Category: ${doc.category}`);
        console.log(`    Content: "${doc.content}"\n`);
    });

    console.log("==================================================");
    console.log("✅ PGVECTOR RAG TEST COMPLETED SUCCESSFULLY");
    console.log("==================================================");
    process.exit(0);
}

runVectorRAGTest().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
