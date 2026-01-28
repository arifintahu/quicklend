import { create } from 'zustand';
import { MOCK_MARKETS, INITIAL_USER_POSITIONS, calculateHealthFactor } from '@/lib/mock/data';
import { MarketData, UserPosition, HealthFactorData } from '@/lib/mock/types';

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
  supply: (assetSymbol: string, amount: number) => void;
  borrow: (assetSymbol: string, amount: number) => void;
  withdraw: (assetSymbol: string, amount: number) => void;
  repay: (assetSymbol: string, amount: number) => void;
  toggleCollateral: (assetSymbol: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Wallet Initial State
  isConnected: true, // Mocked as connected initially for demo
  address: "0x12...34",
  connectWallet: () => set({ isConnected: true, address: "0x12...34" }),
  disconnectWallet: () => set({ isConnected: false, address: null }),

  markets: MOCK_MARKETS,
  userPositions: INITIAL_USER_POSITIONS,
  healthData: calculateHealthFactor(MOCK_MARKETS, INITIAL_USER_POSITIONS),

  supply: (assetSymbol, amount) => {
    const { userPositions, markets } = get();
    const existing = userPositions.find(p => p.assetSymbol === assetSymbol);
    
    let newPositions;
    if (existing) {
      newPositions = userPositions.map(p => 
        p.assetSymbol === assetSymbol 
          ? { ...p, suppliedAmount: p.suppliedAmount + amount }
          : p
      );
    } else {
      newPositions = [...userPositions, {
        assetSymbol,
        suppliedAmount: amount,
        borrowedAmount: 0,
        isCollateral: true
      }];
    }
    
    set({
      userPositions: newPositions,
      healthData: calculateHealthFactor(markets, newPositions)
    });
  },

  borrow: (assetSymbol, amount) => {
    const { userPositions, markets } = get();
    const existing = userPositions.find(p => p.assetSymbol === assetSymbol);
    
    let newPositions;
    if (existing) {
      newPositions = userPositions.map(p => 
        p.assetSymbol === assetSymbol 
          ? { ...p, borrowedAmount: p.borrowedAmount + amount }
          : p
      );
    } else {
      newPositions = [...userPositions, {
        assetSymbol,
        suppliedAmount: 0,
        borrowedAmount: amount,
        isCollateral: false // Borrowed assets aren't collateral usually, but if supplied > 0 it might be mixed. Simplification.
      }];
    }
    
    set({
      userPositions: newPositions,
      healthData: calculateHealthFactor(markets, newPositions)
    });
  },

  withdraw: (assetSymbol, amount) => {
    const { userPositions, markets } = get();
    const newPositions = userPositions.map(p => 
      p.assetSymbol === assetSymbol 
        ? { ...p, suppliedAmount: Math.max(0, p.suppliedAmount - amount) }
        : p
    );
    
    set({
      userPositions: newPositions,
      healthData: calculateHealthFactor(markets, newPositions)
    });
  },

  repay: (assetSymbol, amount) => {
    const { userPositions, markets } = get();
    const newPositions = userPositions.map(p => 
      p.assetSymbol === assetSymbol 
        ? { ...p, borrowedAmount: Math.max(0, p.borrowedAmount - amount) }
        : p
    );
    
    set({
      userPositions: newPositions,
      healthData: calculateHealthFactor(markets, newPositions)
    });
  },
  
  toggleCollateral: (assetSymbol) => {
      const { userPositions, markets } = get();
      const newPositions = userPositions.map(p =>
          p.assetSymbol === assetSymbol
              ? { ...p, isCollateral: !p.isCollateral }
              : p
      );
      set({
          userPositions: newPositions,
          healthData: calculateHealthFactor(markets, newPositions)
      });
  }
}));
