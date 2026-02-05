# Smart Contract Integration Guide

This document provides a comprehensive guide for integrating QuickLend smart contracts with the frontend and backend systems.

## Table of Contents

1. [Overview](#overview)
2. [Contract Addresses](#contract-addresses)
3. [Frontend Integration](#frontend-integration)
4. [Backend Integration](#backend-integration)
5. [ABI & TypeScript Types](#abi--typescript-types)
6. [Error Handling](#error-handling)
7. [Testing & Verification](#testing--verification)

---

## Overview

QuickLend's smart contract architecture consists of:

| Contract | Purpose |
|----------|---------|
| **LendingPool** | Main entry point for all user interactions (supply, borrow, withdraw, repay, liquidate) |
| **qToken** | Yield-bearing ERC20 tokens representing user deposits |
| **InterestRateModel** | Calculates borrow/supply rates based on utilization |
| **UiPoolDataProvider** | Read-only helper for batched data fetching |
| **PriceOracle** | Provides asset price feeds (Chainlink in production) |

```mermaid
graph TD
    subgraph Frontend
        UI[React Components]
        Wagmi[Wagmi Hooks]
        Viem[Viem Client]
    end
    
    subgraph Smart Contracts
        LP[LendingPool]
        UDP[UiPoolDataProvider]
        qT[qToken]
    end
    
    UI --> Wagmi
    Wagmi --> Viem
    Viem --> LP
    Viem --> UDP
    LP --> qT
```

---

## Contract Addresses

### Local Development (Anvil)

After running the deployment script, addresses are logged to console. Store them in `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...

# Token Addresses (Mocks)
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_WETH_ADDRESS=0x...
NEXT_PUBLIC_WBTC_ADDRESS=0x...
```

### Testnet (Sepolia)

```bash
# TODO: Add after testnet deployment
NEXT_PUBLIC_LENDING_POOL_ADDRESS=
NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=
```

### Mainnet

```bash
# TODO: Add after mainnet deployment
NEXT_PUBLIC_LENDING_POOL_ADDRESS=
NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS=
```

---

## Frontend Integration

### Prerequisites

The frontend uses the following Web3 stack (as defined in TECH_STACK.md):

- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript client for Ethereum
- **RainbowKit** - Wallet connection UI
- **TanStack Query** - Data fetching and caching

### Step 1: Generate Contract ABIs

After compiling contracts, extract ABIs for frontend use:

```bash
# From smart-contract directory
forge build

# ABIs are in out/<ContractName>.sol/<ContractName>.json
# Copy to frontend
mkdir -p ../frontend/src/lib/abi
cp out/LendingPool.sol/LendingPool.json ../frontend/src/lib/abi/
cp out/UiPoolDataProvider.sol/UiPoolDataProvider.json ../frontend/src/lib/abi/
cp out/ILendingPool.sol/ILendingPool.json ../frontend/src/lib/abi/
```

### Step 2: Create Contract Configuration

Create `frontend/src/lib/contracts.ts`:

```typescript
import { getAddress } from 'viem';
import LendingPoolABI from './abi/LendingPool.json';
import UiDataProviderABI from './abi/UiPoolDataProvider.json';

export const contracts = {
  lendingPool: {
    address: getAddress(process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!),
    abi: LendingPoolABI.abi,
  },
  uiDataProvider: {
    address: getAddress(process.env.NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS!),
    abi: UiDataProviderABI.abi,
  },
} as const;
```

### Step 3: Create Wagmi Config

Create `frontend/src/lib/wagmi.ts`:

```typescript
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, anvil } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'QuickLend',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  }
);

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, anvil],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [anvil.id]: http('http://127.0.0.1:8545'),
  },
});
```

### Step 4: Implement Read Hooks

#### `useMarketData` - Fetch All Markets

```typescript
// frontend/src/hooks/useMarketData.ts
import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/contracts';

export interface MarketData {
  asset: `0x${string}`;
  symbol: string;
  decimals: number;
  ltv: bigint;
  liqThreshold: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
  totalSupplied: bigint;
  totalBorrowed: bigint;
  availableLiquidity: bigint;
  priceUsd: bigint;
}

export function useMarketData() {
  return useReadContract({
    ...contracts.uiDataProvider,
    functionName: 'getMarketData',
    args: [contracts.lendingPool.address],
    query: {
      refetchInterval: 15_000, // Refetch every 15 seconds
    },
  });
}
```

#### `useUserPositions` - Fetch User Data

```typescript
// frontend/src/hooks/useUserPositions.ts
import { useAccount, useReadContract } from 'wagmi';
import { contracts } from '@/lib/contracts';

export interface UserPosition {
  asset: `0x${string}`;
  symbol: string;
  suppliedBalance: bigint;
  borrowedBalance: bigint;
  isCollateral: boolean;
}

export function useUserPositions() {
  const { address } = useAccount();

  return useReadContract({
    ...contracts.uiDataProvider,
    functionName: 'getUserData',
    args: [contracts.lendingPool.address, address!],
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });
}
```

#### `useHealthFactor` - Get User Health Factor

```typescript
// frontend/src/hooks/useHealthFactor.ts
import { useAccount, useReadContract } from 'wagmi';
import { contracts } from '@/lib/contracts';
import { formatUnits } from 'viem';

export function useHealthFactor() {
  const { address } = useAccount();

  const { data, ...rest } = useReadContract({
    ...contracts.lendingPool,
    functionName: 'getUserHealthFactor',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 5_000, // More frequent for critical data
    },
  });

  return {
    ...rest,
    data,
    formatted: data ? formatUnits(data, 18) : undefined,
  };
}
```

### Step 5: Implement Write Hooks

#### `useLendingActions` - All User Actions

```typescript
// frontend/src/hooks/useLendingActions.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts } from '@/lib/contracts';
import { parseUnits } from 'viem';

export function useLendingActions() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const supply = async (asset: `0x${string}`, amount: string, decimals: number) => {
    writeContract({
      ...contracts.lendingPool,
      functionName: 'supply',
      args: [asset, parseUnits(amount, decimals)],
    });
  };

  const withdraw = async (asset: `0x${string}`, amount: string, decimals: number) => {
    writeContract({
      ...contracts.lendingPool,
      functionName: 'withdraw',
      args: [asset, parseUnits(amount, decimals)],
    });
  };

  const borrow = async (asset: `0x${string}`, amount: string, decimals: number) => {
    writeContract({
      ...contracts.lendingPool,
      functionName: 'borrow',
      args: [asset, parseUnits(amount, decimals)],
    });
  };

  const repay = async (asset: `0x${string}`, amount: string, decimals: number) => {
    writeContract({
      ...contracts.lendingPool,
      functionName: 'repay',
      args: [asset, parseUnits(amount, decimals)],
    });
  };

  const setCollateral = async (asset: `0x${string}`, useAsCollateral: boolean) => {
    writeContract({
      ...contracts.lendingPool,
      functionName: 'setUserUseReserveAsCollateral',
      args: [asset, useAsCollateral],
    });
  };

  const liquidate = async (
    collateralAsset: `0x${string}`,
    borrowAsset: `0x${string}`,
    user: `0x${string}`,
    debtToCover: string,
    decimals: number
  ) => {
    writeContract({
      ...contracts.lendingPool,
      functionName: 'liquidate',
      args: [collateralAsset, borrowAsset, user, parseUnits(debtToCover, decimals)],
    });
  };

  return {
    supply,
    withdraw,
    borrow,
    repay,
    setCollateral,
    liquidate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

### Step 6: Token Approval Hook

Users must approve the LendingPool to spend their tokens before supplying or repaying:

```typescript
// frontend/src/hooks/useTokenApproval.ts
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { erc20Abi, maxUint256 } from 'viem';
import { contracts } from '@/lib/contracts';

export function useTokenApproval(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  // Check current allowance
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, contracts.lendingPool.address],
    query: { enabled: !!address },
  });

  const approve = async (amount?: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [contracts.lendingPool.address, amount ?? maxUint256],
    });
  };

  return {
    allowance,
    approve,
    isPending,
    refetch,
    needsApproval: (amount: bigint) => !allowance || allowance < amount,
  };
}
```

### Step 7: Example Component Usage

```tsx
// frontend/src/components/SupplyForm.tsx
'use client';

import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { useLendingActions } from '@/hooks/useLendingActions';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { parseUnits } from 'viem';

export function SupplyForm({ asset }: { asset: `0x${string}` }) {
  const [amount, setAmount] = useState('');
  const { data: markets } = useMarketData();
  const { supply, isPending, isConfirming, isSuccess } = useLendingActions();
  const { allowance, approve, needsApproval } = useTokenApproval(asset);

  const market = markets?.find((m) => m.asset === asset);
  const parsedAmount = amount ? parseUnits(amount, market?.decimals ?? 18) : 0n;

  const handleSubmit = async () => {
    if (needsApproval(parsedAmount)) {
      await approve(parsedAmount);
      return;
    }
    await supply(asset, amount, market?.decimals ?? 18);
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to supply"
      />
      <button onClick={handleSubmit} disabled={isPending || isConfirming}>
        {needsApproval(parsedAmount) ? 'Approve' : 'Supply'}
      </button>
      {isSuccess && <p>Transaction successful!</p>}
    </div>
  );
}
```

---

## Backend Integration

The QuickLend backend is a **custom indexer** built with Node.js/TypeScript that provides event indexing, liquidation automation, user notifications, analytics, and API caching for the frontend.

### Architecture Overview

```mermaid
graph TD
    subgraph Blockchain
        SC[Smart Contracts]
        RPC[RPC Provider]
    end

    subgraph Backend Services
        IDX[Event Indexer]
        LIQ[Liquidation Bot]
        NOTIF[Notification Service]
        CACHE[Cache Layer]
        API[REST API]
    end

    subgraph Data Layer
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    subgraph External
        TG[Telegram Bot]
        EMAIL[Email Service]
        FE[Frontend]
    end

    SC --> RPC
    RPC --> IDX
    IDX --> PG
    LIQ --> RPC
    LIQ --> PG
    NOTIF --> TG
    NOTIF --> EMAIL
    API --> PG
    API --> REDIS
    API --> CACHE
    FE --> API
```

---

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js 20+ | Server runtime |
| **Language** | TypeScript 5+ | Type-safe development |
| **Framework** | Fastify | High-performance HTTP server |
| **Database** | PostgreSQL 15+ | Persistent event storage |
| **Cache** | Redis 7+ | API response caching, rate limiting |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Web3** | Viem | Ethereum client |
| **Queue** | BullMQ | Background job processing |
| **Scheduler** | node-cron | Periodic tasks |
| **Notifications** | Telegram Bot API, Nodemailer | User alerts |
| **Validation** | Zod | Schema validation |

---

### Feature Specifications

#### Feature 1: Event Indexer

**Purpose**: Index all LendingPool events for fast historical queries.

**Events to Index**:
| Event | Fields | Use Case |
|-------|--------|----------|
| `MarketInitialized` | asset, qToken | Track supported markets |
| `Supply` | asset, user, amount | Supply history, TVL |
| `Withdraw` | asset, user, amount | Withdrawal history |
| `Borrow` | asset, user, amount | Borrow history, utilization |
| `Repay` | asset, user, amount | Repayment history |
| `Liquidate` | asset, user, amount, liquidator | Liquidation history |
| `ReserveUsedAsCollateralEnabled` | asset, user | Collateral tracking |
| `ReserveUsedAsCollateralDisabled` | asset, user | Collateral tracking |

**Implementation**:

```typescript
// backend/src/indexer/EventIndexer.ts
import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { mainnet } from 'viem/chains';
import { db } from '../db';
import { events, userPositions } from '../db/schema';

export class EventIndexer {
  private client;
  private lastProcessedBlock: bigint = 0n;
  
  constructor(
    private rpcUrl: string,
    private lendingPoolAddress: `0x${string}`
  ) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });
  }

  async start() {
    // 1. Load last processed block from DB
    this.lastProcessedBlock = await this.getLastProcessedBlock();

    // 2. Backfill missed events
    await this.backfill();

    // 3. Start real-time watching
    await this.watchEvents();
  }

  private async backfill() {
    const currentBlock = await this.client.getBlockNumber();
    const BATCH_SIZE = 1000n;

    for (let from = this.lastProcessedBlock; from < currentBlock; from += BATCH_SIZE) {
      const to = from + BATCH_SIZE > currentBlock ? currentBlock : from + BATCH_SIZE;
      
      const logs = await this.client.getLogs({
        address: this.lendingPoolAddress,
        fromBlock: from,
        toBlock: to,
      });

      await this.processLogs(logs);
      await this.updateLastProcessedBlock(to);
    }
  }

  private async watchEvents() {
    this.client.watchContractEvent({
      address: this.lendingPoolAddress,
      abi: LendingPoolABI,
      onLogs: async (logs) => {
        await this.processLogs(logs);
      },
    });
  }

  private async processLogs(logs: Log[]) {
    for (const log of logs) {
      const eventName = log.topics[0]; // Event signature
      
      await db.insert(events).values({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        eventName: this.decodeEventName(eventName),
        asset: log.topics[1],
        user: log.topics[2],
        amount: log.data,
        timestamp: new Date(),
      });

      // Update materialized user positions
      await this.updateUserPosition(log);
    }
  }
}
```

---

#### Feature 2: Liquidation Bot

**Purpose**: Automatically liquidate unhealthy positions for profit.

**Logic Flow**:
1. Query all users with active borrows from database
2. Check health factor on-chain for each user
3. If HF < 1.0, calculate optimal liquidation amount
4. Simulate transaction to ensure profitability
5. Execute liquidation if profitable
6. Log results and notify operators

**Configuration**:
| Parameter | Default | Description |
|-----------|---------|-------------|
| `POLLING_INTERVAL_MS` | 15000 | How often to check positions |
| `MIN_PROFIT_USD` | 10 | Minimum profit to execute liquidation |
| `GAS_PRICE_BUFFER` | 1.2 | Multiply estimated gas by this factor |
| `MAX_CONCURRENT_LIQUIDATIONS` | 3 | Parallel liquidation limit |

**Implementation**:

```typescript
// backend/src/bots/LiquidationBot.ts
import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { db } from '../db';
import { userPositions } from '../db/schema';
import { eq, gt } from 'drizzle-orm';

