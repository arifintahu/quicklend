# Technical Specification: QuickLend Protocol

## 1. Smart Contract Architecture

QuickLend is built on a modular, smart contract architecture with the following core components:

| Contract | Role | Key Responsibility |
| --- | --- | --- |
| **LendingPool.sol** | Core Engine | Manages global state, logic for supply, borrow, repay, withdraw, and liquidations. Uses OpenZeppelin `ReentrancyGuard` and `Pausable`. |
| **qToken.sol** | Yield Asset | ERC-20 token representing pool share; balance increases via interest accrual. |
| **MockPriceOracle.sol** | Data Feed | Provides asset price feeds. Pluggable interface for Chainlink in production. |
| **InterestRateModel.sol** | Logic | Stateless contract calculating borrow and supply rates using WAD arithmetic (Solady FixedPointMathLib). |
| **UiPoolDataProvider.sol** | Helper | Read-only aggregator contract to batch market and user data for the frontend. |

---

## 2. Data Structures & State

### 2.1 Market Configuration

```solidity
struct Market {
    bool isListed;
    uint256 ltv;                 // Maximum borrowing power (e.g. 80%)
    uint256 liqThreshold;        // Point at which liquidation triggers
    uint256 liqBonus;            // Incentive for the liquidator
    qToken qTokenAddress;        // The yield-bearing token for this market
    uint256 totalSupplied;
    uint256 totalBorrowed;
    uint256 borrowIndex;         // Global borrow index for interest accrual
    uint256 lastUpdateTimestamp;
    uint256 reserveFactor;       // Protocol fee on interest
}
```

### 2.2 User Configuration

Users can toggle specific assets as collateral to manage their risk:

```solidity
mapping(address => mapping(address => bool)) public userCollateralEnabled; // asset -> user -> isCollateral
mapping(address => mapping(address => uint256)) public userBorrowShares;   // asset -> user -> borrow shares
```

Collateral is auto-enabled on first deposit and can be toggled via `setCollateral(asset, enabled)`.

---

## 3. Protocol Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Base Rate | 2% | Minimum borrow rate at 0% utilization |
| Slope | 10% | Rate increase per unit utilization |
| Reserve Factor | 10% | Protocol fee on interest earnings |
| Close Factor | 50% | Maximum debt repayable per liquidation |
| Max Liquidation Bonus | 20% | Maximum bonus for liquidators |
| Timelock Period | 48 hours | Delay for admin ownership transfers |

### Market Configuration

| Asset | LTV | Liquidation Threshold | Liquidation Bonus | Mock Price |
|-------|-----|----------------------|-------------------|------------|
| USDC | 80% | 85% | 5% | $1 |
| WETH | 75% | 80% | 5% | $2,500 |
| WBTC | 70% | 75% | 5% | $45,000 |

---

## 4. The Liquidation Flow

If a user's Health Factor drops below 1.0, their position is flagged for liquidation:

1. **Liquidator** calls `liquidate(borrower, debtAsset, collateralAsset, debtAmount)`.
2. The protocol verifies `healthFactor < 1.0` and `debtAmount <= closeFactor * totalDebt`.
3. The liquidator repays the debt and receives the borrower's **qTokens** (collateral) at a discount determined by the liquidation bonus.
4. The borrower's debt is reduced, and the liquidator can hold or burn the qTokens.

---

## 5. Backend Architecture

### 5.1 Event Indexer

The backend runs a real-time event indexer (`src/indexer/`) that:

- **Backfills** historical events from the chain on startup
- **Watches** for new events (Supply, Borrow, Repay, Withdraw, Liquidate) in real-time
- **Materializes** derived tables: `userPositions`, `liquidationLogs`
- **Snapshots** market data every 60 seconds via `UiPoolDataProvider`

### 5.2 Database Schema (PostgreSQL)

| Table | Purpose |
|-------|---------|
| `events` | Raw indexed blockchain events |
| `userPositions` | Materialized supply/borrow positions per user per asset |
| `marketSnapshots` | Periodic snapshots of on-chain market data |
| `liquidationLogs` | Detailed liquidation event records |
| `notificationPreferences` | User notification settings |
| `indexerState` | Tracks last indexed block for resumability |

### 5.3 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Service health check |
| `/api/markets` | GET | All markets with stats (Redis cached, 30s TTL) |
| `/api/users/:address/positions` | GET | User positions from indexed data |
| `/api/users/:address/history` | GET | Transaction history for a user |
| `/api/analytics` | GET | Protocol-wide analytics |

Swagger documentation available at `/docs`.

---

## 6. Frontend Architecture

### 6.1 Key Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useMarkets` | On-chain (UiPoolDataProvider) | Fetch all market data |
| `useUserPositions` | On-chain (UiPoolDataProvider) | Fetch user supply/borrow positions |
| `useProtocolHealth` | On-chain (LendingPool) | Calculate user health factor |
| `useLendingActions` | On-chain (LendingPool) | Supply, borrow, repay, withdraw, liquidate |
| `useTokenApproval` | On-chain (ERC20) | Check and request token approvals |
| `useWallet` | RainbowKit | Wallet connection modal and account info |
| `useWalletBalance` | On-chain (ERC20) | Token balance for connected wallet |
| `useTransactionHistory` | Backend API | Paginated transaction history |

### 6.2 Data Flow

1. **Real-time data**: Frontend reads directly from contracts via `UiPoolDataProvider` using Wagmi hooks
2. **Historical data**: Frontend queries backend API for transaction history and analytics
3. **Write operations**: Frontend sends transactions through Wagmi to `LendingPool` contract
4. **Events**: Backend indexes emitted events into PostgreSQL for fast querying

---

## 7. Security Standards

* **Reentrancy Protection:** All state-changing functions use OpenZeppelin's `nonReentrant` modifier.
* **Pausable:** Emergency pause mechanism for the protocol owner.
* **Health Factor Validation:** Dual threshold system — LTV for new borrows, Liquidation Threshold for existing positions.
* **Oracle Price Validation:** All prices validated to be non-zero before use.
* **Safe Token Transfers:** OpenZeppelin's `SafeERC20` for all token operations.
* **Fee-on-Transfer Protection:** Actual received amounts measured via balance diff on supply.
* **Timelock:** 48-hour delay on ownership transfers via two-step process.
