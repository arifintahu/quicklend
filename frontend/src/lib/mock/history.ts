export interface Transaction {
  id: string;
  action: 'Supply' | 'Borrow' | 'Repay' | 'Withdraw' | 'Liquidate';
  assetSymbol: string;
  amount: number;
  status: 'Confirmed' | 'Pending' | 'Failed';
  timestamp: string; // ISO string
  txHash: string;
}

export const MOCK_HISTORY: Transaction[] = [
  {
    id: '1',
    action: 'Supply',
    assetSymbol: 'USDC',
    amount: 5000,
    status: 'Confirmed',
    timestamp: '2023-10-25T14:30:00Z',
    txHash: '0x71...3a9b',
  },
  {
    id: '2',
    action: 'Borrow',
    assetSymbol: 'ETH',
    amount: 0.5,
    status: 'Confirmed',
    timestamp: '2023-10-26T09:15:00Z',
    txHash: '0x82...1c4d',
  },
  {
    id: '3',
    action: 'Repay',
    assetSymbol: 'ETH',
    amount: 0.1,
    status: 'Pending',
    timestamp: '2023-10-27T11:00:00Z',
    txHash: '0x93...5e2f',
  },
  {
    id: '4',
    action: 'Supply',
    assetSymbol: 'WBTC',
    amount: 0.05,
    status: 'Confirmed',
    timestamp: '2023-10-24T16:45:00Z',
    txHash: '0x60...8b1a',
  },
  {
    id: '5',
    action: 'Withdraw',
    assetSymbol: 'USDC',
    amount: 1000,
    status: 'Confirmed',
    timestamp: '2023-10-20T10:20:00Z',
    txHash: '0x55...9a2c',
  }
];