export class LiquidationBot {
  private publicClient;
  private walletClient;
  private isRunning = false;

  constructor(
    private config: {
      rpcUrl: string;
      privateKey: `0x${string}`;
      lendingPoolAddress: `0x${string}`;
      minProfitUsd: number;
      pollingIntervalMs: number;
    }
  ) {
    const account = privateKeyToAccount(config.privateKey);
    
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(config.rpcUrl),
    });

    this.walletClient = createWalletClient({
      account,
      chain: mainnet,
      transport: http(config.rpcUrl),
    });
  }

  async start() {
    this.isRunning = true;
    console.log('🤖 Liquidation bot started');

    while (this.isRunning) {
      try {
        await this.checkPositions();
      } catch (error) {
        console.error('Liquidation check failed:', error);
      }
      
      await this.sleep(this.config.pollingIntervalMs);
    }
  }

  private async checkPositions() {
    // Get users with borrows from indexed data
    const usersWithBorrows = await db
      .select()
      .from(userPositions)
      .where(gt(userPositions.borrowedAmount, 0n));

    for (const position of usersWithBorrows) {
      const healthFactor = await this.publicClient.readContract({
        address: this.config.lendingPoolAddress,
        abi: LendingPoolABI,
        functionName: 'getUserHealthFactor',
        args: [position.userAddress as `0x${string}`],
      });

      // HF < 1.0 means liquidatable
      if (healthFactor < 1_000_000_000_000_000_000n) {
        await this.attemptLiquidation(position, healthFactor);
      }
    }
  }

  private async attemptLiquidation(position: UserPosition, healthFactor: bigint) {
    // Calculate max repayable (50% close factor)
    const maxRepayable = (position.borrowedAmount * 50n) / 100n;

    // Simulate to check profitability
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.config.lendingPoolAddress,
        abi: LendingPoolABI,
        functionName: 'liquidate',
        args: [
          position.collateralAsset,
          position.borrowAsset,
          position.userAddress,
          maxRepayable,
        ],
        account: this.walletClient.account,
      });

      // Execute if simulation succeeds
      const txHash = await this.walletClient.writeContract(request);
      
      console.log(`✅ Liquidated ${position.userAddress}: ${txHash}`);
      
      // Log to database
      await this.logLiquidation(position, txHash);
    } catch (error) {
      console.log(`❌ Liquidation failed for ${position.userAddress}:`, error);
    }
  }
}
```

---

#### Feature 3: Notification Service

**Purpose**: Alert users about critical account events.

**Notification Triggers**:
| Trigger | Threshold | Channels |
|---------|-----------|----------|
| Health Factor Warning | HF < 1.5 | Telegram, Email |
| Health Factor Critical | HF < 1.2 | Telegram, Email, Push |
| Liquidation Occurred | HF < 1.0 | Telegram, Email |
| Large Position Change | > $10,000 | Email |
| Interest Rate Spike | > 20% change | Telegram |

**Implementation**:

```typescript
// backend/src/services/NotificationService.ts
import { Telegraf } from 'telegraf';
import nodemailer from 'nodemailer';

