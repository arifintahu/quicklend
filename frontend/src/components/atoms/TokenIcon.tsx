import React from 'react';

const TOKEN_COLORS: Record<string, string> = {
    USDC: '#2775CA',
    USDT: '#26A17B',
    WETH: '#627EEA',
    ETH: '#627EEA',
    WBTC: '#F7931A',
    BTC: '#F7931A',
    DAI: '#F5AC37',
    LINK: '#2A5ADA',
    UNI: '#FF007A',
    AAVE: '#B6509E',
    MATIC: '#8247E5',
    SOL: '#9945FF',
};

interface TokenIconProps {
    symbol: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
    };

    const bgColor = TOKEN_COLORS[symbol.toUpperCase()];

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
            style={{ backgroundColor: bgColor ?? '#374151' }}
        >
            {symbol[0]}
        </div>
    );
};
