import { ledgerGraph } from "./graph.js";
import { runGraphAgent } from "./runner.js";
import { setAuthUser } from "../runner.js";

async function main() {
    // 1. Mock session
    const aliceUser = {
        id: "ef12f33e-8df8-40e8-98ba-3398ee27df4d",
        name: "Alice Sharma",
        email: "alice@example.com"
    };
    setAuthUser(aliceUser);

    console.log("--- ⚡ Running 2-Step Agent Conversation ---");
    await runGraphAgent("Check my wallet balance");
    await runGraphAgent("Search for user Bob");

    console.log("\n==================================================");
    console.log("🕰️ TIME-TRAVEL AUDIT TRAIL (Checkpoints Trajectory)");
    console.log("==================================================\n");

    const config = {
        configurable: {
            thread_id: `user_session_${aliceUser.id}`,
        }
    };

    // 2. Fetch Time-Travel State Snapshots (Async Generator)
    const history = ledgerGraph.getStateHistory(config);

    let stepNum = 1;
    for await (const snapshot of history) {
        console.log(`📌 [Snapshot #${stepNum}]`);
        console.log(`  - Checkpoint ID: ${snapshot.config.configurable?.checkpoint_id}`);
        console.log(`  - Next Node to execute: ${snapshot.next.length > 0 ? snapshot.next.join(", ") : "END"}`);
        console.log(`  - Total Messages at this point: ${snapshot.values?.messages?.length || 0}`);

        const lastMsg = snapshot.values?.messages?.[snapshot.values.messages.length - 1];
        if (lastMsg) {
            console.log(`  - Latest Message Type: ${lastMsg._getType?.() || (lastMsg as any).role}`);
            console.log(`  - Message Snippet: ${String(lastMsg.content || "").slice(0, 60)}...`);
        }
        console.log("--------------------------------------------------");
        stepNum++;
    }
}

main().catch(console.error);
