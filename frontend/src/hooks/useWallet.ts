'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function useWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    connect,
    disconnect,
    connectors,
    // Format address for display
    displayAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null,
  };
}
