# ⚡ FinFlow Core: Distributed High-Throughput Ledger Engine & Agentic AI Co-Pilot

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cluster%20%26%20Locking-red?style=flat-square&logo=redis)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Kafka-Event%20Streams-black?style=flat-square&logo=apachekafka)](https://kafka.apache.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-teal?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![OpenAI / Gemini](https://img.shields.io/badge/AI-OpenAI%20%2F%20Function%20Calling-orange?style=flat-square&logo=openai)](https://openai.com/)

> **A high-scale, double-entry financial ledger and matching engine capable of processing 4,200+ RPS with ACID compliance, integrated with a contextual Agentic AI Copilot for autonomous real-time treasury management, account statements, peer-to-peer transfers, live crypto pricing, and trade execution.**

---

## 🏛️ System Architecture

                         ┌────────────────────────────────────────────────────────┐
                         │               Natural Language Prompt                  │
                         │ ("Send ₹500 to Bob, show last 3 txns, check BTC rate") │
                         └──────────────────────────┬─────────────────────────────┘
                                                    ▼
                                   ┌────────────────────────────────┐
                                   │     Agentic AI Reasoning Layer │
                                   │  (OpenAI Tool Calling Loop)    │
                                   └────────┬──────────────┬────────┘
                                            │              │
               ┌────────────────────────────┘              └──────────────────────────┐
               ▼                                                                      ▼
    ┌────────────────────────────────┐ ┌────────────────────────────────┐ │ Global Market Ticker Tool │ │ FinFlow Core Execution Engine │ │ (Binance / CoinGecko Realtime) │ │ (Auth, Balances, Orders, P2P) │ └────────────────────────────────┘ └──────────────┬─────────────────┘ │ ┌────────────────────────────────────────┴───────────────────┐ ▼ ▼ ┌───────────────────────────────┐ ┌───────────────────────────────┐ │ Fast Path: In-Memory │ │ Durability: Double-Entry DB │ │ - Redis Distributed Locks │ │ - PostgreSQL (ACID isolation)│ │ - Atomic Balance Cache │ │ - Prisma ORM + Optimistic Tx │ │ - Event Stream (Kafka/BullMQ)│ │ - Immutable Audit Ledger Log │ └───────────────────────────────┘ └───────────────────────────────┘

    
---

##  AI Financial Tools & Capability Matrix

The Agentic Copilot dynamically plans, chains, and executes the following 6 core deterministic tools to satisfy complex, multi-step natural language commands:

| Tool Name | Operation | Description | Backend Engine / Invariant |
|---|---|---|---|
| `get_wallet_balance` | **Instant Balance Lookup** | Fetches available funds and locked collateral in real-time. | Served sub-millisecond via **Redis Hash Cache** with PostgreSQL fallback. |
| `search_user` | **Smart User Discovery** | Resolves names/emails (e.g. *"Bob"*, *"alice@gmail.com"*) to immutable UUIDs. | Fuzzy & indexed lookups in PostgreSQL to safely locate recipient IDs. |
| `transfer_funds` | **P2P Instant Settlement** | Atomically moves funds between sender and receiver wallets. | **Double-entry bookkeeping** with Redis balance sync and debit/credit ledger records. |
| `get_transaction_history` | **Account Statement & Audit** | Fetches recent ledger transactions, statements, and audit logs. | Cursor/Limit paginated query across immutable ledger entries. |
| `get_market_ticker` | **Real-Time Live Pricing** | Fetches real-time market prices in **INR & USD** for any crypto asset (BTC, ETH, SOL, etc.). | Integrated with public **Binance / CoinGecko APIs** with instant USD-to-INR conversion. |
| `place_trading_order` | **Order Matching & Execution** | Places BUY/SELL Limit or Market orders into the orderbook. | Ingested via **Apache Kafka** into the high-speed matching engine microservice. |

---

## 💡 Real-World Natural Language Capabilities

The AI Copilot is capable of multi-step reasoning and autonomous tool chaining across diverse financial workflows:

### 1. 💸 Multi-Step Peer-to-Peer Transfers
> **User:** *"Bob ko ₹2,500 bhej de aur transfer ke baad mera remaining balance bata."*
* **Step 1:** Executes `search_user(query: "Bob")` ➡️ finds Bob's UUID.
* **Step 2:** Executes `transfer_funds(amount: 2500, receiverUserId: "...")` ➡️ executes atomic ledger transfer.
* **Step 3:** Executes `get_wallet_balance()` ➡️ confirms new updated balance.

### 2. 📊 Account Statement & Audit Inquiries
> **User:** *"Mera last 3 transaction history dikha aur total kitna debit hua hai bata."*
* **Step 1:** Executes `get_transaction_history(limit: 3)`.
* **Step 2:** Analyzes debit/credit entries and summarizes the statement with exact timestamps and transaction IDs.

### 3. 📈 Live Market Intelligence & Trading
> **User:** *"Solana ka live rate kya chal raha hai INR me? Agar rate 15,000 se kam hai toh 2 SOL buy kar le."*
* **Step 1:** Executes `get_market_ticker(symbol: "SOL")` ➡️ gets live price in INR.
* **Step 2:** Evaluates conditional reasoning (Price < ₹15,000).
* **Step 3:** Executes `place_trading_order(symbol: "SOL/INR", side: "BUY", price: ..., quantity: 2)` ➡️ dispatches to Kafka matching pipeline.

### 4. 🛡️ Complex Multi-Goal Workflows
> **User:** *"Check kar mere paas kitne paise hain. Bob ko ₹5,000 bhej, bache hue paiso se jitna BTC aa sake uska BUY order laga de."*
* Autonomously chains **Balance Lookup ➡️ Recipient Search ➡️ P2P Transfer ➡️ Ticker Fetch ➡️ Budget Calculation ➡️ Trade Placement**.

---

## ⚡ High-Throughput Distributed Core

* **4,200+ RPS Benchmarked:** Engineered for ultra-high-throughput, low-latency financial settlements.
* **Distributed Locking & Concurrency Control:** Redis-backed Redlock & Lua scripts preventing race conditions and double-spending.
* **Strict Double-Entry Ledger:** Zero-sum accounting invariants ensure debit-credit balances remain mathematically balanced at all times.
* **Session Security Layer:** Invariant guards strictly enforce the authenticated user context (`senderUserId`), preventing AI prompt injection or unauthorized account debits.

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Runtime & Language** | Node.js (v20+), TypeScript, Modern ESM |
| **Databases & Cache** | PostgreSQL 16, Redis (Key-Value, Hashes, Pub/Sub) |
| **ORM & Data Layer** | Prisma ORM with `@prisma/adapter-pg` pool |
| **Async Messaging & Queues** | Apache Kafka, BullMQ |
| **AI & Tool Orchestration** | OpenAI Tool Protocol / Gemini SDK, Custom ReAct Dispatcher |
| **Market Feeds** | Binance & CoinGecko Public APIs |

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js v20+
* Docker & Docker Compose (PostgreSQL, Redis, Kafka)

### 2. Environment Setup
```bash
git clone https://github.com/<your-username>/advanced-backend.git
cd advanced-backend
npm install

PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finflow_db?schema=public"
REDIS_URL="redis://localhost:6379"

# AI Configuration (OpenAI or Gemini)
OPENAI_API_KEY="your-api-key"
OPENAI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/" # If using Gemini

# Run database migrations
npx prisma migrate dev

# Seed test users (Alice & Bob) with initial balances
npx tsx src/scripts/seed.ai.test.ts

npx tsx src/ai/chat.ts
