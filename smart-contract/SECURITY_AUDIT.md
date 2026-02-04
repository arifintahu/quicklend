# QuickLend Smart Contract Security Audit Report

**Audit Date:** 2026-02-04
**Audited Contracts:** `LendingPool.sol`, `InterestRateModel.sol`, `qToken.sol`, `UiPoolDataProvider.sol`
**Solidity Version:** ^0.8.20
**Framework:** Foundry
**Checklist Reference:** [Solidity Security Audit Checklist](https://github.com/iAnonymous3000/solidity-security-audit-checklist)

---

## Executive Summary

This audit identified **17 findings** across the QuickLend lending protocol smart contracts:

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 5 |
| Low | 5 |

---

## Critical Findings

### C-01: Missing Decimal Normalization in `_seizeCollateral` — Cross-Decimal Liquidations Produce Incorrect Amounts

**File:** `LendingPool.sol:308-330`
**Checklist Category:** Arithmetic Issues

`_seizeCollateral` computes the collateral to seize without normalizing for decimal differences between the borrow asset and the collateral asset:

```solidity
uint256 debtValueUsd = actualDebtToCover.mulWad(_getValidatedPrice(assetBorrow));
uint256 collateralValueUsd = debtValueUsd.mulWad(1e18 + markets[assetCollateral].liqBonus);
collateralAmount = collateralValueUsd.divWad(_getValidatedPrice(assetCollateral));
```

`actualDebtToCover` is denominated in the borrow asset's native decimals. When the borrow asset (e.g., USDC with 6 decimals) differs from the collateral asset (e.g., WETH with 18 decimals), the resulting `collateralAmount` is off by `10^(18 - borrowDecimals)`.

**Proof:**
- Liquidator covers 1000 USDC debt: `actualDebtToCover = 1000e6 = 10^9`
- `debtValueUsd = mulWad(10^9, 1e18) = 10^9`
- `collateralValueUsd = mulWad(10^9, 1.05e18) = 1.05 * 10^9`
- `collateralAmount = divWad(1.05e9, 2000e18) = 525000`
- This represents `525000 / 10^18 ≈ 0.0000000000005 WETH` instead of `0.525 WETH`

The liquidator receives essentially nothing. The existing test suite does not catch this because both mock tokens use 18 decimals.

**Recommendation:** Normalize `actualDebtToCover` to 18 decimals before computing USD value, matching the approach in `_calculateHealth`:

```solidity
function _seizeCollateral(...) internal returns (uint256 collateralAmount) {
    uint8 borrowDecimals = IERC20Metadata(assetBorrow).decimals();
    uint8 collateralDecimals = IERC20Metadata(assetCollateral).decimals();

    // Normalize debt to 18 decimals
    uint256 normalizedDebt = actualDebtToCover;
    if (borrowDecimals < 18) {
        normalizedDebt = actualDebtToCover * 10 ** (18 - borrowDecimals);
    } else if (borrowDecimals > 18) {
        normalizedDebt = actualDebtToCover / 10 ** (borrowDecimals - 18);
    }

    uint256 debtValueUsd = normalizedDebt.mulWad(_getValidatedPrice(assetBorrow));
    uint256 collateralValueUsd = debtValueUsd.mulWad(1e18 + markets[assetCollateral].liqBonus);
    uint256 normalizedCollateral = collateralValueUsd.divWad(_getValidatedPrice(assetCollateral));

    // De-normalize to collateral decimals
    if (collateralDecimals < 18) {
        collateralAmount = normalizedCollateral / 10 ** (18 - collateralDecimals);
    } else if (collateralDecimals > 18) {
        collateralAmount = normalizedCollateral * 10 ** (collateralDecimals - 18);
    } else {
        collateralAmount = normalizedCollateral;
    }

    markets[assetCollateral].qTokenAddress.seize(user, msg.sender, collateralAmount);
}
```

---

### C-02: Unrestricted qToken Transfers Bypass Health Factor Checks

**File:** `qToken.sol` (inherits ERC20 `transfer`/`transferFrom`)
**Checklist Category:** Access Control, Input Validation

`qToken` extends OpenZeppelin's `ERC20` and does not override `transfer()` or `transferFrom()`. Any holder can freely transfer qTokens to another address. The LendingPool tracks collateral via `qTokenAddress.balanceOf(user)`, so a transfer reduces the sender's effective collateral **without triggering a health factor check**.

**Attack Scenario:**
1. User supplies 10,000 USDC → receives 10,000 qUSDC (collateral auto-enabled)
2. User borrows 6,000 USDC worth of WETH (health factor ~1.33)
3. User calls `qUSDC.transfer(someAddress, 5000e18)` — no health check
4. User now has only 5,000 qUSDC backing 6,000 USDC of debt (health factor ~0.67)
5. Position is immediately undercollateralized; bad debt accrues if not liquidated promptly

**Recommendation:** Override `_update` (OpenZeppelin v5) in `qToken` to invoke a health check on the sender via a callback to the LendingPool:

```solidity
function _update(address from, address to, uint256 value) internal override {
    super._update(from, to, value);
    // Skip checks for mint (from=0) and burn (to=0) as pool handles those
    if (from != address(0) && to != address(0)) {
        // Callback to pool to verify sender remains healthy
        ILendingPool(owner()).checkHealthAfterTransfer(from);
    }
}
```

---

## High Findings

### H-01: Stale `borrowIndex` in Health Factor Calculations Across Multiple Markets

**File:** `LendingPool.sol:398-453`
**Checklist Category:** Unchecked External Calls, Input Validation

`_calculateHealth()` iterates over all markets and computes each user's debt as `borrowShares.mulWad(market.borrowIndex)`. However, the caller only accrues interest on one or two specific assets before invoking the health check.

- `withdraw(asset)`: accrues interest only for `asset`, then checks health across ALL markets
- `borrow(asset)`: same — only accrues for the borrowed asset
- `setUserUseReserveAsCollateral()`: accrues **no** interest at all

If a user borrows from markets A and B, and only market A's interest is accrued, the debt in market B is computed with a stale (lower) `borrowIndex`. This results in an **overestimated health factor**, potentially allowing borrows or withdrawals that should be blocked.

**Recommendation:** Accrue interest for all markets the user has borrow positions in before computing the health factor:

```solidity
function _accrueAllUserMarkets(address user) internal {
    for (uint256 i = 0; i < marketList.length; i++) {
        if (userBorrowShares[marketList[i]][user] > 0) {
            _accrueInterest(marketList[i]);
        }
    }
}
```

---

### H-02: No Interest Accrual in `setUserUseReserveAsCollateral`

**File:** `LendingPool.sol:84-104`
**Checklist Category:** Timestamp Dependence, Input Validation

When a user disables collateral, the health check on line 99 uses `getUserHealthFactor()` which reads stale `borrowIndex` values from storage without calling `_accrueInterest` on any market. If significant time has passed since the last accrual, the actual debt is higher than computed, and the user may disable collateral that should remain enabled.

**Recommendation:** Call `_accrueAllUserMarkets(msg.sender)` before the health check, or at minimum accrue interest for the asset being toggled.

---

### H-03: Instant Oracle Change Without Timelock Enables Rug Pull

**File:** `LendingPool.sol:461-466`
**Checklist Category:** Access Control, Front-running and MEV

`setOracle()` takes effect immediately. A compromised or malicious owner can:

1. Deploy a rogue oracle returning inflated prices for their chosen collateral
2. Call `setOracle(rogueOracle)`
3. Supply a small amount of collateral (valued extremely high by the rogue oracle)
4. Borrow all available liquidity across all markets
5. Leave the protocol with irrecoverable bad debt

There is no timelock, no multi-sig requirement, and no governance delay.

**Recommendation:**
- Add a timelock (e.g., 48 hours) on `setOracle()`
- Consider using a multi-sig or governance contract as owner
- Emit a `OraclePendingUpdate` event during the delay so users can exit

---

### H-04: Deeply Underwater Positions Cannot Be Liquidated (Bad Debt)

**File:** `LendingPool.sol:308-330`
**Checklist Category:** Denial of Service

In `_seizeCollateral()`, the collateral to seize is calculated as `(debtValue * (1 + liqBonus)) / collateralPrice`. If the user's remaining qToken balance is less than this amount, `qToken._transfer()` reverts, and the liquidation fails entirely.

With a 50% close factor and 5% liquidation bonus, the liquidator needs collateral worth 52.5% of the covered debt. When a position's health factor drops below ~0.52, the required collateral for any partial liquidation exceeds the available amount, making the position unliquidatable.

This creates **permanent bad debt** that socializes losses to suppliers.

**Recommendation:**
- Cap `collateralAmount` to the user's actual qToken balance
- Implement a bad debt socialization mechanism (e.g., spread losses across suppliers or a reserve fund)
- Consider reducing liquidation bonus progressively for deeply underwater positions

---

### H-05: Fee-on-Transfer Tokens Break Internal Accounting

**File:** `LendingPool.sol:120, 212, 255`
**Checklist Category:** Unchecked External Calls, Input Validation

In `supply()`, `repay()`, and `liquidate()`, the contract uses `safeTransferFrom(msg.sender, address(this), amount)` and then credits `amount` to internal accounting. For tokens that deduct a fee on transfer (e.g., USDT with fee mode, deflationary tokens), the actual amount received is less than `amount`, creating an accounting surplus that doesn't exist.

```solidity
// supply(): line 120-122
IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
market.totalSupplied += amount; // credits full amount, but received less
```

Over time, `totalSupplied` exceeds the actual token balance, and the last users to withdraw will face reverts due to insufficient funds.

**Recommendation:** Measure the actual amount received:

```solidity
uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
uint256 actualAmount = IERC20(asset).balanceOf(address(this)) - balanceBefore;
market.totalSupplied += actualAmount;
```

Or explicitly document and enforce that fee-on-transfer tokens are not supported, with a whitelist mechanism in `initMarket()`.

---

## Medium Findings

### M-01: Unbounded `marketList` Causes Gas Exhaustion in Core Functions

**File:** `LendingPool.sol:405`
**Checklist Category:** Denial of Service

`_calculateHealth()` loops through `marketList` which has no upper bound:

```solidity
for (uint256 i = 0; i < marketList.length; i++) { ... }
```

This function is called by `borrow()`, `withdraw()`, `setUserUseReserveAsCollateral()`, `getUserHealthFactor()`, and indirectly by `liquidate()`. If enough markets are added, these functions exceed the block gas limit, bricking the protocol entirely — users cannot withdraw, positions cannot be liquidated, and bad debt accumulates.

**Recommendation:**
- Set a maximum number of markets (e.g., `MAX_MARKETS = 20`)
- Validate in `initMarket()`: `require(marketList.length < MAX_MARKETS)`

---

### M-02: No Oracle Manipulation Resistance (TWAP / Freshness Checks)

**File:** `LendingPool.sol:376-380`, `IPriceOracle.sol`
**Checklist Category:** Flash Loan Attacks

The `IPriceOracle` interface only requires a `getAssetPrice(asset)` function returning a single price. There is no:
- Staleness/freshness check (price age)
- TWAP mechanism
- Deviation bounds
- Multi-oracle aggregation

If the oracle implementation reads from a single DEX pool, an attacker can manipulate the spot price via flash loan to inflate their collateral value and extract funds in a single transaction.

**Recommendation:**
- Extend `IPriceOracle` to include a `getAssetPriceWithTimestamp` or require a maximum age for price data
- Enforce the use of Chainlink-style oracles with heartbeat checks, or TWAP from Uniswap V3
- Add deviation checks (e.g., reject prices that move >10% from the last known value)

---

### M-03: Market Parameters Are Immutable After Initialization

**File:** `LendingPool.sol:43-77`
**Checklist Category:** Access Control

Once `initMarket()` is called, the LTV, liquidation threshold, liquidation bonus, and interest rate model cannot be updated. There is no `updateMarket()` function. If market conditions change (e.g., an asset becomes more volatile), the admin has no way to adjust risk parameters without deploying a new pool.

**Recommendation:** Add an `updateMarketParameters()` function with appropriate access control and validation:

```solidity
function updateMarketParameters(
    address asset,
    uint256 newLtv,
    uint256 newLiqThreshold,
    uint256 newLiqBonus,
    address newIrModel
) external onlyOwner { ... }
```

---

### M-04: Checks-Effects-Interactions Violations (Mitigated)

**File:** `LendingPool.sol:109-137, 197-230, 235-278`
**Checklist Category:** Reentrancy Vulnerabilities

Several functions perform external token transfers before updating internal state:

- `supply()`: `safeTransferFrom` (line 120) before `totalSupplied +=` (line 122) and `mint` (line 134)
- `repay()`: `safeTransferFrom` (line 212) before borrow share updates (lines 218-227)
- `liquidate()`: `safeTransferFrom` (line 255) before debt state updates (lines 262-267)

These are CEI violations. They are **mitigated** by the `nonReentrant` modifier on all these functions. However, relying solely on reentrancy guards is a defense-in-depth concern. If the guard were ever removed or bypassed, these would become exploitable.

**Recommendation:** Restructure to follow the CEI pattern. Move state changes before external calls where possible.

---

### M-05: Self-Liquidation Is Not Prevented

**File:** `LendingPool.sol:235-278`
**Checklist Category:** Input Validation

Nothing prevents `msg.sender == user` in `liquidate()`. A user can liquidate their own position, which could be used to move collateral between addresses in a tax-advantaged or structured manner, or to extract the liquidation bonus from the protocol at the expense of other suppliers.

**Recommendation:** Add `require(msg.sender != user, "Cannot self-liquidate")` if self-liquidation is not an intended feature.

---

## Low Findings

### L-01: Simple Interest Instead of Compound Interest

**File:** `LendingPool.sol:349-360`
**Checklist Category:** Arithmetic Issues

Interest accrual uses a linear formula: `accumulatedFactor = ratePerSecond * timeDelta`. This is simple interest, not compound interest (`(1 + ratePerSecond)^timeDelta`). For long periods between accruals (common in low-activity markets), this underestimates the actual interest, favoring borrowers over suppliers.

**Recommendation:** Use an exponential approximation (e.g., Taylor series expansion) or the `rpow` function from Solady/DSMath for compound interest computation.

---

### L-02: No Minimum Supply/Borrow Amounts (Dust Positions)

**File:** `LendingPool.sol:109-192`
**Checklist Category:** Denial of Service, Gas Optimization

Users can supply or borrow as little as 1 wei. This enables:
- Dust attack: Creating many tiny positions across many markets to increase the gas cost of `_calculateHealth` for other users
- Griefing: Enabling collateral on dust positions to make health computations more expensive

**Recommendation:** Enforce minimum supply and borrow amounts per market.

---

### L-03: Block Timestamp Manipulation in Interest Accrual

**File:** `LendingPool.sol:336-338`
**Checklist Category:** Timestamp Dependence

Interest accrual relies on `block.timestamp`:

```solidity
uint256 timeDelta = block.timestamp - market.lastUpdateTimestamp;
```

Validators can manipulate timestamps by ~12-15 seconds. For interest accrual this is negligible (15 seconds of interest at 12% APY on $1M is ~$0.057), but it is worth documenting as a known limitation.

---

### L-04: Missing Explicit Market Listing Checks in `liquidate()`

**File:** `LendingPool.sol:235-278`
**Checklist Category:** Input Validation

`liquidate()` does not verify that both `assetCollateral` and `assetBorrow` are listed markets. While the function would eventually revert (e.g., `NothingToLiquidate` or zero-address revert), the error messages are unclear. Explicit checks would improve error handling and gas efficiency (fail early).

**Recommendation:** Add:
```solidity
if (!markets[assetCollateral].isListed) revert MarketNotListed();
if (!markets[assetBorrow].isListed) revert MarketNotListed();
```

---

### L-05: Utilization Rate Can Exceed 100%

**File:** `InterestRateModel.sol:24-27`, `LendingPool.sol:334-371`
**Checklist Category:** Arithmetic Issues

Because `totalBorrowed` grows by `interestEarned` while `totalSupplied` grows by only `interestEarned * (1 - reserveFactor)`, utilization can exceed `1e18` (100%) over time. The linear rate model continues to produce increasing rates without a cap, which could lead to unexpectedly high interest rates.

**Recommendation:** Either cap utilization at `1e18` in `getUtilization()`, or implement a kink-based rate model (like Compound/Aave) that jumps to a very high rate above an optimal utilization threshold.

---

## Checklist Coverage Summary

| # | Checklist Category | Status | Notes |
|---|---|---|---|
| 1 | Reentrancy Vulnerabilities | **Partial** | `ReentrancyGuard` used, but CEI pattern violated (M-04) |
| 2 | Arithmetic Issues | **Issues Found** | Decimal bug (C-01), simple interest (L-01), unbounded utilization (L-05) |
| 3 | Unchecked External Calls | **Pass** | `SafeERC20` used; oracle calls validated for zero price |
| 4 | Access Control | **Issues Found** | qToken transfers unguarded (C-02), no timelock on oracle (H-03), single owner |
| 5 | Input Validation | **Issues Found** | Missing decimal normalization (C-01), stale data (H-01), dust (L-02) |
| 6 | Randomness | **N/A** | No randomness used |
| 7 | Timestamp Dependence | **Low Risk** | Used for interest accrual, negligible manipulation impact (L-03) |
| 8 | Denial of Service | **Issues Found** | Unbounded loop (M-01), unliquidatable bad debt (H-04) |
| 9 | Front-running and MEV | **Noted** | Liquidation MEV, instant oracle change (H-03) |
| 10 | Flash Loan Attacks | **Issues Found** | No TWAP, no flash loan protection (M-02) |
| 11 | Cross-Chain | **N/A** | No cross-chain functionality |
| 12 | NFT Security | **N/A** | No NFTs used |
| 13 | Gas Optimization | **Issues Found** | Unbounded loops (M-01), no minimum amounts (L-02) |

---

## Recommendations Priority

1. **Immediate (before deployment):** Fix C-01, C-02, H-01, H-04
2. **High priority:** Address H-02, H-03, H-05, M-01
3. **Before mainnet:** Implement M-02 (oracle hardening), M-03 (parameter updates)
4. **Nice-to-have:** L-01 through L-05, M-04, M-05
