# 🛡️ Paddy AI: Autonomous Git-Diff Dependency & API Regression Engine

> **Target Profile:** Staff/Principal AI Developer-Tooling Engineer | Distributed Systems & Compiler Infrastructure  
> **Core Stack:** Native Go (Golang) + Rust/Tree-sitter (C-bindings) + In-Memory Go DAG + Redis (24h TTL Report & AI Suggestion Cache) + Lipgloss (Rich Terminal UI) + Cobra CLI + NPM Wrapper (`npx paddy-ai`)

---

## 🏛️ Hardcore Systems & Architecture Philosophy

### 1. Key Pillars of Paddy AI 🛡️
1. **Name & Identity:** Paddy AI 🛡️ (The Zero-Friction Developer Blast-Radius Engine).
2. **Zero-Test Requirement:** Zero unit/integration test files required. Tree-sitter AST reverse call-graph statically traces from modified symbol ➔ internal functions ➔ public HTTP route controllers.
3. **Sub-Second Latency (<300ms, $0 Cost):** No heavy DB or Docker setup. Pure In-Memory Go DAG & Tree-sitter parsing gives sub-300ms feedback on pre-commit/staged git diffs.
4. **Lean Redis 24h Ephemeral Store:** Zero long-term SQL maintenance. Redis handles report sharing and caches AI refactor suggestions (`SET diff:suggestion:<diffHash> EX 86400`) to avoid duplicate LLM bills.
5. **Full Go Native Stack:** Single compiled static binary, Lipgloss terminal styling, Cobra CLI, and an NPM wrapper (`npx paddy-ai`) for frictionless DX across any ecosystem.

