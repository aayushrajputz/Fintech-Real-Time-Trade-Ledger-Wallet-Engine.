# 📚 Production Backend & Database Engineering Notes

A high-yield reference guide for **PostgreSQL**, **ACID Transactions**, **Database Relations**, **Concurrency Control**, and **SQL Optimization**.

---

## 1. ⚛️ PostgreSQL ACID Properties

Financial and transactional systems rely on the **ACID** guarantees provided by PostgreSQL.

### **A — Atomicity (All or Nothing)**
- **Concept:** Every statement inside a transaction block (`BEGIN` ... `COMMIT`) is treated as a single logical unit.
- **Rule:** Either **ALL** queries succeed (committed to disk), or **NONE** do (rolled back to baseline).
- **Failure Impact:** Without atomicity, if a server crashes midway through a fund transfer, money is deducted from the sender but never credited to the receiver.
- **Prisma Equivalent:**
  ```typescript
  await prisma.$transaction(async (tx) => {
    await tx.wallet.update(...); // Step 1
    await tx.ledgerEntry.create(...); // Step 2
  });
  ```

### **C — Consistency (Data Integrity)**
- **Concept:** Ensures the database transitions from one valid state to another, preserving all schema rules and constraints.
- **Examples:**
  - Foreign Key constraints (`userId` must reference a valid `User`).
  - Unique constraints (`email` or `userId` in `Wallet` cannot duplicate).
  - Check constraints (`balance >= 0`).

### **I — Isolation (Concurrency Protection)**
- **Concept:** Determines how concurrent transactions interact and view intermediate uncommitted data.
- **Isolation Levels in PostgreSQL:**
  1. **Read Committed (Default):** Prevents dirty reads. Queries only see committed data.
  2. **Repeatable Read:** Guarantees that reads within the same transaction return identical results even if another transaction commits changes.
  3. **Serializable:** Highest isolation level. Prevents phantom reads and serialization anomalies by simulating serial execution.

### **D — Durability (Permanence)**
- **Concept:** Once a transaction responds with `COMMIT`, the changes persist even in the event of a power outage or system crash.
- **Mechanism:** PostgreSQL uses **Write-Ahead Logging (WAL)**. Changes are written to the WAL on disk before being applied to data pages.

---

## 2. 🗄️ Database Relations (1:1, 1:N, N:M)

SQL relationships are created using **Primary Keys (PK)** and **Foreign Keys (FK)**.

### 1:1 (One-to-One)
- **Rule:** One entity relates to exactly one entity (e.g., `User` $\leftrightarrow$ `Wallet`).
- **SQL Mechanics:** Foreign Key with a **`UNIQUE`** constraint.
  ```sql
  CREATE TABLE "Wallet" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE REFERENCES "User"("id") ON DELETE CASCADE
  );
  ```

### 1:N (One-to-Many)
- **Rule:** One parent entity relates to multiple child entities (e.g., `Wallet` $\leftrightarrow$ `LedgerEntry`).
- **SQL Mechanics:** Foreign Key **WITHOUT** a `UNIQUE` constraint.
  ```sql
  CREATE TABLE "LedgerEntry" (
      "id" TEXT PRIMARY KEY,
      "walletId" TEXT REFERENCES "Wallet"("id")
  );
  ```

### N:M (Many-to-Many)
- **Rule:** Multiple entities relate to multiple entities (e.g., `Student` $\leftrightarrow$ `Course`).
- **SQL Mechanics:** Requires a **Junction / Join Table** storing composite Foreign Keys.

---

## 3. 🔒 Concurrency Control: Optimistic vs. Pessimistic Locking

In high-concurrency fintech applications, multiple requests may attempt to update the same balance simultaneously.

| Feature | Optimistic Locking | Pessimistic Locking |
| :--- | :--- | :--- |
| **Mechanism** | Uses a `version` column. Checks `WHERE version = current_version`. | Uses SQL row lock: `SELECT * FROM "Wallet" WHERE id = $1 FOR UPDATE`. |
| **DB Locking** | No row locks held during execution. | Holds an exclusive lock on the row until `COMMIT`. |
| **Best Used For** | High-read, low-conflict scenarios (Web apps). | High-conflict, critical financial updates (Order Matching Engine). |
| **Trade-off** | Fails fast if version changed; requires retry. | Can cause connection queueing or deadlocks if locks held too long. |

---

## 4. 🔍 SQL Queries: `WHERE` vs `HAVING` & Joins

### `WHERE` vs `HAVING`
- **`WHERE`**: Filters rows **BEFORE** `GROUP BY` aggregation takes place. Cannot contain aggregate functions like `SUM()` or `COUNT()`.
- **`HAVING`**: Filters groups **AFTER** `GROUP BY` aggregation. Designed for conditions like `HAVING SUM(amount) > 10000`.

