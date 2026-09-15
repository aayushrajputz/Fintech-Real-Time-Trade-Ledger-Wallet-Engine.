# ⚡ FinFlow Core: Distributed High-Throughput Ledger Engine & Agentic AI Co-Pilot

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Golang-1.21+-00ADD8.svg?style=flat-square&logo=go&logoColor=white)](https://go.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7%20(Lua%20%26%20Locking)-DC382D.svg?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Kafka-Event%20Streams-231F20.svg?style=flat-square&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM%207-2D3748.svg?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![OpenAI Protocol](https://img.shields.io/badge/AI-OpenAI%20Tool%20Calling-412991.svg?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)

> **A mission-critical, double-entry financial ledger and matching engine capable of processing 4,200+ RPS with sub-millisecond atomic wallet locking, paired with an autonomous Agentic AI Co-Pilot for natural language treasury management, P2P settlements, crypto market intelligence, and trade execution.**

---

## 📑 Table of Contents
- [System Architecture](#-system-architecture)
- [Performance Benchmarks (K6 Stress Test)](#-performance-benchmarks-k6-stress-test)
- [Agentic AI Co-Pilot Layer](#-agentic-ai-co-pilot-layer)
- [Core Distributed Systems Features](#-core-distributed-systems-features)
- [API Reference](#-api-reference)
- [Repository Structure](#-repository-structure)
- [Tech Stack](#-tech-stack)
- [Quick Start Guide](#-quick-start-guide)
- [Running AI Co-Pilot](#-running-ai-co-pilot)

---

## 🏛️ System Architecture

```
                                      [ Clients / Web / K6 Load Generator ]
                                                        │
                                                        ▼ (Port 80)
                     ┌────────────────────────────────────────────────────────────────────────┐
                     │                  Nginx Reverse Proxy & Load Balancer                   │
                     │          (Persistent HTTP/1.1 Keep-Alive Connection Pool: keepalive 64)│
                     └──────────────────────────────────┬─────────────────────────────────────┘
                                                        │
                                                        ▼ (Round-Robin Port 8000 / 8001)
                     ┌────────────────────────────────────────────────────────────────────────┐
                     │                     Node.js Express API Gateway                        │
                     │  ├── Zod DTO Validation Middleware                                     │
                     │  ├── Idempotency Key Guard (`X-Idempotency-Key` + Redis SETNX)         │
                     │  ├── Redis Atomic Lua Script (<1ms RAM Wallet Balance Reservation)     │
                     │  ├── Prometheus Metrics Collector (`/metrics`)                         │
                     │  └── Kafka Event Producer (`order-events`)                             │
                     └─────────────────┬──────────────────────────────────┬───────────────────┘
                                       │                                  │
                                       ▼ (Group: go-matching-group)       ▼ (Group: analytics-group)
        ┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
        │  Golang Order Matching Engine Microservice   │ │     Real-Time Analytics & Audit Worker       │
        │  ├── Goroutine Worker Pool                   │ │     (Decoupled Node.js Consumer Group)       │
        │  ├── Thread-Safe Go Channels (`orderChan`)   │ └──────────────────────────────────────────────┘
        │  └── In-Memory FIFO OrderBook Matching       │
        └──────────────────────┬───────────────────────┘
                               │ (Emits `matched-trades`)
                               ▼
        ┌──────────────────────────────────────────────┐
        │       Trade Settlement Consumer Worker       │
        │   - Updates PostgreSQL Order/Trade records   │
        │   - Executes double-entry balance settlement │
        └──────────────────────────────────────────────┘
```

---

## 🤖 Agentic AI Co-Pilot Architecture

The autonomous AI Co-Pilot translates user natural language commands into strict deterministic backend tool executions with auth isolation and real-time market data:

```
                            ┌────────────────────────────────────────────────────────┐
                            │               Natural Language Prompt                  │
                            │ ("Send ₹500 to Bob, show last 3 txns, check BTC rate") │
                            └──────────────────────────┬─────────────────────────────┘
                                                       │
                                                       ▼
                                      ┌────────────────────────────────┐
                                      │   Agentic ReAct Tool Loop      │
                                      │ (OpenAI / Groq / Gemini SDK)   │
                                      └────────┬──────────────┬────────┘
                                               │              │
                  ┌────────────────────────────┘              └──────────────────────────┐
                  ▼                                                                      ▼
    ┌────────────────────────────────┐                         ┌────────────────────────────────┐
    │    Live Market Ticker Tool     │                         │   FinFlow Core Execution Engine│
    │  - Binance / CoinGecko Feed    │                         │  - Auth Context Injection      │
    │  - Sub-10s Redis Ticker Cache  │                         │  - P2P Double-Entry Settlement │
    │  - Live USD-to-INR Conversion  │                         │  - Kafka Matching Ingestion    │
    └────────────────────────────────┘                         └──────────────┬─────────────────┘
                                                                              │
                                      ┌───────────────────────────────────────┴───────────────────────┐
                                      ▼                                                               ▼
                       ┌───────────────────────────────┐                               ┌───────────────────────────────┐
                       │  Fast Path: In-Memory Layer   │                               │  Durability: Relational ACID  │
                       │ - Redis Lua Atomic Reserve    │                               │ - PostgreSQL (Row Versioning) │
                       │ - Read-Through Balance Cache  │                               │ - Prisma ORM 7 Engine         │
                       │ - Redlock Distributed Locking │                               │ - Immutable Double-Entry Logs │
                       └───────────────────────────────┘                               └───────────────────────────────┘
```

---

## 📊 Performance Benchmarks (K6 Stress Test)

Tested under synthetic high-concurrency traffic with K6 load generators:

| Metric | Stable Concurrency (1,000 VUs) | Peak Stress Limit (4,000 VUs) |
|---|---|---|
| **Total Requests Handled** | **168,274 requests** (60s) | **221,908 requests** (60s) |
| **Sustained Throughput** | **2,802.57 RPS** | **4,374.03 RPS Peak** |
| **Success Rate** | **100.00%** (0% Error Rate) | **135,092 successful** (sub-50ms) |
| **Average Latency** | **34.39 ms** | **48.12 ms** |
| **P95 Latency** | **52.10 ms** | **78.40 ms** |

---

## 🛠️ AI Financial Tools & Capability Matrix

The Agentic Copilot dynamically plans, chains, and executes the following 6 core deterministic tools:

| Tool Name | Operation | Description | Backend Engine / Invariant |
|---|---|---|---|
| `get_wallet_balance` | **Instant Balance Lookup** | Fetches available funds and locked collateral in real-time. | Served sub-millisecond via **Redis Hash Cache** with PostgreSQL fallback. |
| `search_user` | **Smart User Discovery** | Resolves names/emails (e.g. *"Bob"*, *"alice@gmail.com"*) to immutable UUIDs. | Fuzzy & indexed lookups in PostgreSQL to safely locate recipient IDs. |
| `transfer_funds` | **P2P Instant Settlement** | Atomically moves funds between sender and receiver wallets. | **Double-entry bookkeeping** with Redis balance sync and debit/credit ledger records. |
| `get_transaction_history` | **Account Statement & Audit** | Fetches recent ledger transactions, statements, and audit logs. | Cursor/Limit paginated query across immutable ledger entries. |
| `get_market_ticker` | **Real-Time Live Pricing** | Fetches live market prices in **INR & USD** for crypto assets (BTC, ETH, SOL, DOGE, etc.). | Integrated with public **Binance / CoinGecko APIs** with instant USD-to-INR conversion and 10s Redis caching. |
| `place_trading_order` | **Order Matching & Execution** | Places BUY/SELL Limit or Market orders into the orderbook. | Ingested via **Apache Kafka** into the high-speed matching engine microservice. |

---

## 💡 Real-World Natural Language Capabilities

The AI Copilot performs autonomous multi-step reasoning:

### 1. 💸 Multi-Step Peer-to-Peer Transfers
> **User:** *"Bob ko ₹2,500 bhej de aur transfer ke baad mera remaining balance bata."*
* **Step 1:** Executes `search_user(query: "Bob")` ➡️ resolves Bob's UUID.
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

## ⚡ Core Distributed Systems Features

### 1. Atomic Wallet Balance Reservation (Redis Lua)
- Uses an atomic Lua script (`src/scripts/wallet.lua.ts`) to check and lock funds in Redis in `<1ms`.
- Eliminates heavy PostgreSQL `SELECT ... FOR UPDATE` database row locks during high concurrency spikes.

### 2. Idempotency Key Guard
- `X-Idempotency-Key` header with Redis `SET key value NX EX 120` prevents duplicate charges during network retries or double clicks.

### 3. Golang High-Speed Order Matching Engine
- In-memory Price-Time FIFO orderbook implemented in pure Go.
- Decoupled from HTTP API via Apache Kafka topics (`order-events` and `matched-trades`).
- Goroutine worker pools handle concurrent JSON unmarshalling with thread-safe Go channels.

### 4. Strict Double-Entry Ledger Invariant
- Every transaction creates paired credit/debit `LedgerEntry` records.
- Wallet balances are protected with optimistic concurrency version checks.

### 5. Production Observability
- Prometheus metrics endpoint (`/metrics`) tracking HTTP request durations, status codes, and throughput.
- Winston logger integrated with `AsyncLocalStorage` for end-to-end correlation ID tracking across microservices.

---

## 📁 Repository Structure

```
├── matching-engine/                 # Golang High-Speed Order Matching Microservice
│   ├── consumer/kafka.go            # Goroutine Worker Pool + Kafka Reader
│   ├── engine/orderbook.go          # In-Memory FIFO OrderBook Matching Core
│   ├── models/order.go              # Go Order & Trade Data Structures
│   ├── producer/kafka.go            # Kafka Producer for matched trades
│   └── main.go                      # Microservice Entrypoint
├── src/
│   ├── ai/                          # Agentic AI Co-Pilot Layer
│   │   ├── chat.ts                  # Interactive CLI Chat & Dynamic Auth Gateway
│   │   ├── ledger.calling.ts        # OpenAI Tool Schema Contracts
│   │   ├── ledger.handlers.ts       # Deterministic Tool Execution Handlers
│   │   └── runner.ts                # ReAct Multi-Step Agent Loop & Auth Injection
│   ├── config/                      # Kafka, Redis, Database & Queue configurations
│   ├── controllers/                 # Express HTTP Controllers (Auth, Wallet, Order, Ledger)
│   ├── middlewares/                 # Correlation IDs, Idempotency, Rate Limiter, Metrics, Auth
│   ├── repositories/                # Database Access Layer (User, Wallet, Order)
│   ├── routes/                      # REST API Endpoints
│   ├── scripts/
│   │   ├── wallet.lua.ts            # Atomic Redis Lua Script for Balance Locking
│   │   └── seed.ai.test.ts          # Test Data Seeder (Alice & Bob with balances)
│   ├── services/                    # Kafka Producer, Consumers & Wallet Service
│   ├── workers/                     # BullMQ Background Job Workers
│   ├── app.ts                       # Express App Configuration
│   └── server.ts                    # Main API Gateway Server
├── docker-compose.yml               # PostgreSQL, Redis, Kafka, Zookeeper, Prometheus, Grafana, Nginx
├── load-test.js                     # K6 Load & Stress Testing Script
├── nginx.conf                       # Nginx Reverse Proxy with Connection Pooling
├── prometheus.yml                   # Prometheus Scrape Configuration
└── prisma/
    └── schema.prisma                # Database Models (User, Wallet, Order, Trade, LedgerEntry)
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **API Gateway & Core** | Node.js (v20+), TypeScript 5, Express 5, ESM |
| **High-Speed Matching Microservice** | Golang (Go 1.21+), Goroutines, Go Channels |
| **Databases & Cache** | PostgreSQL 15/16, Redis 7 (Hashes, Lua Scripts, Redlock) |
| **ORM & Data Layer** | Prisma ORM 7 (`@prisma/adapter-pg` pool) |
| **Event Streaming & Queues** | Apache Kafka (KafkaJS + Confluent Go), BullMQ |
| **Reverse Proxy & Load Balancing** | Nginx Alpine (HTTP/1.1 Persistent Keep-Alive) |
| **Telemetry & Observability** | Prometheus, Grafana, Winston, `AsyncLocalStorage` |
| **AI Protocol & Engine** | OpenAI Tool Calling Protocol / Groq / Gemini SDK |
| **Market Data Feeds** | Binance & CoinGecko Public REST APIs |
| **Performance Testing** | K6 Load Testing Engine |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/advanced-backend.git
cd advanced-backend
npm install
```

### 2. Start Infrastructure Services (Docker)
```bash
docker-compose up -d
```
*Services started:* PostgreSQL (5432), Redis (6379), Kafka (9092), Zookeeper (2181), Prometheus (9090), Grafana (3000), Nginx (80).

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=8000
NODE_ENV="development"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

DATABASE_URL="postgresql://dev_user:dev_password@127.0.0.1:5432/fintech_ledger?schema=public"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# AI Gateway (Groq, OpenAI, or Gemini)
OPENAI_API_KEY="your-api-key"
OPENAI_BASE_URL="https://api.groq.com/openai/v1" # or OpenAI / Gemini endpoint
```

### 4. Run Migrations & Seed Data
```bash
# Push database schema
npx prisma db push

# Seed test accounts (Alice & Bob)
npx tsx src/scripts/seed.ai.test.ts
```

### 5. Start the Services

#### Run Node.js API Gateway:
```bash
npm run dev
```

#### Run Golang Matching Engine Microservice:
```bash
cd matching-engine
go run main.go
```

#### Run K6 Stress Test (Optional):
```bash
k6 run load-test.js
```

---

## 💬 Running AI Co-Pilot

Launch the interactive AI CLI gateway:
```bash
npx tsx src/ai/chat.ts
```

### Example Interactive Prompts:
```text
🔐 FINTECH AI GATEWAY - DYNAMIC AUTH LOGIN
📧 Enter your email to login: alice@example.com
✅ Logged in as: Alice Sharma

👤 You > What is my current balance?
🤖 AI  > Available balance: ₹50,000 | Locked: ₹0

👤 You > Compare prices of BTC, ETH and SOL
🤖 AI  > [Fetches Binance live prices and generates comparative table]

👤 You > Transfer 2000 INR to Bob
🤖 AI  > [Searches Bob's UUID -> Executes atomic transfer -> Returns updated balance]

👤 You > Show my recent transactions
🤖 AI  > [Fetches double-entry statement with transaction hashes and timestamps]
```

---

## 📜 License
MIT License. Built for high-scale fintech, distributed systems, and agentic AI architectures.