interface UserNotificationPrefs {
  userId: string;
  telegramChatId?: string;
  email?: string;
  healthFactorWarning: boolean;
  liquidationAlerts: boolean;
}

export class NotificationService {
  private telegramBot: Telegraf;
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    this.telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendHealthFactorWarning(
    userAddress: string,
    healthFactor: number,
    prefs: UserNotificationPrefs
  ) {
    const message = `⚠️ **Health Factor Warning**
    
Your QuickLend position health factor is ${healthFactor.toFixed(2)}.

${healthFactor < 1.2 ? '🚨 **CRITICAL**: Liquidation imminent!' : 'Consider adding collateral or repaying debt.'}

View your position: ${process.env.FRONTEND_URL}/dashboard`;

    if (prefs.telegramChatId) {
      await this.telegramBot.telegram.sendMessage(prefs.telegramChatId, message, {
        parse_mode: 'Markdown',
      });
    }

    if (prefs.email) {
      await this.emailTransporter.sendMail({
        from: 'alerts@quicklend.xyz',
        to: prefs.email,
        subject: `⚠️ QuickLend Health Factor Warning: ${healthFactor.toFixed(2)}`,
        html: this.formatEmailHtml(message),
      });
    }
  }

  async sendLiquidationAlert(
    userAddress: string,
    liquidatedAmount: bigint,
    collateralSeized: bigint,
    prefs: UserNotificationPrefs
  ) {
    const message = `🔴 **Liquidation Alert**
    
Your position was partially liquidated.

- Debt Repaid: $${formatUnits(liquidatedAmount, 18)}
- Collateral Seized: $${formatUnits(collateralSeized, 18)}

View details: ${process.env.FRONTEND_URL}/dashboard`;

    // Send via all channels
    if (prefs.telegramChatId) {
      await this.telegramBot.telegram.sendMessage(prefs.telegramChatId, message);
    }
    if (prefs.email) {
      await this.emailTransporter.sendMail({
        from: 'alerts@quicklend.xyz',
        to: prefs.email,
        subject: '🔴 QuickLend Position Liquidated',
        html: this.formatEmailHtml(message),
      });
    }
  }
}
```

---

#### Feature 4: Analytics Service

**Purpose**: Calculate protocol-wide and user-specific metrics.

**Metrics**:
| Metric | Update Frequency | Calculation |
|--------|------------------|-------------|
| Total Value Locked (TVL) | Real-time | Sum of all supplied assets in USD |
| Protocol Revenue | Hourly | Reserve factor * interest collected |
| Utilization Rate | Real-time | Total borrowed / Total supplied |
| APY (Supply/Borrow) | Per block | From InterestRateModel |
| User PnL | On demand | Earnings - interest paid |
| Liquidation Volume | Daily | Sum of liquidation events |

**Implementation**:

```typescript
// backend/src/services/AnalyticsService.ts
import { db } from '../db';
import { events, marketSnapshots } from '../db/schema';
import { desc, sql } from 'drizzle-orm';

