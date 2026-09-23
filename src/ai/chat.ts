import readline from "readline";
import { prisma } from "../config/db.js";
import { runAgent, setAuthUser } from "./runner.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.clear();
console.log("=================================================");
console.log(" FINTECH AI GATEWAY - DYNAMIC AUTH LOGIN");
console.log("=================================================\n");

async function startLogin() {
    rl.question("📧 Enter your email to login (e.g. alice@example.com): ", async (emailInput) => {
        const email = emailInput.trim();

        if (!email) {
            console.log(" Email cannot be empty.");
            return startLogin();
        }

        try {
            // 1. Dynamic DB Lookup for authenticated user
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true, name: true, email: true },
            });

            if (!user) {
                console.log(` No account found with email: ${email}`);
                console.log(" Tip: Use 'alice@example.com' or 'bob@example.com'\n");
                return startLogin();
            }

            // 2. Set dynamic session in AI Agent
            setAuthUser(user);

            console.log(`\n Logged in successfully as: ${user.name} (${user.id})`);
            console.log(" You can now chat naturally with the AI!");
            console.log(" Ask anything related to your Account and real trading market prices data ");

            // 3. Start Chat loop
            promptChat();
        } catch (err: any) {
            console.error(" Login Error:", err.message);
            startLogin();
        }
    });
}

function promptChat() {
    rl.question("👤 You > ", async (input) => {
        const cleanInput = input.trim();

        if (cleanInput.toLowerCase() === "exit" || cleanInput.toLowerCase() === "quit") {
            console.log("\n👋 Exiting AI Session. See you soon!");
            rl.close();
            process.exit(0);
        }

        if (!cleanInput) {
            promptChat();
            return;
        }

        try {
            await runAgent(cleanInput);
        } catch (err: any) {
            console.error("\n❌ Error:", err.message);
        }

        console.log("\n-------------------------------------------------");
        promptChat();
    });
}

// Start
startLogin();
