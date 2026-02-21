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
- **State**: Custom hooks (`hooks/`) for contract reads/writes and backend API queries.
- **Key hooks**: `useLendingActions`, `useMarkets`, `useProtocolHealth`, `useTokenApproval`, `useUserPositions`, `useWallet`, `useWalletBalance`, `useTransactionHistory`.
- **Contract ABIs and addresses**: Defined in `lib/contracts.ts`, addresses loaded from `NEXT_PUBLIC_*` env vars.
- **API client**: `lib/api.ts` — backend API calls for history and analytics.
- **Calculations**: `lib/calculations.ts` — client-side financial math (health factor, APY, etc.).
- **Path alias**: `@/*` maps to `./src/*`.

#### Key Atoms
- **`ErrorBoundary`** — Client-side React class component. Wraps the entire app in `layout.tsx`. Shows "Your funds are safe" recovery UI.
- **`Skeleton`** — Shimmer loading placeholder: `<div className="animate-pulse bg-white/10 rounded" />`. Used in dashboard and markets stat cards.
- **`Button`** — Variants: `primary`, `secondary`, `danger`, `ghost`, `warning` (amber gradient, for Borrow actions).

#### Key Organisms
- **`ActionCard`** — Multi-step modal: `input → approve → confirm`. Handles token approval flow via `useTokenApproval`. `isConfirmBlocked` guards `borrow` and `withdraw` when projected HF < 1.0. `resetApprove()` is called on action-type change and on "Back" navigation to prevent stale `isApproved` latch.
- **`BottomNav`** — Fixed mobile tab bar (`md:hidden`). Four tabs: Dashboard, Markets, Portfolio, History. Amber active indicator.
- **`Sidebar`** — Hidden on mobile (`hidden md:flex`). Visible only on `md+`.

#### Contexts
- **`SettingsContext`** (`contexts/SettingsContext.tsx`) — Persists `{ currency: 'USD'|'EUR'|'GBP', language: string }` to `localStorage` under key `quicklend_settings`. Uses lazy `useState` initializer (no `useEffect`). Validates parsed data before applying. Exposes `useSettings()`.
- **`ToastContext`** — Toast notifications. `useToast()` must be called inside `ToastProvider` (in `layout.tsx`).

#### ESLint Note
The project uses a custom `react-hooks/set-state-in-effect` rule. Avoid `setState` inside `useEffect` bodies. Use lazy `useState` initializers for localStorage reads, and `useMemo` for derived values instead of state+effect pairs.

### Backend Layer
- **API routes** in `src/api/routes/`: `health`, `markets`, `users`, `analytics`. Swagger docs at `/docs`.
- **Event indexer** in `src/indexer/`: Backfills historical events and watches for new ones in real-time. Materializes `userPositions` and `liquidationLogs`.
- **Market snapshots** in `src/indexer/snapshots.ts`: Periodic (60s) snapshot of on-chain market data via UiPoolDataProvider.
- **Database**: PostgreSQL via Drizzle ORM. Schema in `src/db/schema.ts`. Tables: events, userPositions, marketSnapshots, notificationPreferences, indexerState, liquidationLogs.
- **Cache**: Redis via ioredis (`src/lib/redis.ts`). Markets API cached with 30s TTL.
- **Blockchain client**: Viem for reading on-chain data (`src/lib/viem.ts`).
- **Validation**: `@sinclair/typebox` for JSON schema validation on routes.
- **Path alias**: `@/*` maps to `./src/*`.

### Key Data Flow
1. Smart contracts emit events on supply/borrow/repay/withdraw/liquidate
2. Backend indexes these events into PostgreSQL (`events` table)
3. Backend materializes `userPositions` and `marketSnapshots` from events
4. Frontend reads from backend API for historical data and from contracts directly (via UiPoolDataProvider) for real-time data

## Docker Sandbox (Recommended)

Run the entire stack with a single command:
```bash
make up          # Build and start all services (postgres, redis, anvil, deployer, backend, frontend)
make logs        # Follow logs from all services
make down        # Stop everything and clean volumes
make deploy      # Re-deploy contracts only
```

This starts: PostgreSQL, Redis, Anvil (local chain), auto-deploys contracts, starts backend (with indexer), and frontend.
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001 (Swagger docs at /docs)
- Anvil RPC: http://localhost:8545

Test tokens are auto-minted to the default Anvil account (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`).

## Manual Environment Setup

- Frontend env: `frontend/.env.local` (copy from `.env.local.example`) — contract addresses, WalletConnect project ID, API URL
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