export class AnalyticsService {
  
  async getTVL(): Promise<{ total: number; byAsset: Record<string, number> }> {
    const markets = await this.publicClient.readContract({
      address: UI_DATA_PROVIDER_ADDRESS,
      abi: UiPoolDataProviderABI,
      functionName: 'getMarketData',
      args: [LENDING_POOL_ADDRESS],
    });

    const byAsset: Record<string, number> = {};
    let total = 0;

    for (const market of markets) {
      const tvl = Number(formatUnits(market.totalSupplied, market.decimals)) * 
                  Number(formatUnits(market.priceUsd, 18));
      byAsset[market.symbol] = tvl;
      total += tvl;
    }

    return { total, byAsset };
  }

  async getHistoricalTVL(days: number): Promise<{ date: string; tvl: number }[]> {
    const snapshots = await db
      .select()
      .from(marketSnapshots)
      .where(sql`timestamp > NOW() - INTERVAL '${days} days'`)
      .orderBy(desc(marketSnapshots.timestamp));

    return snapshots.map(s => ({
      date: s.timestamp.toISOString(),
      tvl: Number(s.totalTvlUsd),
    }));
  }

  async getUserStats(userAddress: string) {
    // Aggregate from indexed events
    const supplies = await db.query.events.findMany({
      where: and(
        eq(events.user, userAddress),
        eq(events.eventName, 'Supply')
      ),
    });

    const borrows = await db.query.events.findMany({
      where: and(
        eq(events.user, userAddress),
        eq(events.eventName, 'Borrow')
      ),
    });

    return {
      totalSupplied: supplies.reduce((acc, e) => acc + BigInt(e.amount), 0n),
      totalBorrowed: borrows.reduce((acc, e) => acc + BigInt(e.amount), 0n),
      transactionCount: supplies.length + borrows.length,
      firstInteraction: supplies[0]?.timestamp || borrows[0]?.timestamp,
    };
  }
}
```

---

#### Feature 5: API Caching Layer

**Purpose**: Reduce RPC calls and improve frontend performance.

**Cache Strategy**:
| Endpoint | TTL | Invalidation |
|----------|-----|--------------|
| `/markets` | 15s | On any Supply/Withdraw event |
| `/user/:address/positions` | 10s | On user's events |
| `/analytics/tvl` | 60s | Periodic refresh |
| `/analytics/history` | 5m | Periodic refresh |

**Implementation**:

```typescript
// backend/src/middleware/cache.ts
import Redis from 'ioredis';
import { FastifyRequest, FastifyReply } from 'fastify';

const redis = new Redis(process.env.REDIS_URL);

