'use client';

import { useState, useEffect, useRef } from 'react';
import { MarketData } from '@/hooks/useMarkets';
import { UserPosition } from '@/hooks/useUserPositions';
import { useProtocolHealth } from '@/hooks/useProtocolHealth';
import { useLendingActions } from '@/hooks/useLendingActions';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { calculateHealthFactor } from '@/lib/calculations';
import { useToast } from '@/contexts/ToastContext';
import { ActionType } from '@/components/organisms/ActionCard';

export function useActionModal(markets: MarketData[], userPositions: UserPosition[]) {
    const protocolHealth = useProtocolHealth();
    const { supply, borrow, withdraw, repay, isPending, isConfirming, isSuccess, error, reset } = useLendingActions();
    const { addToast, removeToast } = useToast();
    const [selectedAsset, setSelectedAsset] = useState<{ asset: MarketData; action: ActionType } | null>(null);
    const { balance: walletBalance } = useWalletBalance(
        selectedAsset?.asset.asset,
        selectedAsset?.asset.decimals
    );

    // Track pending toast ID so we can dismiss it when tx completes
    const pendingToastIdRef = useRef<string | null>(null);
    const lastActionRef = useRef<{ symbol: string; action: ActionType } | null>(null);

    // Show toasts on transaction lifecycle
    useEffect(() => {
        if (isPending && lastActionRef.current) {
            const { symbol, action } = lastActionRef.current;
            const id = addToast({
                type: 'pending',
                title: `${capitalize(action)}ing ${symbol}…`,
                message: 'Waiting for wallet confirmation',
            });
            pendingToastIdRef.current = id;
        }
    }, [isPending]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isConfirming && pendingToastIdRef.current) {
            removeToast(pendingToastIdRef.current);
            if (lastActionRef.current) {
                const { symbol, action } = lastActionRef.current;
                const id = addToast({
                    type: 'pending',
                    title: `${capitalize(action)}ing ${symbol}…`,
                    message: 'Transaction submitted — awaiting confirmation',
                });
                pendingToastIdRef.current = id;
            }
        }
    }, [isConfirming]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isSuccess && lastActionRef.current) {
            if (pendingToastIdRef.current) {
                removeToast(pendingToastIdRef.current);
                pendingToastIdRef.current = null;
            }
            const { symbol, action } = lastActionRef.current;
            addToast({
                type: 'success',
                title: `${capitalize(action)} confirmed`,
                message: `${symbol} ${action} was successful`,
            });
            lastActionRef.current = null;
            reset();
        }
    }, [isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (error) {
            if (pendingToastIdRef.current) {
                removeToast(pendingToastIdRef.current);
                pendingToastIdRef.current = null;
            }
            addToast({
                type: 'error',
                title: 'Transaction failed',
                message: (error as Error).message?.slice(0, 80) ?? 'Unknown error',
            });
            lastActionRef.current = null;
        }
    }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleAction = (amount: number, action: ActionType) => {
        if (!selectedAsset) return;

        const { asset: assetAddress, decimals, symbol } = selectedAsset.asset;
        lastActionRef.current = { symbol, action };

        if (action === 'supply') {
            supply(assetAddress, amount.toString(), decimals);
        } else if (action === 'borrow') {
            borrow(assetAddress, amount.toString(), decimals);
        } else if (action === 'withdraw') {
            withdraw(assetAddress, amount.toString(), decimals);
        } else if (action === 'repay') {
            repay(assetAddress, amount.toString(), decimals);
        }

        setSelectedAsset(null);
    };

    const buildProjectedPositions = (amount: number, action: ActionType, asset: MarketData) => {
        const tempPositions = userPositions.map(p => {
            if (p.symbol !== asset.symbol) return { ...p };
            return {
                ...p,
                suppliedAmount: p.suppliedAmount
                    + (action === 'supply' ? amount : 0)
                    - (action === 'withdraw' ? amount : 0),
                borrowedAmount: p.borrowedAmount
                    + (action === 'borrow' ? amount : 0)
                    - (action === 'repay' ? amount : 0),
            };
        });

        const hasExisting = userPositions.some(p => p.symbol === asset.symbol);
        if (!hasExisting && (action === 'supply' || action === 'borrow')) {
            tempPositions.push({
                asset: asset.asset,
                symbol: asset.symbol,
                suppliedAmount: action === 'supply' ? amount : 0,
                borrowedAmount: action === 'borrow' ? amount : 0,
                isCollateral: action === 'supply',
            });
        }

        return tempPositions;
    };

    const calculateProjectedHF = (amount: number, action: ActionType, asset: MarketData) => {
        return calculateHealthFactor(markets, buildProjectedPositions(amount, action, asset)).healthFactor;
    };

    const calculateProjectedLiquidationPrice = (amount: number, action: ActionType, asset: MarketData) => {
        return calculateHealthFactor(markets, buildProjectedPositions(amount, action, asset)).liquidationPrice;
    };

    const getMaxAmount = () => {
        if (!selectedAsset) return 0;
        const { action, asset } = selectedAsset;

        if (action === 'supply') {
            return walletBalance;
        }

        if (action === 'withdraw') {
            const pos = userPositions.find(p => p.symbol === asset.symbol);
            return pos?.suppliedAmount ?? 0;
        }

        if (action === 'repay') {
            const pos = userPositions.find(p => p.symbol === asset.symbol);
            return pos?.borrowedAmount ?? 0;
        }

        // borrow
        const remainingBorrowPower = calculatedHealthData.borrowPowerUsed < 1
            ? (1 - calculatedHealthData.borrowPowerUsed) * calculatedHealthData.totalCollateralUSD
            : 0;
        const maxByPower = asset.price > 0
            ? remainingBorrowPower / asset.price
            : 0;
        return Math.min(asset.availableLiquidity, maxByPower);
    };

    return {
        selectedAsset,
        setSelectedAsset,
        healthData,
        calculatedHealthData,
        handleAction,
        calculateProjectedHF,
        calculateProjectedLiquidationPrice,
        getMaxAmount,
    };
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
