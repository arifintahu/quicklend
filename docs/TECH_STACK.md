# Technical Stack: QuickLend Protocol

## 1. Core Blockchain Layer (Smart Contracts)

The "engine room" of the protocol. We prioritize security, gas efficiency, and EVM compatibility.

* **Language:** **Solidity (^0.8.20)** — Utilizing the latest stable version for built-in overflow checks and optimized `via-ir` compilation.
* **Development Framework:** **Foundry** — Chosen over Hardhat for its Rust-based speed and the ability to write unit tests in Solidity, ensuring developers don't have to switch contexts between JS/TS and Smart Contracts.
* **Libraries:** **OpenZeppelin** — For industry-standard implementations of `ERC20`, `Ownable`, `ReentrancyGuard`, and `Initializable` (for UUPS proxy patterns).
* **Math Logic:** **FixedPointMathLib (Solady)** — An gas-optimized math library for handling "Ray" (27 decimal) and "Wad" (18 decimal) precision.

---

## 2. Infrastructure & Data Layer

The bridge between the blockchain and the user interface.

* **Oracle Provider:** **Chainlink Data Feeds** — The gold standard for secure, decentralized price discovery.
* **Indexing:** **The Graph (Subgraphs)** — Used to index protocol events (`Supply`, `Borrow`, `Liquidate`) for fast, queryable access to historical user data and global TVL.
* **RPC Providers:** **Alchemy** or **Infura** — For reliable node connectivity during deployment and frontend interactions.
* **Storage (Metadata):** **IPFS / Pinata** — To host decentralized versions of the Design System assets and frontend builds (ensuring censorship resistance).

---

## 3. Frontend & User Interface

A modern, high-performance stack that aligns with our "Velocity & Veracity" philosophy.

* **Framework:** **Next.js 14+ (App Router)** — For server-side rendering (SSR) of market data and fast page transitions.
* **State Management:** **TanStack Query (React Query)** — To handle the caching and synchronization of blockchain data.
* **Blockchain Hooks:** **Wagmi & Viem** — A lightweight, type-safe alternative to Ethers.js for wallet connections and contract interactions.
* **Wallet Connectivity:** **RainbowKit** — Provides a world-class, customizable UI for connecting user wallets.
* **Styling:** **Tailwind CSS** + **Framer Motion** — Tailwind for rapid UI development; Framer Motion for the sleek "Glassmorphic" transitions and the Health Dial animations.

---

## 4. Architecture Overview Diagram

---

## 5. Security & DevSecOps

* **Static Analysis:** **Slither** and **Aderyn** — To catch common vulnerabilities (reentrancy, uninitialized contracts) during the CI/CD pipeline.
* **Formal Verification:** **Certora** or **Kontrol** — For verifying the mathematical correctness of the Interest Rate Model.
* **Testing Suite:**
* **Unit Tests:** Foundry (100% branch coverage target).
* **Integration Tests:** Mainnet Forking (Foundry `anvil` or `forge test --fork-url`).
* **Invariants:** Fuzz testing with `foundry` to ensure the Health Factor logic never breaks under extreme edge cases.



---

## 6. Deployment & CI/CD

* **CI/CD:** **GitHub Actions** — Automates contract linting, testing, and documentation generation (Docgen).
* **Frontend Hosting:** **Vercel** — For high-speed global delivery of the dashboard.
* **Monitoring:** **Defender (OpenZeppelin)** — For real-time monitoring of large transactions, liquidations, and admin-governance actions.

### Summary Table

| Category | Technology |
| --- | --- |
| **Language** | Solidity / TypeScript |
| **Testing** | Foundry |
| **Oracle** | Chainlink |
| **Indexing** | The Graph |
| **Frontend** | Next.js / Tailwind / Wagmi |
| **Deployment** | Vercel / GitHub Actions |

Would you like me to generate the **`foundry.toml` configuration** and the **initial folder structure** for the project repository?