export function cacheMiddleware(ttlSeconds: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const cacheKey = `cache:${request.url}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      reply.header('X-Cache', 'HIT');
      return reply.send(JSON.parse(cached));
    }

    // Store original send
    const originalSend = reply.send.bind(reply);
    
    reply.send = (payload: unknown) => {
      // Cache the response
      redis.setex(cacheKey, ttlSeconds, JSON.stringify(payload));
      reply.header('X-Cache', 'MISS');
      return originalSend(payload);
    };
  };
}

// Invalidation helper
export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(`cache:${pattern}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

### Database Schema

```sql
-- PostgreSQL Schema

-- Indexed events from blockchain
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INT NOT NULL,
  event_name VARCHAR(50) NOT NULL,
  asset VARCHAR(42) NOT NULL,
  user_address VARCHAR(42),
  amount NUMERIC(78, 0),
  extra_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX idx_events_user ON events(user_address);
CREATE INDEX idx_events_asset ON events(asset);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_name ON events(event_name);

-- Materialized user positions (updated by indexer)
CREATE TABLE user_positions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  asset VARCHAR(42) NOT NULL,
  supplied_amount NUMERIC(78, 0) DEFAULT 0,
  borrowed_amount NUMERIC(78, 0) DEFAULT 0,
  is_collateral BOOLEAN DEFAULT TRUE,
  health_factor NUMERIC(20, 18),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_address, asset)
);

CREATE INDEX idx_positions_user ON user_positions(user_address);
CREATE INDEX idx_positions_health ON user_positions(health_factor);

-- Market snapshots for analytics
CREATE TABLE market_snapshots (
  id SERIAL PRIMARY KEY,
  asset VARCHAR(42) NOT NULL,
  total_supplied NUMERIC(78, 0),
  total_borrowed NUMERIC(78, 0),
  supply_rate NUMERIC(78, 0),
  borrow_rate NUMERIC(78, 0),
  price_usd NUMERIC(78, 0),
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_snapshots_asset_time ON market_snapshots(asset, timestamp);

-- User notification preferences
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) UNIQUE NOT NULL,
  telegram_chat_id VARCHAR(50),
  email VARCHAR(255),
  health_warning_enabled BOOLEAN DEFAULT TRUE,
  health_warning_threshold NUMERIC(5, 2) DEFAULT 1.5,
  liquidation_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexer state
CREATE TABLE indexer_state (
  id SERIAL PRIMARY KEY,
  chain_id INT NOT NULL,
  last_processed_block BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liquidation logs
CREATE TABLE liquidation_logs (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  liquidator_address VARCHAR(42) NOT NULL,
  collateral_asset VARCHAR(42) NOT NULL,
  borrow_asset VARCHAR(42) NOT NULL,
  debt_covered NUMERIC(78, 0),
  collateral_seized NUMERIC(78, 0),
  profit_usd NUMERIC(20, 2),
  tx_hash VARCHAR(66),
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### API Endpoints

#### Markets

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/api/v1/markets` | List all markets with current rates | 15s |
| GET | `/api/v1/markets/:asset` | Single market details | 15s |
| GET | `/api/v1/markets/:asset/history` | Historical rates & utilization | 5m |

#### User Data

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/users/:address/positions` | User's positions across all markets | No |
| GET | `/api/v1/users/:address/history` | Transaction history | No |
| GET | `/api/v1/users/:address/health` | Current health factor | No |
| GET | `/api/v1/users/:address/stats` | Aggregated user statistics | No |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/tvl` | Current TVL by asset |
| GET | `/api/v1/analytics/tvl/history` | Historical TVL |
| GET | `/api/v1/analytics/volume` | Supply/borrow volume |
| GET | `/api/v1/analytics/liquidations` | Recent liquidations |

#### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/notifications/subscribe` | Register for alerts | Signature |
| PUT | `/api/v1/notifications/preferences` | Update preferences | Signature |
| DELETE | `/api/v1/notifications/unsubscribe` | Unsubscribe | Signature |

**Example Response - GET `/api/v1/markets`**:

```json
{
  "success": true,
  "data": [
    {
      "asset": "0x...",
      "symbol": "USDC",
      "decimals": 6,
      "totalSupplied": "1000000000000",
      "totalBorrowed": "750000000000",
      "utilization": "0.75",
      "supplyAPY": "0.045",
      "borrowAPY": "0.085",
      "ltv": "0.80",
      "liqThreshold": "0.85",
      "priceUsd": "1.00"
    }
  ],
  "timestamp": "2026-02-05T06:45:00Z"
}
```

---

### Fastify API Server

The backend uses **Fastify** as the HTTP framework for its exceptional performance (up to 30k requests/sec), built-in TypeScript support, and plugin ecosystem.

#### Server Setup

```typescript
// backend/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { marketsRoutes } from './api/routes/markets';
import { usersRoutes } from './api/routes/users';
import { analyticsRoutes } from './api/routes/analytics';
import { notificationsRoutes } from './api/routes/notifications';
import { errorHandler } from './api/middleware/errorHandler';
import { config } from './config';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: config.NODE_ENV === 'development' 
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await fastify.register(cors, {
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API-only server
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    }),
  });

  // OpenAPI documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'QuickLend API',
        description: 'API for QuickLend DeFi lending protocol',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Development' },
        { url: 'https://api.quicklend.xyz', description: 'Production' },
      ],
      tags: [
        { name: 'Markets', description: 'Lending market data' },
        { name: 'Users', description: 'User positions and history' },
        { name: 'Analytics', description: 'Protocol metrics' },
        { name: 'Notifications', description: 'Alert subscriptions' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Health check
  fastify.get('/health', async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Register routes
  await fastify.register(marketsRoutes, { prefix: '/api/v1/markets' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
  await fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  await fastify.register(notificationsRoutes, { prefix: '/api/v1/notifications' });

  // Global error handler
  fastify.setErrorHandler(errorHandler);

  return fastify;
}

// Start server
buildServer().then((server) => {
  server.listen({ port: config.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    server.log.info(`🚀 Server running at ${address}`);
    server.log.info(`📚 API docs at ${address}/docs`);
  });
});
```

---

#### Plugin Configuration

**CORS Configuration**:

```typescript
// backend/src/plugins/cors.ts
import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://quicklend.xyz',
        'https://app.quicklend.xyz',
        /\.quicklend\.xyz$/,  // Subdomains
      ];

      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) =>
        typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address', 'X-Signature'],
    exposedHeaders: ['X-Request-Id', 'X-Cache'],
    maxAge: 86400, // 24 hours
  });
};
```

**Rate Limiting with Redis**:

```typescript
// backend/src/plugins/rateLimit.ts
import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    
    // Use Redis for distributed rate limiting
    redis,
    
    // Custom key generator (by wallet address if authenticated)
    keyGenerator: (request) => {
      const walletAddress = request.headers['x-wallet-address'];
      return walletAddress ? `wallet:${walletAddress}` : `ip:${request.ip}`;
    },

    // Different limits for different routes
    allowList: [],
    
    // Skip rate limiting for health checks
    skipOnError: true,
    skip: (request) => request.url === '/health',

    // Custom error response
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: context.after,
      limit: context.max,
      remaining: 0,
    }),

    // Add rate limit headers
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // Route-specific rate limits
  fastify.addHook('onRoute', (routeOptions) => {
    // Higher limit for read-only endpoints
    if (routeOptions.method === 'GET') {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: { max: 200, timeWindow: '1 minute' },
      };
    }
    
    // Lower limit for write endpoints
    if (['POST', 'PUT', 'DELETE'].includes(routeOptions.method as string)) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: { max: 30, timeWindow: '1 minute' },
      };
    }
  });
};
```

**Security Headers (Helmet)**:

```typescript
// backend/src/plugins/security.ts
import { FastifyPluginAsync } from 'fastify';
import helmet from '@fastify/helmet';

export const securityPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(helmet, {
    // Disable CSP for API-only server
    contentSecurityPolicy: false,
    
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    
    // Prevent MIME type sniffing
    noSniff: true,
    
    // XSS protection
    xssFilter: true,
    
    // Hide powered-by header
    hidePoweredBy: true,
    
    // HSTS for production
    hsts: process.env.NODE_ENV === 'production' 
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  });
};
```

---

#### Route Implementation

**Markets Routes**:

```typescript
// backend/src/api/routes/markets.ts
import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import { MarketsService } from '../../services/MarketsService';

// Schema definitions
const MarketSchema = Type.Object({
  asset: Type.String(),
  symbol: Type.String(),
  decimals: Type.Number(),
  totalSupplied: Type.String(),
  totalBorrowed: Type.String(),
  utilization: Type.String(),
  supplyAPY: Type.String(),
  borrowAPY: Type.String(),
  ltv: Type.String(),
  liqThreshold: Type.String(),
  priceUsd: Type.String(),
});

const MarketsResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Array(MarketSchema),
  timestamp: Type.String(),
});

const AssetParamsSchema = Type.Object({
  asset: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
});

export const marketsRoutes: FastifyPluginAsync = async (fastify) => {
  const marketsService = new MarketsService();

  // GET /api/v1/markets - List all markets
  fastify.get('/', {
    schema: {
      tags: ['Markets'],
      summary: 'Get all lending markets',
      description: 'Returns current data for all listed lending markets including rates and utilization.',
      response: {
        200: MarketsResponseSchema,
      },
    },
    preHandler: cacheMiddleware(15), // 15 second cache
  }, async (request, reply) => {
    const markets = await marketsService.getAllMarkets();
    
    return {
      success: true,
      data: markets,
      timestamp: new Date().toISOString(),
    };
  });

  // GET /api/v1/markets/:asset - Single market
  fastify.get<{ Params: Static<typeof AssetParamsSchema> }>('/:asset', {
    schema: {
      tags: ['Markets'],
      summary: 'Get single market data',
      params: AssetParamsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: MarketSchema,
        }),
        404: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
        }),
      },
    },
    preHandler: cacheMiddleware(15),
  }, async (request, reply) => {
    const { asset } = request.params;
    const market = await marketsService.getMarket(asset);
    
    if (!market) {
      reply.code(404);
      return { success: false, error: 'Market not found' };
    }
    
    return { success: true, data: market };
  });

  // GET /api/v1/markets/:asset/history - Historical data
  fastify.get<{ 
    Params: Static<typeof AssetParamsSchema>;
    Querystring: { days?: number };
  }>('/:asset/history', {
    schema: {
      tags: ['Markets'],
      summary: 'Get historical market data',
      params: AssetParamsSchema,
      querystring: Type.Object({
        days: Type.Optional(Type.Number({ minimum: 1, maximum: 365, default: 30 })),
      }),
    },
    preHandler: cacheMiddleware(300), // 5 minute cache
  }, async (request, reply) => {
    const { asset } = request.params;
    const { days = 30 } = request.query;
    
    const history = await marketsService.getMarketHistory(asset, days);
    
    return { success: true, data: history };
  });
};
```

**Users Routes with Signature Verification**:

```typescript
// backend/src/api/routes/users.ts
import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { verifySignature } from '../middleware/auth';
import { UsersService } from '../../services/UsersService';

const AddressParamsSchema = Type.Object({
  address: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
});

const UserPositionSchema = Type.Object({
  asset: Type.String(),
  symbol: Type.String(),
  suppliedBalance: Type.String(),
  borrowedBalance: Type.String(),
  isCollateral: Type.Boolean(),
  healthFactor: Type.String(),
});

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const usersService = new UsersService();

  // GET /api/v1/users/:address/positions
  fastify.get<{ Params: Static<typeof AddressParamsSchema> }>('/:address/positions', {
    schema: {
      tags: ['Users'],
      summary: 'Get user positions',
      params: AddressParamsSchema,
    },
  }, async (request) => {
    const { address } = request.params;
    const positions = await usersService.getUserPositions(address);
    
    return { success: true, data: positions };
  });

  // GET /api/v1/users/:address/health
  fastify.get<{ Params: Static<typeof AddressParamsSchema> }>('/:address/health', {
    schema: {
      tags: ['Users'],
      summary: 'Get user health factor',
      params: AddressParamsSchema,
    },
  }, async (request) => {
    const { address } = request.params;
    const healthFactor = await usersService.getHealthFactor(address);
    
    return {
      success: true,
      data: {
        healthFactor,
        status: healthFactor >= 1.5 ? 'safe' : healthFactor >= 1.2 ? 'warning' : 'danger',
      },
    };
  });

  // GET /api/v1/users/:address/history
  fastify.get<{ 
    Params: Static<typeof AddressParamsSchema>;
    Querystring: { page?: number; limit?: number };
  }>('/:address/history', {
    schema: {
      tags: ['Users'],
      summary: 'Get user transaction history',
      params: AddressParamsSchema,
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
    },
  }, async (request) => {
    const { address } = request.params;
    const { page = 1, limit = 20 } = request.query;
    
    const history = await usersService.getTransactionHistory(address, page, limit);
    
    return {
      success: true,
      data: history.items,
      pagination: {
        page,
        limit,
        total: history.total,
        totalPages: Math.ceil(history.total / limit),
      },
    };
  });
};
```

---

#### OpenAPI/Swagger Configuration

The API documentation is automatically generated and available at `/docs`:

```typescript
// backend/src/plugins/swagger.ts
import { FastifyPluginAsync } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'QuickLend API',
        description: `
## Overview

The QuickLend API provides programmatic access to lending market data, 
user positions, analytics, and notification management.

## Authentication

Most endpoints are public and require no authentication. Endpoints that 
modify user data (notifications) require wallet signature verification.

### Signature Authentication

1. Create a message: \`QuickLend Auth: {timestamp}\`
2. Sign with wallet
3. Include headers: \`X-Wallet-Address\`, \`X-Signature\`, \`X-Timestamp\`

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| GET requests | 200/min |
| POST/PUT/DELETE | 30/min |

## Response Format

All responses follow this structure:
\`\`\`json
{
  "success": boolean,
  "data": object | array,
  "error": string (if success=false),
  "timestamp": string
}
\`\`\`
        `,
        version: '1.0.0',
        contact: {
          name: 'QuickLend Support',
          email: 'support@quicklend.xyz',
          url: 'https://quicklend.xyz',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Development' },
        { url: 'https://api.quicklend.xyz', description: 'Production' },
      ],
      tags: [
        { name: 'Markets', description: 'Lending market data endpoints' },
        { name: 'Users', description: 'User position and history endpoints' },
        { name: 'Analytics', description: 'Protocol-wide metrics' },
        { name: 'Notifications', description: 'Alert subscription management' },
      ],
      components: {
        securitySchemes: {
          walletSignature: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Signature',
            description: 'Wallet signature for authentication',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};
```

---

#### Error Handling

**Global Error Handler**:

```typescript
// backend/src/api/middleware/errorHandler.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

// Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
  }
}

