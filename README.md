# ⚡ High-Scale Polyglot Fintech Engine

A production-grade, high-throughput Fintech Backend Engine built with a **Polyglot Microservices Architecture (Node.js + Golang + Redis Lua + Kafka + Nginx)** designed to process thousands of transactions per second with lock-free order matching, low latency, and end-to-end system observability.

---

## 🏛️ System Architecture

```
                                [ K6 Load Generator / Clients ]
                                               │
                                               ▼ (Port 80)
                ┌─────────────────────────────────────────────────────────────┐
                │          Nginx Reverse Proxy & Load Balancer                │
                │        (Persistent HTTP/1.1 Keep-Alive Connection Pool)     │
                └──────────────────────────────┬──────────────────────────────┘
                                               │
                                               ▼ (Port 8000 / 8001)
                ┌─────────────────────────────────────────────────────────────┐
                │             Node.js Express API Gateway                     │
                │   ├── Zod DTO Validation & Idempotency Key Guard            │
                │   ├── Redis Lua Script (<1ms Atomic Wallet Reservation)     │
                │   └── Kafka Producer (Stream Events to "order-events")      │
                └──────────────────────────────┬──────────────────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼ (Group: go-matching-group)                                    ▼ (Group: analytics-group)
┌──────────────────────────────────────────────┐              ┌──────────────────────────────────────────────┐
│  Golang Order Matching Engine Microservice   │              │   Real-Time Audit & Analytics Service            │
│  ├── Parallel Goroutines Worker Pool         │              │   (Decoupled Node.js Consumer Group)         │
│  ├── Thread-Safe Go Channels (orderChan)     │              └──────────────────────────────────────────────┘
│  └── In-Memory FIFO OrderBook Matching       │
└──────────────────────────────────────────────┘
```

---

## 📊 Performance Benchmarks (K6 Stress Testing)

### 🚀 Stable Concurrency Benchmark (1,000 Virtual Users)
* **Total Requests Handled:** **168,274 requests** (in 60 seconds)
* **Sustained Throughput:** **2,802.57 Requests/Sec (RPS)**
* **Success Rate:** **100.00%** (0% Error Rate, 0 Failed Requests)
* **Average Latency:** **34.39 ms**

### ⚡ Peak System Stress Limit (4,000 Virtual Users)
* **Peak Attempted Throughput:** **4,374.03 Requests/Sec (RPS)**
* **Total Requests Attempted:** **221,908 requests**
* **Successful Execution:** **135,092 requests** processed at sub-50ms latency before reaching OS Ephemeral Port limits.

---

## 🛠️ Tech Stack & Key Architectural Highlights

* **API Gateway & Middleware:** Node.js, Express, TypeScript, Zod validation, JWT authentication, Winston logger + `AsyncLocalStorage` correlation IDs.
* **Atomic In-Memory Ledger:** **Redis Lua Script (`wallet.lua.ts`)** executing sub-millisecond wallet balance deductions atomically in RAM, bypassing slow PostgreSQL row locks (`FOR UPDATE`).
* **High-Speed Matching Microservice:** **Golang (Go)** order matching engine utilizing **Goroutine Worker Pools** for concurrent JSON unmarshalling and thread-safe **Go Channels (`chan`)** for zero-GC-pause Price-Time FIFO matching.
* **Event Streaming & Decoupling:** **Apache Kafka** with multi-consumer group architecture (`go-matching-group` and `analytics-group`).
* **Edge Proxying:** **Nginx Docker container** configured with persistent HTTP/1.1 Keep-Alive connection pooling (`keepalive 64`) to eliminate TCP handshake overhead.
* **Real-time Telemetry:** Prometheus metrics exporter (`/metrics`) integrated with Grafana dashboards.

---

## 📁 Repository Structure

```
├── matching-engine/             # Golang High-Speed Order Matching Microservice
│   ├── consumer/kafka.go        # Goroutine Worker Pool + Go Channels Kafka Reader
│   ├── engine/orderbook.go      # In-Memory FIFO OrderBook Matching Core
│   ├── models/order.go          # Go Order Data Structures
│   └── main.go                  # Microservice Entrypoint
├── src/
│   ├── config/                  # Kafka, Redis, Database & Queue configurations
│   ├── controllers/             # Express HTTP Controllers (Order placement, Auth)
│   ├── middlewares/             # Prometheus metrics middleware, Auth & Validation guards
│   ├── scripts/wallet.lua.ts    # Redis Atomic Lua Script for Balance Locking
│   ├── services/                # Kafka Producer & Dual Consumer Services
│   └── server.ts                # Express API Gateway Entrypoint
├── load-test.js                 # K6 Stress Load Testing Script
├── nginx.conf                   # Nginx Reverse Proxy & Load Balancer Config
└── docker-compose.yml           # PostgreSQL, Redis, Kafka, Zookeeper, Prometheus, Grafana, Nginx
```

---

## 🚀 Getting Started

### 1. Start Infrastructure Services
```bash
docker-compose up -d
```

### 2. Run Node.js API Gateway
```bash
npm run dev
```

### 3. Run Golang Matching Engine
```bash
cd matching-engine
go run main.go
```

### 4. Run K6 Load Test Benchmark
```bash
& "C:\Program Files\k6\k6.exe" run load-test.js
```