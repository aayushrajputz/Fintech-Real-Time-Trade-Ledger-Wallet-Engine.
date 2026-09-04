# ⚡ High-Scale Polyglot Fintech Engine

A production-grade, high-throughput Fintech Backend Engine transitioning from a Node.js monolith to a **Polyglot Microservices Architecture (Node.js + Golang + Redis Lua + Kafka + Nginx)** designed to handle extreme concurrency, lock-free trade execution, and full observability.

---

## 🏛️ System Architecture

```
[ K6 Stress Load Generator (4,000 Concurrent VUs) ]
                        │
                        ▼ (Port 80)
[ Edge Layer: Nginx Reverse Proxy / Load Balancer ]
                        │
                        ▼ (Port 8000)
[ Node.js Express API Gateway ]
  ├── 1. Redis Lua Script (<1ms Wallet Lock Check)
  └── 2. Kafka Producer emits event to topic: "order-events"
                        │
         ┌──────────────┴────────────────────────────┐
         ▼ (Group: go-matching-group)                ▼ (Group: analytics-group)
[ Golang Order Matching Engine Microservice ]  [ Real-Time Audit & Analytics Service ]
 (Goroutine Worker Pool + Go Channels)          (Decoupled Kafka Consumer)
```

---

## 📈 Extreme Benchmark Results (K6 Stress Testing)

### Test 1: Single Node Stable Benchmark (1,000 Concurrent VUs)
* **Total Requests Handled:** 168,274 requests (in 60s)
* **Sustained Throughput:** **2,802.57 Requests/Sec (RPS)**
* **Success Rate:** **100.00%** (0% Failed Requests)
* **Average Latency:** **34.39 ms**

### Test 2: Peak System Capacity / Stress Limit (4,000 Concurrent VUs)
* **Peak Attempted Throughput:** **4,374.03 Requests/Sec (RPS)**
* **Total Requests Attempted:** **221,908 requests**
* **Successful Execution:** **135,092 requests** processed at sub-50ms latency before hitting OS Ephemeral Port limits.

---

## 🛠️ Stack & Engineering Highlights

* **API Gateway & Auth:** Node.js, Express, TypeScript, Zod, JWT, Winston + AsyncLocalStorage correlation IDs.
* **In-Memory Balance Lock:** Redis Atomic Lua Script (`wallet.lua.ts`) executing sub-millisecond wallet reservations without PostgreSQL disk locks.
* **Matching Microservice:** **Golang (Go)** order matching engine leveraging multithreaded **Goroutines Worker Pool + Go Channels (`chan`)** for zero-GC-pause Price-Time FIFO matching.
* **Event Streaming:** Apache Kafka with decoupled Consumer Groups (`go-matching-group` & `analytics-group`).
* **Reverse Proxy:** Nginx Docker container managing client socket pooling and HTTP load balancing.
* **Observability:** Prometheus metrics exporter (`/metrics`) + Grafana dashboards.

---

## 🚀 Getting Started

### 1. Infrastructure Services
```bash
docker-compose up -d
```

### 2. Node.js API Gateway & Services
```bash
npm run dev
```

### 3. Golang Matching Engine Microservice
```bash
cd matching-engine
go run main.go
```

### 4. K6 Stress Load Testing
```bash
& "C:\Program Files\k6\k6.exe" run load-test.js
```