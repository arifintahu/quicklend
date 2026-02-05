<p align="center">
  <h1 align="center">QuickLend Protocol</h1>
  <p align="center">
    <strong>A Decentralized, Non-Custodial Lending Protocol</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#documentation">Documentation</a>
  </p>
</p>

---

## Overview

**QuickLend** is a decentralized, non-custodial liquidity protocol where users can participate as **Suppliers** (providing liquidity to earn interest) or **Borrowers** (taking over-collateralized loans). The protocol uses pooled liquidity, algorithmic interest rates based on utilization, and a robust health factor system for position management.

### Core Philosophy

- **Pooled Liquidity** — No peer-to-peer matching; users interact with a smart contract pool
- **Over-Collateralization** — All loans must be backed by more value than the debt to ensure solvency
- **Algorithmic Interest** — Rates are determined by the ratio of borrowed funds to supplied funds

---

## Features

- **Supply & Withdraw** — Deposit ERC-20 tokens and receive yield-bearing qTokens
- **Borrow & Repay** — Take over-collateralized loans against your supplied assets
- **Multi-Asset Support** — Supply Asset A and borrow Asset B with cross-collateral support
- **Liquidations** — Third-party liquidators can liquidate unhealthy positions for a bonus
- **Real-time Health Factor** — Monitor position health with USD-denominated calculations
- **Gas Optimized** — Built with Solady's FixedPointMathLib for efficient on-chain math

---

## Architecture

```
quicklend/
├── smart-contract/     # Foundry-based Solidity smart contracts
│   ├── src/
│   │   ├── core/       # LendingPool, InterestRateModel
│   │   ├── tokens/     # qToken (yield-bearing ERC20)
│   │   ├── interfaces/ # Contract interfaces
│   │   ├── periphery/  # UiPoolDataProvider
│   │   └── mocks/      # Test mocks
│   └── test/           # Foundry tests
├── frontend/           # Next.js 16 frontend application
│   └── src/
│       ├── app/        # Next.js App Router pages
│       ├── components/ # React components
│       ├── hooks/      # Wagmi & custom hooks
│       ├── lib/        # Utilities & contract configs
│       ├── providers/  # RainbowKit & QueryClient providers
│       └── store/      # Zustand state management
├── backend/            # Fastify-based indexer & API server
│   └── src/
│       ├── api/        # REST API routes
│       ├── config/     # Environment configuration
│       ├── db/         # Drizzle ORM schemas & migrations
│       └── lib/        # Utilities & blockchain clients
└── docs/               # Design docs & specifications
```

### Smart Contract Architecture

```mermaid
graph TD
    User[User] -->|Supply/Borrow/Repay| LP[LendingPool]
    Frontend[Frontend] -->|Read Data| UDP[UiPoolDataProvider]
    
    subgraph Core Protocol
        LP -->|Mint/Burn| qT[qToken]
        LP -->|Get Rates| IRM[InterestRateModel]
        LP -->|Get Prices| Oracle[PriceOracle]
        LP -->|Transfer Assets| ERC20[Underlying ERC20]
    end
    
    subgraph Periphery
        UDP -->|Read State| LP
        UDP -->|Read Prices| Oracle
    end
```

### Core Contracts

| Contract | Description |
|----------|-------------|
| **LendingPool.sol** | Main entry point for Supply, Borrow, Repay, Withdraw, Liquidate |
| **qToken.sol** | Yield-bearing ERC20 representing pool share |
| **InterestRateModel.sol** | Stateless contract for rate calculations (WAD arithmetic) |
| **UiPoolDataProvider.sol** | Read-only aggregator for frontend data |

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **pnpm** or **npm**
- **Foundry** (for smart contracts)
- **Docker** (for local database)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/arifintahu/quicklend.git
cd quicklend
```

### 2. Smart Contracts

```bash
cd smart-contract

# Install dependencies (git submodules)
git submodule update --init --recursive

# Build contracts
forge build

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Deploy locally (start Anvil in a separate terminal first)
anvil

# Deploy using Anvil's default test account (DO NOT use in production!)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Extract contract addresses for backend .env
cat broadcast/Deploy.s.sol/31337/run-latest.json | jq -r '
  .transactions | 
  [group_by(.contractName)[] | {name: .[0].contractName, addr: .[0].contractAddress}] |
  map(
    if .name == "LendingPool" then "LENDING_POOL_ADDRESS=\(.addr)"
    elif .name == "UiPoolDataProvider" then "UI_DATA_PROVIDER_ADDRESS=\(.addr)"
    else empty end
  ) | .[]
'

