# Product Requirement Document (PRD)

## 1. Product Overview

**Project Name:** QuickLend
**Goal:** Create a decentralized, non-custodial liquidity protocol where users can participate as **Suppliers** (providing liquidity to earn interest) or **Borrowers** (taking over-collateralized loans).

### Core Philosophy

* **Pooled Liquidity:** No peer-to-peer matching; users interact with a smart contract pool.
* **Over-collateralization:** All loans must be backed by more value than the debt to ensure solvency.
* **Algorithmic Interest:** Rates are determined by the ratio of borrowed funds to supplied funds (utilization).

---

## 2. Functional Requirements

### 2.1 Supply & Withdraw

* **Supply:** Users deposit supported ERC-20 tokens into the protocol. In return, they receive "qTokens" (ERC-20 Tokens) representing their share of the pool plus accrued interest.
* **Withdraw:** Users burn qTokens to reclaim their underlying assets. Withdrawal is only permitted if the user’s remaining collateral is sufficient to cover their active borrows.

### 2.2 Borrow & Repay

* **Borrow:** Users can borrow an asset against their supplied collateral. The maximum amount is governed by the **Loan-to-Value (LTV)** ratio of the collateral.
* **Repay:** Users return the borrowed asset plus accrued interest to close their debt and "unlock" their collateral.

### 2.3 Cross-Supply/Borrow (Multi-Asset)

* The protocol must support multiple pools (e.g., ETH, USDC, WBTC).
* A user should be able to supply **Asset A** and borrow **Asset B**.
* The system calculates the total value of all collateral vs. total value of all debt in a single USD-denominated "Health Factor."

---

## 3. Core Mechanics & Mathematical Logic

### 3.1 Interest Rate Model

Interest rates should be a function of **Utilization ()**:
```
Utilization = Total_Borrowed / Total_Supplied
```

As  approaches 100%, the interest rate increases sharply to encourage repayments and new deposits.

* **Borrow Rate ():** .
```
Borrow_Rate = Base_Rate + (Utilization * Slope_Value)
```
* **Supply Rate ():** .
```
Supply_Rate = Borrow_Rate * Utilization * (1 - Reserve_Factor)
```

### 3.2 Health Factor ()

The  determines if a position is safe or eligible for liquidation.
```
Health_Factor = (Sum_of(Collateral_i * Liquidation_Threshold_i)) / Total_Debt_in_USD
```

* **Health Factor > 1.0:** The position is healthy.
* **Health Factor < 1.0:** The position is under-collateralized and can be liquidated.

### 3.3 Liquidation

If , a third-party "liquidator" can:

1. Repay a portion of the borrower's debt (e.g., up to 50%).
2. Receive an equivalent amount of the borrower's collateral plus a **Liquidation Bonus** (e.g., 5-10%) as an incentive.

---

## 4. Technical Architecture

### 4.1 Smart Contract Structure

* **Core/LendingPool:** The main entry point for user interactions (Supply, Borrow, Repay, Withdraw).
* **Price Oracle:** A contract (e.g., Chainlink) to provide real-time price feeds for LTV and  calculations.
* **InterestRateModel:** A standalone contract that calculates rates based on pool state.
* **qToken:** An ERC-20 compliant token representing the user's deposit share.

### 4.2 Sequence Diagram: The Borrow Flow

1. **User** calls `supply(asset, amount)` -> Pool transfers tokens and mints qTokens.
2. **User** calls `borrow(asset, amount)`.
3. **Pool** checks **Oracle** for asset prices.
4. **Pool** calculates **Health Factor**.
5. If , **Pool** transfers borrowed tokens to User.

---

## 5. Security Requirements

* **Price Manipulation Protection:** Use decentralized oracles (Chainlink) rather than spot prices from a single DEX to prevent "Flash Loan" price manipulation attacks.
* **Reentrancy Guard:** Apply `nonReentrant` modifiers to all functions involving asset transfers.
* **Emergency Pause:** A "Circuit Breaker" controlled by an admin/DAO to pause deposits and borrows in case of a detected exploit.

---

## 6. User Interface (UI) Features

* **Dashboard:** Show Total Market Size, Total Borrows, and Net APY.
* **Account View:** Display User Health Factor, Max Borrow Power, and "Liquidation Price" for their collateral.
* **Asset List:** A table showing Supply APY, Borrow APY, and LTV for each supported token.