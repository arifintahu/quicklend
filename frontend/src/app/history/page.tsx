"use client";

import React from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { GlassCard } from '@/components/atoms/GlassCard';
import { MOCK_HISTORY } from '@/lib/mock/history';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function HistoryPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="flex items-center gap-1 text-[#42e695] text-xs font-bold bg-[#42e695]/10 px-2 py-1 rounded-full border border-[#42e695]/20">
            <CheckCircle size={12} /> Confirmed
          </span>
        );
      case 'Pending':
        return (
          <span className="flex items-center gap-1 text-[#FFB800] text-xs font-bold bg-[#FFB800]/10 px-2 py-1 rounded-full border border-[#FFB800]/20">
            <Clock size={12} /> Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="flex items-center gap-1 text-[#FF4B4B] text-xs font-bold bg-[#FF4B4B]/10 px-2 py-1 rounded-full border border-[#FF4B4B]/20">
            <XCircle size={12} /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getActionColor = (action: string) => {
      if (['Supply', 'Repay'].includes(action)) return 'text-[#42e695]';
      if (['Borrow', 'Withdraw'].includes(action)) return 'text-[#FFB800]';
      if (action === 'Liquidate') return 'text-[#FF4B4B]';
      return 'text-white';
  };

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
        <Navbar />
        
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <GlassCard className="p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-6">Action</th>
                            <th className="p-6">Asset</th>
                            <th className="p-6 text-right">Amount</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Time</th>
                            <th className="p-6 text-right">Tx Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_HISTORY.map((tx) => (
                            <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className={cn("p-6 font-bold", getActionColor(tx.action))}>
                                    {tx.action}
                                </td>
                                <td className="p-6 font-mono text-white">
                                    {tx.assetSymbol}
                                </td>
                                <td className="p-6 text-right font-mono text-white">
                                    {tx.amount}
                                </td>
                                <td className="p-6">
                                    {getStatusBadge(tx.status)}
                                </td>
                                <td className="p-6 text-right text-gray-400 text-sm">
                                    {new Date(tx.timestamp).toLocaleString()}
                                </td>
                                <td className="p-6 text-right">
                                    <a href="#" className="flex items-center justify-end gap-1 text-[#00C6FF] hover:underline text-sm font-mono">
                                        {tx.txHash} <ExternalLink size={12} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </motion.div>
      </main>
    </>
  );
}
