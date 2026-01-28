import { useStore } from '@/store/useStore';

export const useProtocolHealth = () => {
  const healthData = useStore(state => state.healthData);

  return {
    ...healthData,
    isLoading: false, // Mock
    error: null
  };
};
