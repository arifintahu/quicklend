'use client';

import { useState } from 'react';
import { MarketData } from '@/hooks/useMarkets';
import { UserPosition } from '@/hooks/useUserPositions';
import { useProtocolHealth } from '@/hooks/useProtocolHealth';
import { useLendingActions } from '@/hooks/useLendingActions';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { calculateHealthFactor } from '@/lib/calculations';

export function useActionModal(markets: MarketData[], userPositions: UserPosition[]) {
  const protocolHealth = useProtocolHealth();
  const { supply, borrow } = useLendingActions();
  const [selectedAsset, setSelectedAsset] = useState<{ asset: MarketData; action: 'supply' | 'borrow' } | null>(null);
  const { balance: walletBalance } = useWalletBalance(
    selectedAsset?.asset.asset,
    selectedAsset?.asset.decimals
  );

  const calculatedHealthData = calculateHealthFactor(markets, userPositions);

  const healthFactor = protocolHealth.healthFactor > 0
    ? protocolHealth.healthFactor
    : calculatedHealthData.healthFactor;

  const healthData = {
    ...calculatedHealthData,
    healthFactor,
    status: protocolHealth.status !== 'none'
      ? protocolHealth.status
      : (calculatedHealthData.healthFactor < 1 ? 'danger' : 'safe'),
  };

  const handleAction = (amount: number, action: 'supply' | 'borrow') => {
    if (!selectedAsset) return;

    const { asset: assetAddress, decimals } = selectedAsset.asset;
    if (action === 'supply') {
      supply(assetAddress, amount.toString(), decimals);
    } else {
      borrow(assetAddress, amount.toString(), decimals);
    }
    setSelectedAsset(null);
  };

  const calculateProjectedHF = (amount: number, action: 'supply' | 'borrow', asset: MarketData) => {
    const tempPositions = userPositions.map(p => {
      if (p.symbol !== asset.symbol) return { ...p };
      return {
        ...p,
        suppliedAmount: p.suppliedAmount + (action === 'supply' ? amount : 0),
        borrowedAmount: p.borrowedAmount + (action === 'borrow' ? amount : 0),
      };
    });

    const hasExisting = userPositions.some(p => p.symbol === asset.symbol);
    if (!hasExisting) {
      tempPositions.push({
        asset: asset.asset,
        symbol: asset.symbol,
        suppliedAmount: action === 'supply' ? amount : 0,
        borrowedAmount: action === 'borrow' ? amount : 0,
        isCollateral: action === 'supply',
      });
    }

    return calculateHealthFactor(markets, tempPositions).healthFactor;
  };

  const getMaxAmount = () => {
    if (!selectedAsset) return 0;
    if (selectedAsset.action === 'supply') {
      return walletBalance;
    }
    const remainingBorrowPower = calculatedHealthData.borrowPowerUsed < 1
      ? (1 - calculatedHealthData.borrowPowerUsed) * calculatedHealthData.totalCollateralUSD
      : 0;
    const maxByPower = selectedAsset.asset.price > 0
      ? remainingBorrowPower / selectedAsset.asset.price
      : 0;
    return Math.min(selectedAsset.asset.availableLiquidity, maxByPower);
  };

  return {
    selectedAsset,
    setSelectedAsset,
    healthData,
    calculatedHealthData,
    handleAction,
    calculateProjectedHF,
    getMaxAmount,
  };
}
