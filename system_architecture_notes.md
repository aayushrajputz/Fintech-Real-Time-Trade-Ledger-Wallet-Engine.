# 📚 Distributed Systems Masterclass: Kafka, Redis & Scaling Architecture

---

## 🍃 MODULE 1: APACHE KAFKA (EVENT STREAMING ENGINE)

### 1. Key Concepts & Definitions
* **Topic:** Logical stream / category where messages are published.
* **Partition:** Physical log file on disk. A topic is split into multiple partitions for parallelism.
* **Key (`userId` / `orderId`):** Kafka uses `MurmurHash2(key) % total_partitions` to assign messages to partitions. **Same key ALWAYS goes to the same partition**, guaranteeing strict FIFO order.
* **Consumer Group:** A group of worker processes sharing the reading load. 
  - **Golden Rule:** One partition can be read by ONLY ONE consumer within the same Consumer Group at any given time.

### 2. Kafka Architecture Syntax & Code Snippets

#### 🟢 Node.js (`kafkajs`) Producer & Consumer
```typescript
import { Kafka } from "kafkajs";

const kafka = new Kafka({ clientId: "api-gateway", brokers: ["localhost:9092"] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "settlement-group" });

// Producer: Send Event
await producer.send({
    topic: "order-events",
    messages: [{ key: "user-101", value: JSON.stringify({ price: 50000, qty: 1 }) }]
});

// Consumer: Read Event Stream
await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value.toString());
        console.log(`Partition ${partition} processed:`, data);
    }
});
```

#### ⚡ Golang (`segmentio/kafka-go`) High-Speed Reader
```go
reader := kafka.NewReader(kafka.ReaderConfig{
    Brokers: []string{"localhost:9092"},
    Topic:   "order-events",
    GroupID: "go-matching-group",
})
for {
    msg, _ := reader.ReadMessage(context.Background())
    fmt.Printf("Received: %s\n", string(msg.Value))
}
```

---

## 🔴 MODULE 2: REDIS (ATOMIC IN-MEMORY ENGINE)

### 1. Why Redis for Balance Locking vs Kafka?
* **Kafka:** Distributed Commit Log. Excellent for **Asynchronous Event Streaming**, but CANNOT mutate or query state in <1ms synchronously during HTTP requests.
* **Redis:** Single-Threaded In-Memory RAM Store. Perfect for **Synchronous Atomic Balance Locking** before order execution.

### 2. Redis Lua Scripting (Lock-Free Concurrency)
#### ❓ Why Lua Scripts?
Normal Multi-step Redis commands (`GET balance` -> Check -> `SET balance`) suffer from **Race Conditions** under concurrent requests.
**Redis Lua Scripts execute atomically in RAM in <1ms without any row-locking overhead!**

```lua
-- Atomic Balance Lock Lua Script
local balanceKey = KEYS[1]
local amount = tonumber(ARGV[1])

local currentBalance = tonumber(redis.call('HGET', balanceKey, 'balance') or '0')

if currentBalance >= amount then
    redis.call('HINCRBYFLOAT', balanceKey, 'balance', -amount)
    redis.call('HINCRBYFLOAT', balanceKey, 'locked', amount)
    return 1 -- Success
else
    return 0 -- Insufficient Balance
end
```

### 3. Redis Pub/Sub vs Redis Streams vs Kafka

| Feature | Redis Pub/Sub | Redis Streams | Apache Kafka |
| :--- | :--- | :--- | :--- |
| **Persistence** | ❌ No (Fire & Forget) | ✅ Yes (RDB/AOF) | ✅ Yes (Disk Commit Log) |
| **Message Replay** | ❌ No | ✅ Yes (Consumer Groups) | ✅ Yes (Offset Seek) |
| **Throughput** | ⚡ High | ⚡ High | 🚀 Extreme (1M+ req/sec) |
| **Primary Purpose** | Real-time Chat / Alerts | In-Memory Message Stream | Enterprise Event Bus |

---

## ⚡ MODULE 3: SYSTEM BOTTLENECK AUDIT & HIGH-SCALE SCALING

### 1. Connection Pool Sizing & Database Bottlenecks
#### 🔴 The "Pig-on-Ice" CPU Spike Problem
* Creating 1,000 DB connections under load does NOT make PostgreSQL faster; it causes **CPU Context Switching Thrashing**.
* **Optimal Connection Pool Formula:**
  $$\text{Pool Size} = (\text{CPU Cores} \times 2) + \text{Spindle Count}$$
  *Example:* An 8-Core DB server should have a connection pool of $\approx 17\text{--}25$ connections managed by PgBouncer!

### 2. OS Ephemeral Port Exhaustion (TCP Socket Refusal)
* **Problem:** Windows/Linux OS has a finite range of ephemeral outbound TCP ports (`1024 - 5000`). Under 4,000 concurrent Virtual Users, OS exhausts available sockets (`connectex refused` / `EOF`).
* **Fix:** Use **HTTP/1.1 Persistent Keep-Alive Connection Pools** in Nginx and API Gateways to reuse existing TCP handshakes.

### 3. Keyset (Cursor-Based) vs Offset Pagination
* **Offset (`OFFSET 100000 LIMIT 15`):** $O(N)$ Disk Scan. DB reads 100,000 records, throws them away, and returns 15.
* **Keyset (`WHERE id < cursor LIMIT 15`):** $O(1)$ B-Tree Index Seek. Constant time response regardless of database table size.
