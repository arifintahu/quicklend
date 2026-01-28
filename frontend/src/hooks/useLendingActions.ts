import { useStore } from '@/store/useStore';
import { useCallback, useState } from 'react';

export const useLendingActions = () => {
  const { supply, borrow, withdraw, repay, toggleCollateral } = useStore();
  const [isPending, setIsPending] = useState(false);

  // Helper to simulate network delay
  const withDelay = async (action: () => void) => {
    setIsPending(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s fake delay
    action();
    setIsPending(false);
  };

  const supplyAsset = useCallback(async (assetSymbol: string, amount: number) => {
    await withDelay(() => supply(assetSymbol, amount));
  }, [supply]);

  const borrowAsset = useCallback(async (assetSymbol: string, amount: number) => {
    await withDelay(() => borrow(assetSymbol, amount));
  }, [borrow]);

  const withdrawAsset = useCallback(async (assetSymbol: string, amount: number) => {
    await withDelay(() => withdraw(assetSymbol, amount));
  }, [withdraw]);

  const repayAsset = useCallback(async (assetSymbol: string, amount: number) => {
    await withDelay(() => repay(assetSymbol, amount));
  }, [repay]);

  const toggleAssetCollateral = useCallback(async (assetSymbol: string) => {
    await withDelay(() => toggleCollateral(assetSymbol));
  }, [toggleCollateral]);

  return {
    supply: supplyAsset,
    borrow: borrowAsset,
    withdraw: withdrawAsset,
    repay: repayAsset,
    toggleCollateral: toggleAssetCollateral,
    isPending
  };
};