```sql
-- Example: Find wallets with total credit transactions > 50,000 INR
SELECT "walletId", SUM(amount) AS total_credited
FROM "LedgerEntry"
WHERE type = 'CREDIT'           -- 1. Filter rows first
GROUP BY "walletId"             -- 2. Group by wallet
HAVING SUM(amount) > 50000;     -- 3. Filter aggregated groups
```

### Improving SQL Join Performance
1. **Index Foreign Keys:** Ensure B-Tree indexes exist on all columns used in `ON` clauses (e.g., `CREATE INDEX idx_ledger_walletId ON "LedgerEntry"("walletId")`).
2. **Avoid `SELECT *`:** Fetch only required columns to optimize buffer cache utilization.
3. **Query Inspection (`EXPLAIN ANALYZE`):** Run `EXPLAIN ANALYZE` to inspect PostgreSQL execution plans and identify whether it uses an **Index Scan** vs a **Sequential Scan**.

---

## 🎯 Top Fintech Interview Cheatsheet

1. **What happens if a transaction doesn't roll back on failure?**
   - Data corruption occurs. Uncommitted writes or orphan records pollute the database, and table locks may remain open, causing system deadlocks.

2. **Why use `Decimal(20,4)` instead of `Float` for money?**
   - Floating-point arithmetic uses IEEE 754 floating binary format, causing rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). `Decimal` provides exact fixed-point precision.

3. **What is `tx` in Prisma `$transaction`?**
   - `tx` is the Transaction Client instance. All queries executed on `tx` are scoped to the exact same PostgreSQL connection and executed within a `BEGIN ... COMMIT/ROLLBACK` block.

<!-- # Role & Persona:
Tu mera Senior AI Engineering Coach hai 
Tera kaam mujhe ek elite-level Agentic AI Engineer banana hai.
Meri background:
- Go (Golang) + Node.js + TypeScript
- Apache Kafka + BullMQ
- Redis (Internals, Eviction, Pub/Sub, Distributed Locks)
- PostgreSQL + Docker
- 4000+ RPS Distributed Ledger & Fintech Systems Architecture

---

# Tone & Language:
- Language: 100% Conversational Hinglish (Dev/Backend engineering slang).
- Attitude: Ekdum STRICT, uncompromising Senior Coach. Koi superficial ya generic advice nahi. 
- Deep Backend Perspective: Har AI concept ko backend internals (Sockets, Buffers, Latency, Concurrency, Cache invalidation, Memory leaks) ke perspective se todna hai.

---

# Strict Teaching Protocol (MANDATORY RULES):
1. NO CODE DUMPS: Kabhi ek sath lamba/bada code mat dena. 
2. CHUNK-BY-CHUNK TEACHING:
   - Step 1: Core Under-the-hood Theory (Mechanics, Protocol, Latency bottlenecks).
   - Step 2: Chota sa exact working code snippet (Go ya TypeScript) with line-by-line breakdown.
   - Step 3: Mujhse code run karwa ke terminal output verify karwana.
   - Step 4: Har block ke end mein 1-2 brutal, interview-level technical drill questions poochna.
3. STRICT GATEKEEPING: Jab tak main pichle block ka code run na karu aur tere drill question ka sahi answer na du, tab tak agle topic par jump MAT karna.
4. ZERO FLUFF: Jargon mat jhaad, seedha production reality aur fintech failure modes pe baat kar. or ex ke ydd aae ya goal se focus hate to seedha daato or badme motivate kro jb ai sde bnoge to sb aaege tere pass

---

# Current Progress & Curriculum:

✅ PHASE 1: COMPLETED (LLM Protocol, Tool Calling, JSON Schemas, Structured Output, Arguments Parsing)

🚀 PHASE 2: STARTING NOW 

---

# Immediate Instruction for Coach:
Phase 1 humara complete ho chuka hai.
Abhi seedha shuru kar: **"Phase 2 - Day 6:  end me mock interviews ques ek ek krke or agr yh ex ya khi bhgane ke khoshis kre to bolna h m tujhe block krke chla jauga m engineers train krta hu roone doone wale ni jo ex data analsyt traier h uske peeche


[Ai.implemention.md](file;file:///c%3A/Users/Om/Desktop/Advanced%20Backend/Ai.implemention.md)   yhra plan roadmap or hum [README.md](file;file:///c%3A/Users/Om/Desktop/Advanced%20Backend/README.md)  isme sekhke implemtion krna h ai ko backend me -->