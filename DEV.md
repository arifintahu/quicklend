# Development Guide

## Prerequisites

- **Node.js** v20+
- **Foundry** (for smart contract development)
- **Docker** and **Docker Compose** (for PostgreSQL, Redis, or full-stack sandbox)
- **Git**

---

## Manual Setup (without Docker)

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

# Deploy using Anvil's default test account
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

After deployment, extract contract addresses from `broadcast/Deploy.s.sol/31337/run-latest.json` and update your `.env` files (see [Environment Variables](#environment-variables) below).

### 3. Backend (Indexer & API)

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL & Redis (via Docker)
docker compose up -d

# Generate database migrations (from Drizzle schema)
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3001`. Swagger docs at `/docs`.

### 4. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with contract addresses and WalletConnect Project ID

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

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

# Contracts (update after deployment)
LENDING_POOL_ADDRESS=
UI_DATA_PROVIDER_ADDRESS=
PRICE_ORACLE_ADDRESS=
USDC_ADDRESS=
WETH_ADDRESS=
WBTC_ADDRESS=

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

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Running Tests

### Smart Contract Tests (Forge)

```bash
cd smart-contract
forge test                           # Run all tests
forge test --match-test testName     # Run a single test
forge test -vvv                      # Verbose output with traces
forge test --gas-report              # Gas usage report
forge coverage                       # Coverage report
```

### Frontend Unit Tests (Vitest)

```bash
cd frontend
npm run test              # Run all unit tests once
npm run test:watch        # Run in watch mode
npm run test:coverage     # Run with coverage report
```

Unit tests cover:
- **Library functions** — calculations, API client, utilities
- **Custom hooks** — useTransactionHistory, useWalletBalance
- **Page components** — Dashboard, Portfolio, Markets, History

### Frontend E2E Tests (Playwright)

#### Local

```bash
cd frontend
npx playwright install        # Install browsers (first time only)
npm run test:e2e              # Run all E2E tests
```

E2E tests require the frontend dev server on port 3000. Playwright starts it automatically if not already running.

#### Docker

```bash
make e2e      # Starts full stack + runs E2E tests, exits with test result code
```

Test specs:
- `e2e/navigation.spec.ts` — Page navigation, sidebar, responsive layout
- `e2e/markets.spec.ts` — Market statistics, search, asset table
- `e2e/history.spec.ts` — Empty states, page layout

---

## Docker Sandbox

### Services

```bash
make up       # Build and start all services
make down     # Stop all services and remove volumes
make logs     # Follow logs from all services
make e2e      # Run E2E tests in Docker
make deploy   # Re-deploy contracts only
make clean    # Stop services, remove volumes and images
```

Or use Docker Compose directly:

```bash
docker compose up -d --build    # Start all services
docker compose down -v          # Stop and remove volumes
docker compose logs -f          # Follow all logs
```

### Seeded Test Accounts

The deployer automatically seeds the local chain with liquidity and test positions using Anvil's deterministic accounts (all derived from the same mnemonic):

**Mnemonic**: `test test test test test test test test test test test junk`

| Account | Address | Role |
|---------|---------|------|
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Test user (has supply + borrow positions) |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Liquidity provider (supplies USDC) |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Liquidity provider (supplies WETH) |
| #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Liquidity provider (supplies WBTC) |

#### Liquidity Providers (#1-#3)

Each provides deep liquidity for one asset:
- **#1**: 500,000 USDC supplied
- **#2**: 200 WETH (~$500,000) supplied
- **#3**: 11 WBTC (~$495,000) supplied

#### Test User (#0)

Pre-seeded positions:
- **Supplied**: 10 WETH (~$25,000), 0.5 WBTC (~$22,500)
- **Borrowed**: 5,000 USDC
- **Wallet balances**: 1,000,000 USDC, 90 WETH, 9.5 WBTC

### Mock Oracle Prices

| Token | Price |
|-------|-------|
| USDC | $1 |
| WETH | $2,500 |
| WBTC | $45,000 |
