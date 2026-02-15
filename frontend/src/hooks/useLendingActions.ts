'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { contracts } from '@/lib/contracts';

export function useLendingActions() {
  const { address } = useAccount();

  const {
    data: txHash,
    writeContract,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const supply = async (asset: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contracts.lendingPool.address) throw new Error('LendingPool not configured');

    const parsedAmount = parseUnits(amount, decimals);

    writeContract({
      address: contracts.lendingPool.address,
      abi: contracts.lendingPool.abi,
      functionName: 'supply',
      args: [asset, parsedAmount],
    });
  };

  const withdraw = async (asset: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contracts.lendingPool.address) throw new Error('LendingPool not configured');

    const parsedAmount = parseUnits(amount, decimals);

    writeContract({
      address: contracts.lendingPool.address,
      abi: contracts.lendingPool.abi,
      functionName: 'withdraw',
      args: [asset, parsedAmount],
    });
  };

  const borrow = async (asset: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contracts.lendingPool.address) throw new Error('LendingPool not configured');

    const parsedAmount = parseUnits(amount, decimals);

    writeContract({
      address: contracts.lendingPool.address,
      abi: contracts.lendingPool.abi,
      functionName: 'borrow',
      args: [asset, parsedAmount],
    });
  };

  const repay = async (asset: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contracts.lendingPool.address) throw new Error('LendingPool not configured');

    const parsedAmount = parseUnits(amount, decimals);

    writeContract({
      address: contracts.lendingPool.address,
      abi: contracts.lendingPool.abi,
      functionName: 'repay',
      args: [asset, parsedAmount],
    });
  };

  const setCollateral = async (asset: `0x${string}`, useAsCollateral: boolean) => {
    if (!contracts.lendingPool.address) throw new Error('LendingPool not configured');

    writeContract({
      address: contracts.lendingPool.address,
      abi: contracts.lendingPool.abi,
      functionName: 'setUserUseReserveAsCollateral',
      args: [asset, useAsCollateral],
    });
  };

  const liquidate = async (
    collateralAsset: `0x${string}`,
    borrowAsset: `0x${string}`,
    user: `0x${string}`,
    debtToCover: string,
    decimals: number = 18
  ) => {
    if (!contracts.lendingPool.address) throw new Error('LendingPool not configured');

    const parsedDebt = parseUnits(debtToCover, decimals);

    writeContract({
      address: contracts.lendingPool.address,
      abi: contracts.lendingPool.abi,
      functionName: 'liquidate',
      args: [collateralAsset, borrowAsset, user, parsedDebt],
    });
  };

  return {
    // Actions
    supply,
    withdraw,
    borrow,
    repay,
    setCollateral,
    liquidate,

    // Transaction state
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || confirmError,

    // Reset state for new transaction
    reset,

    // Connection
    isConnected: !!address,
    address,
  };
}