# Extract all contract addresses for frontend .env.local
cat broadcast/Deploy.s.sol/31337/run-latest.json | jq -r '
  .transactions | 
  [group_by(.contractName)[] | {name: .[0].contractName, addr: .[0].contractAddress}] |
  map(
    if .name == "LendingPool" then "NEXT_PUBLIC_LENDING_POOL_ADDRESS=\(.addr)"
    elif .name == "UiPoolDataProvider" then "NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=\(.addr)"
    elif .name == "MockPriceOracle" then "NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=\(.addr)"
    elif .name == "MockERC20" then empty
    else empty end
  ) | .[]
'

# Get MockERC20 addresses (USDC, WETH, WBTC in deployment order)
echo "# Token addresses from deployment order: USDC, WETH, WBTC"
cat broadcast/Deploy.s.sol/31337/run-latest.json | jq -r '
  [.transactions[] | select(.contractName == "MockERC20")] | 
  unique_by(.contractAddress) |
  "NEXT_PUBLIC_USDC_ADDRESS=\(.[0].contractAddress)\nNEXT_PUBLIC_WETH_ADDRESS=\(.[1].contractAddress)\nNEXT_PUBLIC_WBTC_ADDRESS=\(.[2].contractAddress)"
'
```

> **Note**: Copy the addresses to your `.env` files:
> 
> **Backend** (`backend/.env`):
> ```env
> LENDING_POOL_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
> UI_DATA_PROVIDER_ADDRESS=0x<deployed_address>
> ```
> 
> **Frontend** (`frontend/.env.local`):
> ```env
> NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
> NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=0x<deployed_address>
> NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
> NEXT_PUBLIC_USDC_ADDRESS=0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9
> NEXT_PUBLIC_WETH_ADDRESS=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
> NEXT_PUBLIC_WBTC_ADDRESS=0x5fc8d32690cc91d4c39d9d3abcbd16989f875707
> ```

### 3. Backend (Indexer & API)

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL & Redis (via Docker)
docker-compose up -d

# Generate database migrations (from Drizzle schema)
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3001`.

### 4. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your WalletConnect Project ID and API URL

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Smart Contracts** | Solidity 0.8.20, Foundry, OpenZeppelin, Solady |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Web3 Integration** | Wagmi, Viem, RainbowKit, TanStack Query |
| **Backend** | Node.js, Fastify, TypeScript, Drizzle ORM |
| **Database** | PostgreSQL, Redis |
| **Oracle** | Chainlink Price Feeds |
| **Testing** | Foundry (unit, fuzz, fork testing) |
| **Deployment** | Vercel (frontend), Docker (backend) |

---

## Environment Variables

### Backend (`.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quicklend

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337

# Contracts (Update after deployment)
LENDING_POOL_ADDRESS=
UI_DATA_PROVIDER_ADDRESS=

# CORS
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_LENDING_POOL_ADDRESS=
NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=

# Token Addresses (Mocks for local development)
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_WETH_ADDRESS=
NEXT_PUBLIC_WBTC_ADDRESS=

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

---

## Documentation

Detailed documentation is available in the `/docs` directory:

- **[Product Requirements](docs/PRODUCT_REQUIREMENT_DOC.md)** — Functional requirements and core mechanics
- **[Technical Specification](docs/TECH_SPEC.md)** — Smart contract architecture and data structures
- **[Tech Stack](docs/TECH_STACK.md)** — Complete technology stack details
- **[Design Philosophy](docs/DESIGN_PHILOSOPHY.md)** — UI/UX design principles
- **[Smart Contract Integration](docs/SMART_CONTRACT_INTEGRATION.md)** — Frontend integration guide
- **[Smart Contract README](smart-contract/README.md)** — Detailed smart contract documentation
- **[Security Audit](smart-contract/SECURITY_AUDIT.md)** — Security audit findings

---

## Risk Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Base Rate | 2% | Minimum borrow rate at 0% utilization |
| Slope | 10% | Rate increase per unit utilization |
| Reserve Factor | 10% | Protocol fee on interest earnings |
| Close Factor | 50% | Maximum debt repayable per liquidation |
| Max Liquidation Bonus | 20% | Maximum bonus for liquidators |

---

## Security

The protocol implements multiple security measures:

- **Reentrancy Protection** — OpenZeppelin's `ReentrancyGuard` on all state-changing functions
- **Pausable** — Emergency pause mechanism for protocol owner
- **Health Factor Validation** — Dual threshold system (LTV for new borrows, Liquidation Threshold for positions)
- **Oracle Price Validation** — All prices validated to be non-zero
- **Safe Token Transfers** — OpenZeppelin's `SafeERC20` for all token operations

---

## License

MIT
