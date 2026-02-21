"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { MarketsTable } from '@/components/organisms/MarketsTable';
import { ActionCard } from '@/components/organisms/ActionCard';
import { GlassCard } from '@/components/atoms/GlassCard';
import { useMarkets } from '@/hooks/useMarkets';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useActionModal } from '@/hooks/useActionModal';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function MarketsPage() {
  const { markets } = useMarkets();
  const { positions: userPositions } = useUserPositions();
  const [searchTerm, setSearchTerm] = useState('');
  const {
    selectedAsset,
    setSelectedAsset,
    healthData,
    handleAction,
    calculateProjectedHF,
    calculateProjectedLiquidationPrice,
    getMaxAmount,
  } = useActionModal(markets, userPositions);

  // Market Stats
  const totalMarketSize = markets.reduce((acc, m) => acc + (m.totalSupplied * m.price), 0);
  const totalAvailable = markets.reduce((acc, m) => acc + ((m.availableLiquidity || 0) * m.price), 0);
  const totalBorrows = markets.reduce((acc, m) => acc + (m.totalBorrowed * m.price), 0);

  // Filter Markets
  const filteredMarkets = markets.filter(m =>
    m.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
        <Navbar />

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="flex flex-col justify-center">
            <div className="text-gray-400 text-sm mb-1">Total Market Size</div>
            <div className="text-3xl font-mono font-bold text-white">
              {formatCurrency(totalMarketSize)}
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col justify-center">
            <div className="text-gray-400 text-sm mb-1">Total Available</div>
            <div className="text-3xl font-mono font-bold text-[#00C6FF]">
              {formatCurrency(totalAvailable)}
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col justify-center">
            <div className="text-gray-400 text-sm mb-1">Total Borrows</div>
            <div className="text-3xl font-mono font-bold text-[#FFB800]">
              {formatCurrency(totalBorrows)}
            </div>
          </GlassCard>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input rounded-xl pl-12 pr-4 py-3"
            />
          </div>
        </div>

        {/* Markets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MarketsTable
            markets={filteredMarkets}
            onSelectAsset={(asset) => setSelectedAsset({ asset, action: 'supply' })}
          />
        </motion.div>
      </main>

      {/* Action Modal */}
      {selectedAsset && (
        <ActionCard
          asset={selectedAsset.asset}
          action={selectedAsset.action}
          currentHealthFactor={healthData.healthFactor}
          maxAmount={getMaxAmount()}
          onClose={() => setSelectedAsset(null)}
          onConfirm={handleAction}
          calculateProjectedHealthFactor={(amount, action) => calculateProjectedHF(amount, action, selectedAsset.asset)}
          currentLiquidationPrice={healthData.liquidationPrice}
          calculateProjectedLiquidationPrice={(amount, action) => calculateProjectedLiquidationPrice(amount, action, selectedAsset.asset)}
        />
      )}
    </>
  );
}
