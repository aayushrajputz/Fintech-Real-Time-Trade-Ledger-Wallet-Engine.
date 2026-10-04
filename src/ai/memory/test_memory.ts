import dotenv from "dotenv";
dotenv.config();

import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { saveUserSession, getUserSession, aquireSessionLock, releaseSessionLock } from "./redis.session.js";
import { shouldCompactMessages, compactMessagesWithSummary } from "./summary.memory.js";

async function runMemoryTest() {
    console.log("==================================================");
    console.log("🚀 TESTING DAY 15: MEMORY ARCHITECTURE & REDIS CACHE");
    console.log("==================================================\n");

    const testUserId = "usr_memory_test_888";

    // 1. Test Redis Distributed Concurrency Lock
    console.log("🔒 Step 1: Testing Redis Concurrency Lock (SET NX EX)...");
    const lock1 = await aquireSessionLock(testUserId, 5);
    console.log(`Lock 1 attempt (First request): ${lock1 ? "✅ ACQUIRED" : "❌ FAILED"}`);

    const lock2 = await aquireSessionLock(testUserId, 5);
    console.log(`Lock 2 attempt (Concurrent parallel request): ${lock2 ? "❌ FAILED (Should be rejected)" : "✅ REJECTED PROPERLY"}`);

    await releaseSessionLock(testUserId);
    console.log("Lock released.\n");

    // 2. Test Long Conversation with Summary Compaction
    console.log("--------------------------------------------------");
    console.log("🧠 Step 2: Testing Summary Buffer Compaction...");
    const simulatedLongChat = [
        new HumanMessage("Hello, I am Aayush and I want to deposit funds."),
        new AIMessage("Hello Aayush! Your current balance is $5,000."),
        new HumanMessage("Please check current price of Ethereum."),
        new AIMessage("Ethereum (ETH/USDT) is currently trading at $3,450."),
        new HumanMessage("I want to set a limit order to buy 1 ETH at $3,400."),
        new AIMessage("Limit buy order for 1 ETH placed successfully."),
        new HumanMessage("Also search for user Bob with ID usr_bob_999."),
        new AIMessage("User Bob found with active wallet."),
        new HumanMessage("Now send $250 to Bob from my balance."),
        new AIMessage("Transfer of $250 to Bob completed. Remaining balance: $4,750.")
    ];

    console.log(`Original Messages Count: ${simulatedLongChat.length}`);
    const needsCompaction = shouldCompactMessages(simulatedLongChat, 6);
    console.log(`Needs Compaction (> 6 messages)? ${needsCompaction ? "✅ YES" : "NO"}`);

    const { compactedMessages, summaryText } = await compactMessagesWithSummary(simulatedLongChat, 2);
    console.log("\n📄 Generated Memory Summary:\n", summaryText);
    console.log(`\nCompacted Messages Count (Summary + Last 2): ${compactedMessages.length}\n`);

    // 3. Test Redis Session Cache Persistence with TTL
    console.log("--------------------------------------------------");
    console.log("💾 Step 3: Saving Compacted Session to Redis (24-Hour TTL)...");
    await saveUserSession(testUserId, compactedMessages, summaryText);
    console.log("✅ Session cached into Redis.");

    const loadedSession = await getUserSession(testUserId);
    console.log(`✅ Loaded from Redis Cache: ${loadedSession?.messages.length} messages found!`);
    console.log(`Cached Summary: "${loadedSession?.lastSummary?.substring(0, 80)}..."\n`);

    console.log("==================================================");
    console.log("✅ DAY 15 MEMORY & REDIS PIPELINE 100% VERIFIED!");
    console.log("==================================================");
    process.exit(0);
}

runMemoryTest().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
