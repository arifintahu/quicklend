"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { AssetTable } from '@/components/organisms/AssetTable';
import { GlassCard } from '@/components/atoms/GlassCard';
import { useMarkets } from '@/hooks/useMarkets';
import { useUserPositions } from '@/hooks/useUserPositions';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';

export default function MarketsPage() {
  const { markets } = useMarkets();
  const { userPositions } = useUserPositions();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate Market Stats
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
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl glass-input hover:bg-white/10 transition-colors">
                <Filter size={20} />
                <span>Filter</span>
            </button>
        </div>

        {/* Markets Table */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <AssetTable 
                markets={filteredMarkets} 
                userPositions={userPositions} 
                onSelectAsset={() => {}} // No-op for now or open modal
            />
        </motion.div>
      </main>
    </>
  );
}