```
                          Developer Git Diff / Staged Patch
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Zero-Copy Byte Stream Git Diff Parser (Native Go / git diff scanner)     │
│    - Byte-level scanning of patch headers, hunk offsets (@@ -old,len +new,len @@)│
│    - Line delta bitsets without buffering full files in RAM (<5ms)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Modified Line Ranges)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Concrete Syntax Tree (CST) & AST Node Mutator (Tree-sitter Grammars)     │
│    - Locates exact modified AST nodes: FunctionDeclaration, Struct/Interface│
│    - Extracts symbol signatures and parameter mutations (<15ms)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Mutated Symbol Identifiers)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. In-Memory Reverse Call Graph & Route Controller Tracer (Zero-Test Req)    │
│    - In-Memory Go DAG traversal: Mutated Symbol ➔ Callers ➔ HTTP Endpoints  │
│    - Calculates Transitive Blast Radius without needing existing test suites│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Affected Public Route Signatures)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Targeted AI Advisor + Redis 24h Suggestion Cache (Cost & Speed Guard)    │
│    - Checks Redis cache for identical diff hash before LLM invocation       │
│    - Suggests backwards-compatible patches (optional params, default values)│
│    - Caches suggestion in Redis (`EX 86400`) to eliminate duplicate costs   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Rich Terminal UI & GitHub PR Bot (Lipgloss + Cobra + NPM Wrapper)        │
│    - Instant <300ms interactive terminal summary with visual dependency tree│
│    - Optional GitHub Action PR comment with breaking change alert           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Core Architectural Trade-offs & Engineering Mitigations

### 1. Dynamic Languages & Metaprogramming (Static AST vs Runtime Accuracy)
- **Challenge:** Dynamic JavaScript/Python metaprogramming (`eval()`, computed object keys `req.body[key]`) can obscure symbol references.
- **Mitigation:** Heuristic AST flagging (`DYNAMIC_MUTATION_FLAG`). When dynamic reflection is detected, Paddy AI flags the parent controller route with warning indicators in the Lipgloss UI.

### 2. Multi-Language Monorepo Scope (Go + TypeScript/Node.js)
- **Challenge:** Cross-language dependency graph synchronization across Go backends and TypeScript clients.
- **Mitigation:** **Contract-First Boundary Graph**. Paddy AI extracts route signatures and schemas as central boundary nodes, mapping upstream and downstream blast radius with minimal parsing overhead.

### 3. LLM Token Cost & Latency SLA (< 300 Milliseconds)
- **Challenge:** Calling an LLM for every single diff introduces unacceptable latency and token costs.
- **Mitigation:** **Two-Tier Architecture**:
  - *Tier 1 (Deterministic In-Memory Go Engine - <100ms, $0):* 100% of AST diffing, call-graph traversal, and breaking-change detection runs purely in Go memory.
  - *Tier 2 (Surgical AI Refactor Advisor):* Triggered only when breaking changes are detected, with responses cached in Redis (`24h TTL`) using the diff hash as the key.

---

## 📊 Continuous Evaluation Matrix (Iterative Quality Gates)

| Phase | Evaluation Focus | Automated Test / Pass Criterion |
|---|---|---|
| **Phase 1: Diff & AST** | Byte-level Parser Accuracy | 100% exact AST node isolation over 1,000+ Git commit patches; zero regex-based false positives. |
| **Phase 2: In-Memory Graph** | Blast Radius Graph Traversal | <10ms in-memory Go DAG traversal over 50,000 symbol nodes; cycle detection without stack overflow. |
| **Phase 3: Breaking Engine** | Breaking Change Classification | 100% precision on required vs optional parameter mutations; zero missed breaking changes. |
| **Phase 4: AI Advisor** | Refactor Suggestion Quality | Synthesizes non-breaking backwards-compatible patches; 0 duplicate LLM calls via Redis 24h cache. |
| **Phase 5: CLI & Bot** | Terminal UX & PR Shield | Sub-300ms CLI execution; rich Lipgloss terminal visualization; automated GitHub check runs. |
| **Phase 6: Release** | Monorepo Scale & NPM | Seamless `npx paddy-ai` execution; standalone single binary distribution. |

---

## 📅 30-Day Master Execution Plan (Deep Under-The-Hood)

### **Phase 1: Git Diff Plumbing & Tree-sitter AST Engines (Days 1–5)**
*Focus: Low-level Git object parsing, Unified diff hunk algorithms, Tree-sitter Concrete Syntax Trees (CST), and symbol extraction.*
- [ ] **Day 1: Git Diff Byte-Stream Parser in Go**
  - Streaming parser for Unified Diff format: parsing hunk headers (`@@ -old_start,old_len +new_start,new_len @@`), context lines, addition/deletion byte buffers.
  - Handling multi-file diff edge cases: file renames, deletions, and mode changes.
- [ ] **Day 2: Tree-sitter CST/AST Engine & C-Bindings in Go**
  - Tree-sitter grammar compilation: TypeScript, JavaScript, and Golang grammars via native C-bindings.
  - Querying ASTs with Tree-sitter S-expressions (`(function_declaration name: (identifier) @fn_name)`).
  - Mapping byte-range diffs from Git hunks to exact AST node scopes (identifying docstring vs body vs parameter mutations).
- [ ] **Day 3: Deterministic Semantic Hashing (AST Normalization)**
  - Stripping trivia: whitespaces, comments, variable renaming inside local scopes.
  - Computing Semantic AST Hash (SHA-256): differentiating cosmetic formatting from actual logical bytecode mutations.
- [ ] **Day 4: Dynamic Route Decorator & Controller Extraction**
  - Extracting route definitions directly from AST: Express (`app.post('/api/v1/orders', handler)`), Fastify, NestJS (`@Post('/orders')`), and Go Gin (`r.POST("/orders", Handler)`).
  - Extracting parameter types, DTO structures, and Zod/Pydantic schemas directly into route specification trees.
- [ ] **Day 5: Breaking vs Non-Breaking Change Classifier & Mock Interview #1**
  - Deterministic breaking change classifier:
    - *Breaking:* Field removal, type mutation (string ➔ number), new mandatory request parameter.
    - *Non-Breaking:* New optional field, relaxed constraints, added enum variants.
  - **Mock Interview #1:** Git object model, AST vs CST parsing, Tree-sitter queries, and Deterministic Schema Invariance.

---

### **Phase 2: In-Memory Go DAG & Transitive Blast Radius (Days 6–10)**
*Focus: Graph theory in Go memory, Adjacency lists, Transitive reachability, and Cycle detection.*
- [ ] **Day 6: In-Memory Symbol Graph & Adjacency List in Go**
  - Lightweight In-Memory graph data structures: `SymbolNode` (functions, types, controllers), `CallEdge` (caller, callee, import type).
  - Fast index maps (`map[string]*SymbolNode`) for sub-millisecond point lookups.
- [ ] **Day 7: Transitive Blast Radius Graph Traversal (DFS/BFS)**
  - Constructing bidirectional reachability queries: finding all public HTTP controllers that transitively depend on a modified low-level utility function.
  - Implementing cycle detection using visited-set bitmasks.
  - Calculating Blast Radius Severity Score: Depth-weighted impact formula.
- [ ] **Day 8: Cross-File Import Resolution & Module Linking**
  - Resolving relative imports (`./utils`, `../services/user`), barrel exports (`index.ts`), and Go package imports.
  - Building full project symbol dependency matrix in RAM (<50ms).
- [ ] **Day 9: Redis 24h Subgraph Cache for Fast Differential Runs**
  - Serializing module dependency subgraphs to Redis with commit-hash keys (`EX 86400`).
  - Skipping unchanged sub-graphs on subsequent commits.
- [ ] **Day 10: In-Memory Traversal Benchmark & Mock Interview #2**
  - Benchmarking recursive traversal over 50,000 nodes under 10ms in Go.
  - **Mock Interview #2:** Graph Theory in Compilers, In-Memory Adjacency Lists, Cycle Detection, and Transitive Reachability.

---

### **Phase 3: Breaking Change Engine & Zero-Test Controller Tracing (Days 11–16)**
*Focus: Zero-test controller mapping, signature diffing, and severity grading.*
- [ ] **Day 11: Zero-Test Route Impact Mapping Engine**
  - Tracing direct and indirect paths from mutated symbols straight to HTTP endpoints without running or needing test files.
- [ ] **Day 12: Parameter Mutation Analyzer (Required vs Optional)**
  - Detecting new mandatory parameters added to functions called by route handlers.
  - Flagging missing default values and backward-incompatible signature alterations.
- [ ] **Day 13: Schema Mutation & DTO Field Drift Engine**
  - Detecting deleted or renamed fields in request/response DTOs and Zod schemas.
- [ ] **Day 14: Severity Rating & Blast Radius Score Calculation**
  - Assigning impact tiers: Low (internal helper), Medium (service logic), Critical (public API route).
- [ ] **Day 15: Structural Diff JSON Report Generator**
  - Generating standardized structured JSON report with affected routes, severity levels, and modified call chains.
- [ ] **Day 16: Engine Accuracy Benchmark & Mock Interview #3**
  - Testing over 50 real-world breaking and non-breaking git commits.
  - **Mock Interview #3:** Static Analysis vs Dynamic Testing, Parameter Compatibility Rules, and Zero-Test Architecture.

---

### **Phase 4: Targeted AI Advisor & Redis 24h Cache (Days 17–22)**
*Focus: Surgical AI suggestions, prompt optimization, and Redis 24h TTL deduplication.*
- [ ] **Day 17: Surgical AI Refactor Advisor**
  - Triggering LLM only when breaking changes are detected: generating backwards-compatible code suggestions (e.g. optional parameter with fallback).
- [ ] **Day 18: Redis 24h AI Response Caching Layer**
  - Key: `diff:suggestion:<sha256(diff)>` with 24h TTL (`EX 86400`).
  - Ensuring repeated pre-commit checks incur $0 additional LLM cost.
- [ ] **Day 19: Structured Suggestion Patch Formatter**
  - Formatting AI recommendations as clean git diff snippets that developers can copy-paste directly.
- [ ] **Day 20: Prompt Optimization & Strict Hallucination Filter**
  - Enforcing strict JSON schema responses and filtering hallucinated code suggestions.
- [ ] **Day 21: Redis Temporary Report Sharing API**
  - Generating short-lived sharable report links via Redis (`SET report:<id> <json> EX 86400`).
- [ ] **Day 22: AI Advisor Benchmark & Mock Interview #4**
  - Benchmarking latency and token efficiency of the AI advisor layer.
  - **Mock Interview #4:** LLM Prompt Optimization, Redis TTL Caching Patterns, and AI Cost Control.

---

### **Phase 5: Lipgloss Terminal UI, Cobra CLI & GitHub PR Shield (Days 23–26)**
*Focus: Beautiful interactive CLI, Lipgloss terminal components, pre-commit hooks, and GitHub Actions.*
- [ ] **Day 23: Rich Terminal UI with Lipgloss & Bubble Tea in Go**
  - Rendering colorful, modern terminal output:
    - 🛡️ **Paddy AI Summary Header**
    - 🔴 **Breaking Routes List** (Red / Warning tags)
    - 🌲 **Visual Dependency Tree** (ASCII branches showing path to route)
    - 💡 **AI Fix Suggestion Box**
- [ ] **Day 24: Cobra CLI Commands & Config Loader**
  - Commands: `paddy check`, `paddy diff --staged`, `paddy suggest`.
  - Config loader (`.paddyrc.json`): ignored paths, custom severity rules.
- [ ] **Day 25: Git Pre-Commit Hook Integration (<300ms execution)**
  - Auto-installing pre-commit hook (`.git/hooks/pre-commit`).
  - Halting commit if breaking changes are detected (bypassable via `--no-verify`).
- [ ] **Day 26: GitHub PR Comment Bot & Merge Gate**
  - GitHub Action to post rich markdown blast-radius tables on PRs and set commit status (Pass/Fail).
  - **Mock Interview #5:** CLI Design with Cobra, Lipgloss Terminal Architecture, Git Hook Hooks, and GitHub Action Automation.

---

### **Phase 6: NPM Wrapper, Packaging & Launch (Days 27–30)**
*Focus: Cross-compilation, NPM distribution (`npx paddy-ai`), and Final Capstone Demo.*
- [ ] **Day 27: Cross-Platform Go Compilation (Goreleaser)**
  - Compiling static binaries for Linux (x64, arm64), macOS (Apple Silicon, Intel), and Windows.
- [ ] **Day 28: NPM Binary Wrapper (`npx paddy-ai`)**
  - Creating thin Node.js wrapper package on NPM that auto-downloads the native Go binary for the user's OS/architecture.
- [ ] **Day 29: Open-Source Documentation & Demo Repository**
  - Writing clean README with animated terminal GIFs, badges, and quickstart guides.
- [ ] **Day 30: Final Showcase & 90-Minute Staff AI Tooling System Design Interview**
  - Live E2E demonstration of Paddy AI analyzing staged commits, rendering Lipgloss UI in <300ms, and publishing to NPM.
  - Comprehensive 90-minute Staff AI / Systems Engineer Mock Interview.
