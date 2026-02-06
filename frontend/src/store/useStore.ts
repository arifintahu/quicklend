import { create } from 'zustand';
import { MarketData } from '@/hooks/useMarkets';
import { UserPosition } from '@/hooks/useUserPositions';
import { HealthFactorData } from '@/hooks/useProtocolHealth';

interface AppState {
  // Wallet
  isConnected: boolean;
  address: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;

  markets: MarketData[];
  userPositions: UserPosition[];
  healthData: HealthFactorData;

  // Actions
  // NOTE: These actions update local state only. Real actions should use useLendingActions hook.
  supply: (assetSymbol: string, amount: number) => void;
  borrow: (assetSymbol: string, amount: number) => void;
  withdraw: (assetSymbol: string, amount: number) => void;
  repay: (assetSymbol: string, amount: number) => void;
  toggleCollateral: (assetSymbol: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Wallet Initial State
  isConnected: false,
  address: null,
  connectWallet: () => set({ isConnected: true, address: "0x12...34" }), // Mock connection for now if needed, or rely on Wagmi
  disconnectWallet: () => set({ isConnected: false, address: null }),

  markets: [],
  userPositions: [],
  healthData: { healthFactor: 0, status: 'none' } as HealthFactorData,

  supply: (assetSymbol, amount) => {
    // Placeholder: Real app uses standard Wagmi/Viem hooks
    console.log('Supply action triggered via store', assetSymbol, amount);
  },

  borrow: (assetSymbol, amount) => {
    console.log('Borrow action triggered via store', assetSymbol, amount);
  },

  withdraw: (assetSymbol, amount) => {
    console.log('Withdraw action triggered via store', assetSymbol, amount);
  },

  repay: (assetSymbol, amount) => {
    console.log('Repay action triggered via store', assetSymbol, amount);
  },

  toggleCollateral: (assetSymbol) => {
    console.log('Toggle Collateral action triggered via store', assetSymbol);
  }
}));
