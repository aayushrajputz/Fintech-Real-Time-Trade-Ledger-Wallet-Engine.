import { runAgent } from "./runner.js";

const ALICE_ID = "ef12f33e-8df8-40e8-98ba-3398ee27df4d";
const BOB_ID = "b50a8841-69c9-4bf5-9524-f6a04efeb4f5";

async function main() {
    console.log("=========================================");
    console.log("🚀 STARTING REAL AI AGENT TEST SUITE");
    console.log("=========================================");

    try {
        // 1. Check Alice's initial balance
        console.log("\n--- TEST 1: Check Alice's Balance ---");
        await runAgent(`What is the current wallet balance for user ${ALICE_ID}?`);

        // 2. Perform Real Transfer via AI
        console.log("\n--- TEST 2: Transfer ₹5,000 from Alice to Bob ---");
        await runAgent(
            `Please transfer 5000 INR from user ${ALICE_ID} to user ${BOB_ID}.`
        );

        // 3. View Alice's Statement
        console.log("\n--- TEST 3: Check Alice's Recent Transactions ---");
        await runAgent(
            `Show me the last 3 transactions from the ledger for user ${ALICE_ID}.`
        );

    } catch (error) {
        console.error("❌ Agent Test Failed:", error);
    }
}

main();
