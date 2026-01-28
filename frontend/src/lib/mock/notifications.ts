export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Liquidation Risk',
    message: 'Your Health Factor has dropped below 1.5. Consider supplying more collateral.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Supply Successful',
    message: 'You successfully supplied 5.0 ETH to the lending pool.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'New Asset Listed',
    message: 'Aave (AAVE) is now available for borrowing and supplying.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Transaction Failed',
    message: 'Your attempt to borrow 10,000 USDC failed due to network congestion.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
  }
];
