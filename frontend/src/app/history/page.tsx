"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { GlassCard } from '@/components/atoms/GlassCard';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { history, pagination, isLoading } = useTransactionHistory(page, 20);

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

  const shortenHash = (hash: string) =>
    hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : '';

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
            {isLoading ? (
              <div className="flex items-center justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-gray-500">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              <>
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
                    {history.map((tx, idx) => (
                      <tr key={`${tx.txHash}-${idx}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className={cn("p-6 font-bold", getActionColor(tx.eventName))}>
                          {tx.eventName}
                        </td>
                        <td className="p-6 font-mono text-white">
                          {shortenHash(tx.asset)}
                        </td>
                        <td className="p-6 text-right font-mono text-white">
                          {tx.amount ?? '-'}
                        </td>
                        <td className="p-6">
                          {getStatusBadge('Confirmed')}
                        </td>
                        <td className="p-6 text-right text-gray-400 text-sm">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="p-6 text-right">
                          <span className="flex items-center justify-end gap-1 text-[#00C6FF] text-sm font-mono">
                            {shortenHash(tx.txHash)} <ExternalLink size={12} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {pagination.page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={history.length < pagination.limit}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </main>
    </>
  );
}
