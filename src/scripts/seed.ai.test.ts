import { prisma } from "../config/db.js";
import * as authService from "../services/auth.service.js";
import * as walletService from "../services/wallet.service.js";

async function seed() {
    console.log("🌱 Seeding Test Users & Wallets in PostgreSQL + Redis...");

    // 1. Create/Get Alice
    const aliceEmail = "alice@example.com";
    let alice = await prisma.user.findUnique({ where: { email: aliceEmail } });

    if (!alice) {
        const res = await authService.signUp("Alice Sharma", aliceEmail, "Password@123");
        alice = res.user as any;
        console.log(" Created Alice User:", alice!.id);
    }

    // Deposit ₹50,000 into Alice's wallet
    await walletService.deposit(alice!.id, 50000);
    console.log(" Deposited ₹50,000 into Alice's wallet.");

    // 2. Create/Get Bob
    const bobEmail = "bob@example.com";
    let bob = await prisma.user.findUnique({ where: { email: bobEmail } });

    if (!bob) {
        const res = await authService.signUp("Bob Verma", bobEmail, "Password@123");
        bob = res.user as any;
        console.log(" Created Bob User:", bob!.id);
    }

    // Deposit ₹10,000 into Bob's wallet
    await walletService.deposit(bob!.id, 10000);
    console.log(" Deposited ₹10,000 into Bob's wallet.");

    console.log("\n=========================================");
    console.log("✅ SEEDING COMPLETE!");
    console.log(`Alice ID: ${alice!.id}`);
    console.log(`Bob ID:   ${bob!.id}`);
    console.log("=========================================");

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
