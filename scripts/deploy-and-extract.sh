#!/bin/sh
set -e

# Install jq if not present
if ! command -v jq >/dev/null 2>&1; then
    echo "Installing jq..."
    if [ -f /etc/alpine-release ]; then
        apk add --no-cache jq
    elif [ -f /etc/debian_version ]; then
        apt-get update && apt-get install -y jq
    else
        echo "Error: jq not found and cannot install. Please install jq manually."
        exit 1
    fi
fi

RPC_URL="http://anvil:8545"
WALLET_JSON="/scripts/wallet-demo.json"

# Read Deployer PK (first wallet)
PK_0=$(jq -r '.wallets[0].privateKey' "$WALLET_JSON")

if [ "$PK_0" = "null" ]; then
    echo "Error: Could not read private key from $WALLET_JSON"
    exit 1
fi

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

extract_address() {
    local name="$1"
    # Use jq to extract address. Handle potential multiple deployments by taking the last one or first one?
    # Usually 'run-latest.json' has the latest run.
    jq -r --arg name "$name" '.transactions[] | select(.contractName == $name) | .contractAddress' "$BROADCAST_FILE" | head -1
}

LENDING_POOL=$(extract_address "LendingPool")
UI_DATA_PROVIDER=$(extract_address "UiPoolDataProvider")
PRICE_ORACLE=$(extract_address "MockPriceOracle")
# MockERC20 are deployed multiple times. We need to identify them.
# In the broadcast file, they might be listed in order.
# The original script used `sed -n '1p'`, `2p`, `3p`.
# We can do the same with jq results.
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
tx() {
    local pk="$1"; shift
    cast send --rpc-url "$RPC_URL" --private-key "$pk" "$@" > /dev/null 2>&1
}

get_token_addr() {
    case "$1" in
        "USDC") echo "$USDC" ;;
        "WETH") echo "$WETH" ;;
        "WBTC") echo "$WBTC" ;;
        *) echo "" ;;
    esac
}

echo "=== Processing Wallets from JSON ==="

COUNT=$(jq '.wallets | length' "$WALLET_JSON")
i=0
while [ "$i" -lt "$COUNT" ]; do
    NAME=$(jq -r ".wallets[$i].name" "$WALLET_JSON")
    PK=$(jq -r ".wallets[$i].privateKey" "$WALLET_JSON")
    ADDR=$(jq -r ".wallets[$i].address" "$WALLET_JSON")
    
    echo "Processing Wallet #$i: $NAME ($ADDR)"

    # Minting
    MINT_COUNT=$(jq ".wallets[$i].minting | length" "$WALLET_JSON")
    j=0
    while [ "$j" -lt "$MINT_COUNT" ]; do
        TOKEN=$(jq -r ".wallets[$i].minting[$j].token" "$WALLET_JSON")
        AMOUNT=$(jq -r ".wallets[$i].minting[$j].amount" "$WALLET_JSON")
        TOKEN_ADDR=$(get_token_addr "$TOKEN")
        
        if [ -n "$TOKEN_ADDR" ]; then
            echo "  Minting $AMOUNT $TOKEN..."
            tx "$PK_0" "$TOKEN_ADDR" "mint(address,uint256)" "$ADDR" "$AMOUNT"
        fi
        j=$((j + 1))
    done

    # Supplies
    SUPPLY_COUNT=$(jq ".wallets[$i].supplies | length" "$WALLET_JSON")
    j=0
    while [ "$j" -lt "$SUPPLY_COUNT" ]; do
        TOKEN=$(jq -r ".wallets[$i].supplies[$j].token" "$WALLET_JSON")
        AMOUNT=$(jq -r ".wallets[$i].supplies[$j].amount" "$WALLET_JSON")
        TOKEN_ADDR=$(get_token_addr "$TOKEN")
        
        if [ -n "$TOKEN_ADDR" ]; then
            echo "  Supplying $AMOUNT $TOKEN..."
            tx "$PK" "$TOKEN_ADDR" "approve(address,uint256)" "$LENDING_POOL" "$MAX_APPROVE"
            tx "$PK" "$LENDING_POOL" "supply(address,uint256)" "$TOKEN_ADDR" "$AMOUNT"
        fi
        j=$((j + 1))
    done

    # Borrows
    BORROW_COUNT=$(jq ".wallets[$i].borrows | length" "$WALLET_JSON")
    j=0
    while [ "$j" -lt "$BORROW_COUNT" ]; do
        TOKEN=$(jq -r ".wallets[$i].borrows[$j].token" "$WALLET_JSON")
        AMOUNT=$(jq -r ".wallets[$i].borrows[$j].amount" "$WALLET_JSON")
        TOKEN_ADDR=$(get_token_addr "$TOKEN")
        
        if [ -n "$TOKEN_ADDR" ]; then
            echo "  Borrowing $AMOUNT $TOKEN..."
            tx "$PK" "$LENDING_POOL" "borrow(address,uint256)" "$TOKEN_ADDR" "$AMOUNT"
        fi
        j=$((j + 1))
    done

    i=$((i + 1))
done

echo "=== Deploy and seeding complete ==="
