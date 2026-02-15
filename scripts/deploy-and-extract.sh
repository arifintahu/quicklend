#!/bin/sh
set -e

RPC_URL="http://anvil:8545"

# Anvil deterministic accounts (mnemonic: test test test test test test test test test test test junk)
PK_0="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PK_1="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
PK_2="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
PK_3="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

ACCT_0="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ACCT_1="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ACCT_2="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
ACCT_3="0x90F79bf6EB2c4f870365E785982E1f101E93b906"

MAX_APPROVE="115792089237316195423570985008687907853269984665640564039457584007913129639935"

echo "=== Deploying contracts to Anvil ==="

cd /app

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$RPC_URL" \
    --private-key "$PK_0" \
    --broadcast

echo "=== Extracting deployed addresses ==="

BROADCAST_FILE="broadcast/Deploy.s.sol/31337/run-latest.json"

if [ ! -f "$BROADCAST_FILE" ]; then
    echo "ERROR: Broadcast file not found at $BROADCAST_FILE"
    exit 1
fi

# Extract contract addresses from broadcast JSON using awk (no jq available)
# JSON has contractName before contractAddress, so we match name first then grab the next address
extract_address() {
    local name="$1"
    awk -v name="$name" '
        /"contractName"/ && index($0, "\"" name "\"") { found = 1 }
        found && /"contractAddress"/ {
            gsub(/.*"contractAddress"[[:space:]]*:[[:space:]]*"/, "")
            gsub(/".*/, "")
            print
            found = 0
        }
    ' "$BROADCAST_FILE"
}

LENDING_POOL=$(extract_address "LendingPool" | head -1)
UI_DATA_PROVIDER=$(extract_address "UiPoolDataProvider" | head -1)
PRICE_ORACLE=$(extract_address "MockPriceOracle" | head -1)
USDC=$(extract_address "MockERC20" | sed -n '1p')
WETH=$(extract_address "MockERC20" | sed -n '2p')
WBTC=$(extract_address "MockERC20" | sed -n '3p')

echo "LendingPool:       $LENDING_POOL"
echo "UiPoolDataProvider: $UI_DATA_PROVIDER"
echo "PriceOracle:        $PRICE_ORACLE"
echo "USDC:               $USDC"
echo "WETH:               $WETH"
echo "WBTC:               $WBTC"

# Write backend env
cat > /artifacts/backend.env <<EOF
LENDING_POOL_ADDRESS=$LENDING_POOL
UI_DATA_PROVIDER_ADDRESS=$UI_DATA_PROVIDER
PRICE_ORACLE_ADDRESS=$PRICE_ORACLE
USDC_ADDRESS=$USDC
WETH_ADDRESS=$WETH
WBTC_ADDRESS=$WBTC
EOF

# Write frontend env
cat > /artifacts/frontend.env <<EOF
NEXT_PUBLIC_LENDING_POOL_ADDRESS=$LENDING_POOL
NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=$UI_DATA_PROVIDER
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=$PRICE_ORACLE
NEXT_PUBLIC_USDC_ADDRESS=$USDC
NEXT_PUBLIC_WETH_ADDRESS=$WETH
NEXT_PUBLIC_WBTC_ADDRESS=$WBTC
EOF

# Helper: send a cast transaction
# Usage: tx <private_key> <to> <sig> <args...>
tx() {
    local pk="$1"; shift
    cast send --rpc-url "$RPC_URL" --private-key "$pk" "$@" > /dev/null 2>&1
}

# ============================================================
# PHASE 1: Seed liquidity providers (#1-#3)
# ============================================================
echo "=== Seeding liquidity providers ==="

# --- LP #1: Supplies 500,000 USDC ---
echo "  LP #1: Minting and supplying 500,000 USDC..."
tx "$PK_0" "$USDC" "mint(address,uint256)" "$ACCT_1" "500000000000"          # 500k USDC (6 dec)
tx "$PK_1" "$USDC" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"
tx "$PK_1" "$LENDING_POOL" "supply(address,uint256)" "$USDC" "500000000000"

# --- LP #2: Supplies 200 WETH ---
echo "  LP #2: Minting and supplying 200 WETH..."
tx "$PK_0" "$WETH" "mint(address,uint256)" "$ACCT_2" "200000000000000000000"  # 200 WETH (18 dec)
tx "$PK_2" "$WETH" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"
tx "$PK_2" "$LENDING_POOL" "supply(address,uint256)" "$WETH" "200000000000000000000"

# --- LP #3: Supplies 11 WBTC ---
echo "  LP #3: Minting and supplying 11 WBTC..."
tx "$PK_0" "$WBTC" "mint(address,uint256)" "$ACCT_3" "1100000000"            # 11 WBTC (8 dec)
tx "$PK_3" "$WBTC" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"
tx "$PK_3" "$LENDING_POOL" "supply(address,uint256)" "$WBTC" "1100000000"

# ============================================================
# PHASE 2: Seed test user (#0) with positions
# ============================================================
echo "=== Seeding test user positions ==="

# Mint tokens to test user wallet
echo "  Minting tokens to test user wallet..."
tx "$PK_0" "$USDC" "mint(address,uint256)" "$ACCT_0" "1000000000000"          # 1M USDC
tx "$PK_0" "$WETH" "mint(address,uint256)" "$ACCT_0" "100000000000000000000"  # 100 WETH
tx "$PK_0" "$WBTC" "mint(address,uint256)" "$ACCT_0" "1000000000"            # 10 WBTC

# Approve LendingPool for all tokens
tx "$PK_0" "$USDC" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"
tx "$PK_0" "$WETH" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"
tx "$PK_0" "$WBTC" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"

# Supply 10 WETH as collateral
echo "  Supplying 10 WETH..."
tx "$PK_0" "$LENDING_POOL" "supply(address,uint256)" "$WETH" "10000000000000000000"   # 10 WETH

# Supply 0.5 WBTC as collateral
echo "  Supplying 0.5 WBTC..."
tx "$PK_0" "$LENDING_POOL" "supply(address,uint256)" "$WBTC" "50000000"               # 0.5 WBTC

# Borrow 5,000 USDC against collateral
echo "  Borrowing 5,000 USDC..."
tx "$PK_0" "$LENDING_POOL" "borrow(address,uint256)" "$USDC" "5000000000"             # 5,000 USDC

echo "=== Deploy and seeding complete ==="
echo ""
echo "Test user (#0): $ACCT_0"
echo "  Supplied: 10 WETH, 0.5 WBTC"
echo "  Borrowed: 5,000 USDC"
echo "  Wallet:   ~1,005,000 USDC, 90 WETH, 9.5 WBTC"
