'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { ERC20_ABI, contracts } from '@/lib/contracts';

export function useTokenApproval(tokenAddress: `0x${string}` | undefined) {
    const { address } = useAccount();

    // Read current allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address && contracts.lendingPool.address
            ? [address, contracts.lendingPool.address]
            : undefined,
        query: {
            enabled: !!tokenAddress && !!address && !!contracts.lendingPool.address,
        },
    });

    // Read token balance
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!tokenAddress && !!address,
        },
    });

    // Read decimals
    const { data: decimals } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
        query: {
            enabled: !!tokenAddress,
        },
    });

    // Approve transaction
    const {
        data: approveTxHash,
        writeContract: approve,
        isPending: isApproving,
        error: approveError,
        reset: resetApprove,
    } = useWriteContract();

    const {
        isLoading: isConfirmingApproval,
        isSuccess: isApproved,
    } = useWaitForTransactionReceipt({
        hash: approveTxHash,
    });

    // Check if approval is needed
    const needsApproval = (amount: string): boolean => {
        if (!allowance || !decimals) return true;
        const parsedAmount = parseUnits(amount, decimals);
        return (allowance as bigint) < parsedAmount;
    };

    // Approve maximum amount
    const approveMax = () => {
        if (!tokenAddress || !contracts.lendingPool.address) return;

        approve({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contracts.lendingPool.address, maxUint256],
        });
    };

    // Approve specific amount
    const approveAmount = (amount: string) => {
        if (!tokenAddress || !contracts.lendingPool.address || !decimals) return;

        const parsedAmount = parseUnits(amount, decimals);

        approve({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contracts.lendingPool.address, parsedAmount],
        });
    };

    return {
        // Data
        allowance: allowance as bigint | undefined,
        balance: balance as bigint | undefined,
        decimals: decimals as number | undefined,

        // Helpers
        needsApproval,

        // Actions
        approveMax,
        approveAmount,

        // State
        isApproving,
        isConfirmingApproval,
        isApproved,
        approveError,
        approveTxHash,

        // Refetch
        refetchAllowance,
        refetchBalance,
        resetApprove,
    };
}
