import { useStore } from '@/store/useStore';
import { useCallback } from 'react';

export const useUserPositions = () => {
  const userPositions = useStore(state => state.userPositions);

  const getPosition = useCallback((symbol: string) => {
    return userPositions.find(p => p.assetSymbol === symbol);
  }, [userPositions]);

  return {
    userPositions,
    getPosition,
    isLoading: false, // Mock
    error: null
  };
};
