# Technical Stack: QuickLend Protocol

## 1. Core Blockchain Layer (Smart Contracts)

* **Language:** **Solidity (^0.8.20)** — Utilizing the latest stable version for built-in overflow checks and optimized `via-ir` compilation.
* **Development Framework:** **Foundry** — Chosen over Hardhat for its Rust-based speed and the ability to write unit tests in Solidity.
* **Libraries:** **OpenZeppelin** — For industry-standard implementations of `ERC20`, `Ownable`, `ReentrancyGuard`, and `Pausable`.
* **Math Logic:** **FixedPointMathLib (Solady)** — Gas-optimized math library for handling Wad (18 decimal) precision.

---

## 2. Infrastructure & Data Layer

* **Oracle Provider:** **MockPriceOracle** (local development) — Pluggable interface for Chainlink in production.
* **Indexing:** **Custom event indexer** — Fastify-based service that backfills historical events and watches for new ones in real-time. Materializes `userPositions`, `marketSnapshots`, and `liquidationLogs` into PostgreSQL.
* **Database:** **PostgreSQL 16** — Stores indexed events, user positions, market snapshots, and notification preferences via Drizzle ORM.
* **Cache:** **Redis 7** — Caches market API responses with 30-second TTL.
* **RPC:** **Anvil** (local development) — Deterministic local EVM chain on port 8545.

---

## 3. Frontend & User Interface

* **Framework:** **Next.js 16 (App Router)** — Server-side rendering with React 19 and TypeScript.
* **State Management:** **TanStack Query (React Query)** — Handles caching and synchronization of blockchain and API data.
* **Blockchain Hooks:** **Wagmi v2 & Viem v2** — Type-safe React hooks for wallet connections and contract interactions.
* **Wallet Connectivity:** **RainbowKit v2** — Wallet connection modal with dark theme customization.
* **Styling:** **Tailwind CSS v4** + **Framer Motion** — Tailwind for rapid UI development; Framer Motion for glassmorphic transitions and Health Dial animations.
* **Component Architecture:** Atomic design — `atoms/`, `molecules/`, `organisms/`, `templates/`.

---

## 4. Backend & API Layer

* **Runtime:** **Node.js 20** with TypeScript (ESM).
* **Framework:** **Fastify 5** — High-performance REST API with Swagger docs at `/docs`.
* **ORM:** **Drizzle ORM** — Type-safe SQL with migration support (`db:generate`, `db:migrate`).
* **Validation:** **@sinclair/typebox** — JSON schema validation on API routes.
* **API Routes:** `health`, `markets`, `users`, `analytics`.

---

## 5. Testing

* **Smart Contracts:** **Foundry** — Unit tests, fuzz testing, gas reports, coverage.
* **Frontend Unit Tests:** **Vitest** + **React Testing Library** — Component and hook testing with happy-dom.
* **Frontend E2E Tests:** **Playwright** — Chromium-based browser testing against the running application.
* **Docker E2E:** Playwright runs inside Docker against the full stack via `make e2e`.

---

## 6. DevOps & Deployment

* **Containerization:** **Docker Compose** — Full-stack sandbox with 6 services (Anvil, PostgreSQL, Redis, deployer, backend, frontend).
* **Orchestration:** **Makefile** — `make up`, `make down`, `make e2e`, `make logs`, `make deploy`, `make clean`.
* **CI/CD:** **GitHub Actions** — Automates linting, testing, and deployment.
* **Frontend Hosting:** **Vercel** — For production deployment.

### Summary Table

| Category | Technology |
| --- | --- |
| **Language** | Solidity / TypeScript |
| **Contracts** | Foundry / OpenZeppelin / Solady |
| **Frontend** | Next.js 16 / React 19 / Tailwind CSS v4 / Wagmi v2 |
| **Backend** | Fastify 5 / Drizzle ORM / PostgreSQL / Redis |
| **Testing** | Foundry / Vitest / Playwright |
| **DevOps** | Docker Compose / Makefile / GitHub Actions |