// Error handler
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const logger = request.log;

  // Log error details
  logger.error({
    err: error,
    requestId: request.id,
    url: request.url,
    method: request.method,
    ip: request.ip,
  });

  // Handle custom AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && error.details 
        ? { details: error.details } 
        : {}),
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.validation,
    });
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  // Handle unknown errors
  const isProduction = process.env.NODE_ENV === 'production';
  
  return reply.status(500).send({
    success: false,
    error: isProduction ? 'Internal server error' : error.message,
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { stack: error.stack }),
  });
}
```

**Request Validation with TypeBox**:

```typescript
// backend/src/api/middleware/validation.ts
import { Type, Static } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

// Reusable schemas
export const AddressSchema = Type.String({
  pattern: '^0x[a-fA-F0-9]{40}$',
  description: 'Ethereum address',
});

export const PaginationSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
});

export const DateRangeSchema = Type.Object({
  from: Type.Optional(Type.String({ format: 'date-time' })),
  to: Type.Optional(Type.String({ format: 'date-time' })),
});

// Compile schemas for better performance
export const compiledAddressSchema = TypeCompiler.Compile(AddressSchema);

export function validateAddress(address: string): boolean {
  return compiledAddressSchema.Check(address);
}
```

**Authentication Middleware**:

```typescript
// backend/src/api/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyMessage } from 'viem';
import { UnauthorizedError } from './errorHandler';

