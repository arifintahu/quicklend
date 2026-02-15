# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuickLend is a decentralized, non-custodial lending protocol. Users supply ERC-20 tokens to earn interest (receiving yield-bearing qTokens) or take over-collateralized loans. The project has three independent packages: smart contracts, frontend, and backend.

## Commands

### Smart Contracts (Foundry)
```bash
cd smart-contract
forge build                          # Compile contracts
forge test                           # Run all tests
forge test --match-test testName     # Run a single test
forge test -vvv                      # Verbose output with traces
forge test --gas-report              # Gas usage report
forge coverage                       # Coverage report
anvil                                # Start local chain (port 8545)
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

### Frontend (Next.js 16)
```bash
cd frontend
npm install
npm run dev                          # Dev server on :3000
npm run build                        # Production build
npm run lint                         # ESLint
```

### Backend (Fastify)
```bash
cd backend
npm install
docker-compose up -d                 # Start PostgreSQL + Redis
npm run db:generate                  # Generate Drizzle migrations
npm run db:migrate                   # Run migrations
npm run dev                          # Dev server on :3001 (tsx watch)
npm run build                        # TypeScript compile to dist/
npm run db:studio                    # Drizzle Studio GUI
```

## Architecture

### Three-Package Structure (not a monorepo)
- **smart-contract/** — Foundry project, Solidity 0.8.20. Core protocol logic.
- **frontend/** — Next.js 16 App Router, React 19, TypeScript. Web3 UI.
- **backend/** — Fastify 5, TypeScript (ESM). Blockchain indexer + REST API.

### Smart Contract Layer
- **LendingPool.sol** (`src/core/`) — Main entry point: supply, borrow, repay, withdraw, liquidate. Uses OpenZeppelin ReentrancyGuard and Pausable.
- **qToken.sol** (`src/tokens/`) — Yield-bearing ERC20 minted/burned by LendingPool. Exchange rate grows with accrued interest.
- **InterestRateModel.sol** (`src/core/`) — Stateless rate calculator using WAD arithmetic (Solady FixedPointMathLib).
- **UiPoolDataProvider.sol** (`src/periphery/`) — Read-only aggregator for frontend data queries.
- **Interfaces** in `src/interfaces/`, mock contracts in `src/mocks/`.
- Dependencies managed via git submodules (`lib/`): OpenZeppelin, Solady, forge-std.

### Frontend Layer
- **Component pattern**: Atomic design — `components/atoms/`, `molecules/`, `organisms/`, `templates/`.
- **Web3 stack**: Wagmi + Viem for chain interaction, RainbowKit for wallet UI, TanStack Query for data fetching.
- **State**: Zustand (`store/`) for global state, custom hooks (`hooks/`) for contract reads/writes.
- **Key hooks**: `useLendingActions`, `useMarkets`, `useProtocolHealth`, `useTokenApproval`, `useUserPositions`, `useWallet`.
- **Contract ABIs and addresses**: Defined in `lib/contracts.ts`, addresses loaded from `NEXT_PUBLIC_*` env vars.
- **Calculations**: `lib/calculations.ts` — client-side financial math (health factor, APY, etc.).
- **Path alias**: `@/*` maps to `./src/*`.

### Backend Layer
- **API routes** in `src/api/routes/`: `health`, `markets`, `users`, `analytics`. Swagger docs at `/docs`.
- **Database**: PostgreSQL via Drizzle ORM. Schema in `src/db/schema.ts`. Tables: events, userPositions, marketSnapshots, notificationPreferences, indexerState, liquidationLogs.
- **Cache**: Redis via ioredis.
- **Blockchain client**: Viem for reading on-chain data (`src/lib/`).
- **Validation**: `@sinclair/typebox` for JSON schema validation on routes.
- **Path alias**: `@/*` maps to `./src/*`.

### Key Data Flow
1. Smart contracts emit events on supply/borrow/repay/withdraw/liquidate
2. Backend indexes these events into PostgreSQL (`events` table)
3. Backend materializes `userPositions` and `marketSnapshots` from events
4. Frontend reads from backend API for historical data and from contracts directly (via UiPoolDataProvider) for real-time data

## Environment Setup

- Frontend env: `frontend/.env.local` (copy from `.env.local.example`) — contract addresses, WalletConnect project ID
- Backend env: `backend/.env` (copy from `.env.example`) — DATABASE_URL, REDIS_URL, RPC_URL, contract addresses
- Local chain: Anvil on port 8545, chain ID 31337
- After deploying contracts, extract addresses from `smart-contract/broadcast/Deploy.s.sol/31337/run-latest.json`

## Protocol Parameters

- Interest: 2% base rate, 10% slope, 10% reserve factor
- Liquidation: 50% close factor, up to 20% liquidation bonus
- Default mock prices: USDC=$1, WETH=$2,500, WBTC=$45,000
- Health factor < 1.0 triggers liquidation eligibility

## Documentation

Detailed specs live in `docs/`: PRODUCT_REQUIREMENT_DOC.md (functional requirements), TECH_SPEC.md (contract architecture and data structures), DESIGN_PHILOSOPHY.md (UI/UX principles), SMART_CONTRACT_INTEGRATION.md (frontend integration guide). Smart contract security findings in `smart-contract/SECURITY_AUDIT.md`.
