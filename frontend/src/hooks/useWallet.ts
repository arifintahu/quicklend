'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';

export function useWallet() {
  const { address, isConnected, isConnecting, isReconnecting, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { disconnect } = useDisconnect();

  return {
    address,
    chain,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    openConnectModal,
    openAccountModal,
    disconnect,
    displayAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null,
  };
}
