# ⚡ FinFlow Core: Distributed High-Throughput Ledger Engine & Agentic AI Co-Pilot

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cluster%20%26%20Locking-red?style=flat-square&logo=redis)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Kafka-Event%20Streams-black?style=flat-square&logo=apachekafka)](https://kafka.apache.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-teal?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![OpenAI / Gemini](https://img.shields.io/badge/AI-OpenAI%20%2F%20Function%20Calling-orange?style=flat-square&logo=openai)](https://openai.com/)

> **A high-scale, double-entry financial ledger and matching engine capable of processing 4,200+ RPS with ACID compliance, integrated with a contextual Agentic AI Copilot for autonomous real-time treasury management, live crypto pricing, and trade execution.**

---

## 🏛️ System Architecture

                         ┌────────────────────────────────────────────────────────┐
                         │               Natural Language Prompt                  │
                         │ ("Send ₹500 to Bob and buy 0.05 BTC if balance allows")│
                         └──────────────────────────┬─────────────────────────────┘
                                                    ▼
                                   ┌────────────────────────────────┐
                                   │     Agentic AI Reasoning Layer │
                                   │  (OpenAI Tool Calling Loop)    │
                                   └────────┬──────────────┬────────┘
                                            │              │
               ┌────────────────────────────┘              └──────────────────────────┐
               ▼                                                                      ▼
┌────────────────────────────────┐ ┌────────────────────────────────┐
│  Global Market Ticker Tool     │ │  FinFlow Core Execution Engine │
│ (Binance / CoinGecko Realtime) │ │ (Auth, Balances, Orders, P2P)  │
└────────────────────────────────┘ └──────────────┬─────────────────┘
                                               │
               ┌────────────────────────────────────────┴───────────────────┐
               ▼                                                              ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│  Fast Path: In-Memory         │             │  Durability: Double-Entry DB    │
│  - Redis Distributed Locks    │             │  - PostgreSQL (ACID isolation)│
│  - Atomic Balance Cache       │             │  - Prisma ORM + Optimistic Tx │
│  - Event Stream (Kafka/BullMQ)│             │  - Immutable Audit Ledger Log │
└───────────────────────────────┘             └───────────────────────────────┘


---

## 🌟 Key Highlights & Capabilities

### 1. 🤖 Autonomous Agentic Financial Co-Pilot
* **Context-Aware ReAct Execution:** Multi-turn autonomous tool execution loop with dynamic session and user authentication.
* **Deterministic Tool Invocation:**
  * `get_wallet_balance`: Instant balance lookups leveraging Redis cache with transactional DB fallback.
  * `search_user`: Fuzzy and email-based recipient resolution.
  * `transfer_funds`: Atomic ledger fund transfers with strict validation.
  * `get_market_ticker`: Real-time crypto price engine (USD & INR conversion via live public feeds).
  * `place_trading_order`: Limit/Market order orchestration directly into the matching queue.
* **Hardened Security Invariants:** Sender identities are enforced at runtime via active sessions—preventing argument spoofing and prompt injection attacks.

### 2. ⚡ High-Throughput Distributed Core
* **4,200+ RPS Benchmarked:** Engineered for high-throughput, low-latency financial settlement.
* **Distributed Locking & Concurrency Control:** Redis-backed Redlock / Distributed Locks preventing double-spending and race conditions.
* **Strict Double-Entry Ledger:** Zero-sum accounting invariants ensure debit-credit balances remain mathematically balanced at all times.
* **Dual-Layer Caching & Persistence:** Sub-millisecond reads powered by Redis with write-through / event-driven synchronization to PostgreSQL.

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Runtime & Language** | Node.js (v20+), TypeScript, Modern ESM |
| **Databases & Cache** | PostgreSQL 16, Redis (Key-Value, Hashes, Pub/Sub) |
| **ORM & Data Layer** | Prisma ORM with `@prisma/adapter-pg` pool |
| **Async Messaging** | Apache Kafka, BullMQ |
| **AI & LLM Orchestration** | OpenAI Tool Protocol / Gemini SDK, Custom ReAct Dispatcher |
| **Market Data Providers** | Binance & CoinGecko Public APIs |

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js v20+
* Docker & Docker Compose (for PostgreSQL and Redis)

### 2. Setup Environment
Clone the repository and install dependencies:
```bash
git clone https://github.com/<your-username>/advanced-backend.git
cd advanced-backend
npm install

PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finflow_db?schema=public"
REDIS_URL="redis://localhost:6379"

# AI Configuration
OPENAI_API_KEY="your-openai-or-gemini-key"
OPENAI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/" # Optional for Gemini

# Run database migrations
npx prisma migrate dev

# Seed test users and initial balances
npx tsx src/scripts/seed.ai.test.ts

npx tsx src/ai/chat.ts


=================================================
🤖 WELCOME TO FINFLOW AI FINANCIAL ASSISTANT
=================================================
🔑 Enter your account email to authenticate: alice@example.com
✅ Authenticated as: Alice Sharma (ef12f33e-8df8-40e8-98ba-3398ee27df4d)

👤 You > check my current balance and find out the live price of Bitcoin in INR
⚙️ Agent Thinking] Executing get_wallet_balance...
⚙️ Agent Thinking] Executing get_market_ticker(symbol: "BTC")...
🤖 AI > Your available balance is ₹50,000.00.
Bitcoin (BTC) is currently trading at ₹7,345,210.50 INR ($88,120.00 USD).

👤 You > send ₹5,000 to bob and place a buy order for 0.0005 BTC at market rate
⚙️ Agent Thinking] Executing search_user(query: "bob")...
⚙️ Agent Thinking] Executing transfer_funds(amount: 5000, recipient: "b50a8841-...")
⚙️ Agent Thinking] Executing place_trading_order(symbol: "BTC", side: "BUY", quantity: 0.0005)...
🤖 AI > Transferred ₹5,000 to Bob successfully.
Order placed: BUY 0.0005 BTC at Market Price (Order ID: ord_8f93a12). Remaining Balance: ₹41,327.40.

