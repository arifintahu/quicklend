# QuickLend Smart Contracts

The core smart contracts for the QuickLend decentralized lending protocol. Built using [Foundry](https://book.getfoundry.sh/).

## Architecture

*   **`LendingPool.sol`**: The main entry point for user interactions (Supply, Borrow, Repay, Withdraw, Liquidate).
*   **`qToken.sol`**: Yield-bearing ERC20 tokens minted to suppliers (e.g., qUSDC).
*   **`InterestRateModel.sol`**: Calculates borrow and supply rates based on pool utilization.
*   **`UiPoolDataProvider.sol`**: Helper contract for the frontend to fetch aggregated market data.

## Contract Interaction Flow

### High-Level Architecture

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

### Supply & Borrow Flow

```mermaid
sequenceDiagram
    participant User
    participant LP as LendingPool
    participant Oracle as PriceOracle
    participant Token as ERC20
    participant qToken as qToken

    %% Supply Flow
    Note over User, qToken: Supply Flow
    User->>LP: supply(asset, 100)
    LP->>LP: _accrueInterest()
    LP->>Token: transferFrom(User, Pool, 100)
    LP->>qToken: mint(User, 100)
    LP-->>User: Emit Supply Event

    %% Borrow Flow
    Note over User, qToken: Borrow Flow
    User->>LP: borrow(asset, 50)
    LP->>LP: _accrueInterest()
    LP->>Oracle: getAssetPrice(Collateral)
    LP->>Oracle: getAssetPrice(BorrowAsset)
    LP->>LP: validateHealthFactor()
    alt Health Factor < 1.0
        LP-->>User: Revert: HealthFactorTooLow
    else Health Factor >= 1.0
        LP->>Token: transfer(User, 50)
        LP-->>User: Emit Borrow Event
    end
```

## Getting Started

### Prerequisites

*   **Foundry**: You must have Foundry installed.
    ```bash
    curl -L https://foundry.paradigm.xyz | bash
    foundryup
    ```

### Installation

1.  Clone the repository (if you haven't already):
    ```bash
    git clone https://github.com/your-username/quicklend.git
    cd quicklend/smart-contract
    ```

2.  **Install Dependencies**:
    This project uses git submodules for dependencies (OpenZeppelin, Solady, Forge Std). You must initialize them:
    ```bash
    git submodule update --init --recursive
    ```
    
    *Alternatively, if you are setting up from scratch or missing libraries:*
    ```bash
    forge install
    ```

## Usage

### Build

Compile the smart contracts:

```bash
forge build
```

### Test

Run the test suite (including new features like Collateral Toggling and UI Data Provider):

```bash
forge test
```

### Deploy

To deploy to a local testnet (Anvil):

1.  Start Anvil:
    ```bash
    anvil
    ```

2.  Deploy using the script:
    ```bash
    forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY> --broadcast
    ```

## Project Structure

*   `src/core`: Core logic (LendingPool, InterestRateModel).
*   `src/tokens`: Token implementations (qToken).
*   `src/interfaces`: Interface definitions.
*   `src/periphery`: Frontend helpers (UiPoolDataProvider).
*   `test`: Foundry tests.