const AUTH_MESSAGE_PREFIX = 'QuickLend Auth: ';
const MAX_TIMESTAMP_AGE = 5 * 60 * 1000; // 5 minutes

export async function verifySignature(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const walletAddress = request.headers['x-wallet-address'] as string;
  const signature = request.headers['x-signature'] as string;
  const timestamp = request.headers['x-timestamp'] as string;

  if (!walletAddress || !signature || !timestamp) {
    throw new UnauthorizedError('Missing authentication headers');
  }

  // Validate timestamp freshness
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs) || Date.now() - timestampMs > MAX_TIMESTAMP_AGE) {
    throw new UnauthorizedError('Authentication expired');
  }

  // Verify signature
  const message = `${AUTH_MESSAGE_PREFIX}${timestamp}`;
  
  try {
    const isValid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      throw new UnauthorizedError('Invalid signature');
    }

    // Attach verified address to request
    request.walletAddress = walletAddress;
  } catch (error) {
    throw new UnauthorizedError('Signature verification failed');
  }
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    walletAddress?: string;
  }
}
```

---

### Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   └── index.ts             # Environment config
│   ├── db/
│   │   ├── index.ts             # Database connection
│   │   ├── schema.ts            # Drizzle schema
│   │   └── migrations/          # SQL migrations
│   ├── indexer/
│   │   ├── EventIndexer.ts      # Main indexer
│   │   └── handlers/            # Event handlers
│   ├── bots/
│   │   └── LiquidationBot.ts    # Liquidation automation
│   ├── services/
│   │   ├── AnalyticsService.ts  # Metrics calculation
│   │   ├── NotificationService.ts
│   │   └── CacheService.ts
│   ├── api/
│   │   ├── routes/
│   │   │   ├── markets.ts
│   │   │   ├── users.ts
│   │   │   ├── analytics.ts
│   │   │   └── notifications.ts
│   │   └── middleware/
│   │       ├── cache.ts
│   │       ├── rateLimit.ts
│   │       └── auth.ts
│   ├── lib/
│   │   ├── viem.ts              # Viem client setup
│   │   └── abi/                 # Contract ABIs
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── docker-compose.yml           # PostgreSQL + Redis
└── .env.example
```

