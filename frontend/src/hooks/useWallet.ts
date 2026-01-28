import { useStore } from '@/store/useStore';

export const useWallet = () => {
  const { isConnected, address, connectWallet, disconnectWallet } = useStore();
  
  return {
    isConnected,
    address,
    connect: connectWallet,
    disconnect: disconnectWallet
  };
};
