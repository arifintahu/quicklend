# Technical Specification: QuickLend Protocol

## 1. Smart Contract Architecture

QuickLend is built on a modular, smart contract architecture with the following core components:

| Contract | Role | Key Responsibility |
| --- | --- | --- |
| **LendingPool.sol** | Core Engine | Manages global state, logic for supply, borrow, and liquidations. |
| **qToken.sol** | Yield Asset | EIP-20 token representing pool share; balance increases via interest. |
| **PriceOracle.sol** | Data Feed | Connects to Chainlink for real-time valuation of collateral and debt. |
| **InterestRateModel.sol** | Logic | Stateless contract calculating  and  per market state. |
| **UiPoolDataProvider.sol** | Helper | View-only contract to aggregate market and user data for the frontend. |

---

## 2. Data Structures & State

### 2.1 Market Configuration

```solidity
struct Market {
    bool isListed;
    uint256 ltv;                 // Maximum borrowing power (e.g. 80%)
    uint256 liqThreshold;        // Point at which liquidation triggers
    uint256 liqBonus;            // Incentive for the liquidator
    address qTokenAddress;       // The specific qToken for this market
    uint256 totalSupplied;       
    uint256 totalBorrowed;       
}

```

### 2.2 User Configuration

Users can toggle specific assets as collateral to manage their risk. This allows isolating risk or preventing liquidation of specific assets.

```solidity
mapping(address => mapping(address => bool)) public userCollateralEnabled; // asset -> user -> isCollateral
```

---

## 3. The Liquidation Flow

If a user's ****, their position is flagged for liquidation:

1. **Liquidator** calls `liquidate()` providing the debt asset.
2. The protocol verifies the .
3. The liquidator repays the debt and receives the borrower's **qTokens** (collateral) at a discount.
4. The borrower's debt is cleared, and the liquidator can choose to hold or burn the **qTokens** for the underlying collateral.

---

## 4. Security Standards

* **Reentrancy Protection:** All state-changing functions (withdraw/borrow) must use `nonReentrant` modifiers.
* **Oracle Staleness:** The protocol must revert if the Price Oracle hasn't updated within a specific timeframe (e.g., 1 hour).
* **Interest Accrual:** Interest must be updated on-chain during every transaction to ensure the `GlobalIndex` is accurate.