---

### Environment Variables

```bash
# .env
# Server
PORT=3001
NODE_ENV=development

# Blockchain
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
CHAIN_ID=1
LENDING_POOL_ADDRESS=0x...
UI_DATA_PROVIDER_ADDRESS=0x...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quicklend

# Redis
REDIS_URL=redis://localhost:6379

# Liquidation Bot
LIQUIDATOR_PRIVATE_KEY=0x...
MIN_PROFIT_USD=10
LIQUIDATION_POLLING_MS=15000

# Notifications
TELEGRAM_BOT_TOKEN=...
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=...

# Frontend
FRONTEND_URL=https://quicklend.xyz
```

---

### Deployment

**Docker Compose for Development**:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: quicklend
      POSTGRES_PASSWORD: quicklend
      POSTGRES_DB: quicklend
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://quicklend:quicklend@postgres:5432/quicklend
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

**Production Recommendations**:
- Use managed PostgreSQL (e.g., Supabase, RDS)
- Use managed Redis (e.g., Upstash, ElastiCache)
- Deploy to container platforms (Railway, Fly.io, AWS ECS)
- Set up monitoring with Grafana + Prometheus
- Enable PagerDuty/Opsgenie for liquidation bot alerts

---

## ABI & TypeScript Types

### Generating Types from ABI

Use Wagmi CLI for type-safe contract interactions:

```bash
# Install Wagmi CLI
pnpm add -D @wagmi/cli

# Create wagmi.config.ts
```

```typescript
// wagmi.config.ts
import { defineConfig } from '@wagmi/cli';
import { foundry } from '@wagmi/cli/plugins';

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    foundry({
      project: '../smart-contract',
      include: [
        'LendingPool.sol/**',
        'UiPoolDataProvider.sol/**',
        'qToken.sol/**',
      ],
    }),
  ],
});
```

```bash
# Generate types
pnpm wagmi generate
```

This creates fully typed hooks for all contract functions.

---

## Error Handling

### Contract Errors

Map Solidity custom errors to user-friendly messages:

```typescript
// frontend/src/lib/errors.ts
export const CONTRACT_ERRORS: Record<string, string> = {
  MarketNotListed: 'This asset is not supported.',
  HealthFactorTooLow: 'This action would put your position at risk of liquidation.',
  AmountZero: 'Please enter an amount greater than zero.',
  InsufficientCollateral: 'You don\'t have enough collateral for this borrow.',
  TransferFailed: 'Token transfer failed. Please try again.',
  NothingToLiquidate: 'This position is healthy and cannot be liquidated.',
  SelfLiquidationNotAllowed: 'You cannot liquidate your own position.',
};

export function parseContractError(error: Error): string {
  const message = error.message;
  
  for (const [code, friendly] of Object.entries(CONTRACT_ERRORS)) {
    if (message.includes(code)) {
      return friendly;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}
```

### Transaction States

```tsx
// frontend/src/components/TransactionStatus.tsx
type TxState = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export function TransactionStatus({ state, error }: { state: TxState; error?: Error }) {
  switch (state) {
    case 'pending':
      return <p>Waiting for wallet confirmation...</p>;
    case 'confirming':
      return <p>Transaction submitted. Waiting for confirmation...</p>;
    case 'success':
      return <p className="text-green-500">Transaction successful!</p>;
    case 'error':
      return <p className="text-red-500">{parseContractError(error!)}</p>;
    default:
      return null;
  }
}
```

---

## Testing & Verification

### Local Development Flow

1. **Start Anvil (Local Node)**
   ```bash
   cd smart-contract
   anvil
   ```

2. **Deploy Contracts**
   ```bash
   forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
   ```

3. **Copy Addresses to Frontend**
   Update `.env.local` with deployed addresses

4. **Start Frontend**
   ```bash
   cd frontend
   pnpm dev
   ```

5. **Test with Anvil Accounts**
   Import Anvil's default accounts into MetaMask:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 ETH

### Integration Test Checklist

- [ ] Connect wallet successfully
- [ ] View all markets with correct data
- [ ] Approve tokens before supply
- [ ] Supply assets and receive qTokens
- [ ] Borrow against collateral
- [ ] Health factor updates correctly
- [ ] Repay debt (partial and full)
- [ ] Withdraw collateral
- [ ] Toggle collateral on/off
- [ ] Error handling displays correctly

---

## Summary

| Layer | Technology | Key Files |
|-------|------------|-----------|
| **Contracts** | Solidity + Foundry | `LendingPool.sol`, `UiPoolDataProvider.sol` |
| **Frontend** | Wagmi + Viem + RainbowKit | `hooks/useLendingActions.ts`, `lib/contracts.ts` |
| **Backend** | Node.js + Fastify + PostgreSQL + Redis | `indexer/EventIndexer.ts`, `bots/LiquidationBot.ts` |
| **Types** | Wagmi CLI + Drizzle ORM | Auto-generated from ABIs and DB schema |

For questions or issues, refer to:
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [Fastify Documentation](https://fastify.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
