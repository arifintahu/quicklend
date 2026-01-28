import { useStore } from '@/store/useStore';
import { useCallback } from 'react';

export const useMarkets = () => {
  const markets = useStore(state => state.markets);
  
  const getMarket = useCallback((symbol: string) => {
    return markets.find(m => m.asset.symbol === symbol);
  }, [markets]);

  return {
    markets,
    getMarket,
    isLoading: false, // Mock
    error: null
  };
};
