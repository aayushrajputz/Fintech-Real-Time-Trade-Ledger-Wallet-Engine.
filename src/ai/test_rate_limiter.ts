import { checkAiRateLimit } from "./utils/rateLimiter.js";
import { runAgent, setAuthUser } from "./runner.js";

async function runRateLimiterStressTest() {
    console.log("==================================================");
    console.log("🧪 RUNNING AI RATE LIMITER STRESS TEST");
    console.log("==================================================\n");

    const testUser = {
        id: "test_user_rate_limit_123",
        name: "Stress Tester",
        email: "test@finflow.io"
    };

    setAuthUser(testUser);

    const LIMIT = 5;
    const WINDOW = 10; // 10 seconds

    console.log(`📊 Rule: Max ${LIMIT} requests allowed per ${WINDOW} seconds.\n`);

    console.log("--- ⚡ Phase 1: Rapid Fire 8 Requests in Parallel ---");
    const promises = [];
    for (let i = 1; i <= 12; i++) {
        promises.push(
            (async () => {
                const res = await checkAiRateLimit(testUser.id, LIMIT, WINDOW);
                return {
                    reqNum: i,
                    allowed: res.allowed,
                    remaining: res.remaining,
                    retryAfter: res.retryAfterSeconds
                };
            })()
        );
    }

    const results = await Promise.all(promises);
    results.forEach((r) => {
        if (r.allowed) {
            console.log(`✅ Req #${r.reqNum}: ALLOWED (Remaining: ${r.remaining})`);
        } else {
            console.log(`🛑 Req #${r.reqNum}: BLOCKED! Rate limit exceeded (Retry after: ${r.retryAfter}s)`);
        }
    });

    console.log("\n--- ⚡ Phase 2: Testing via End-to-End runAgent Gateway ---");
    const blockedGatewayResponse = await runAgent("What is my balance?");
    console.log(`Gateway Output when blocked:\n"${blockedGatewayResponse}"\n`);
}

runRateLimiterStressTest().catch(console.error);
