"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface StatItem {
  label: string;
  value: string;
}

const FALLBACK: StatItem[] = [
  { label: "Total Value Locked", value: "$—" },
  { label: "Active Markets", value: "—" },
  { label: "Best Supply APY", value: "—%" },
  { label: "Supported Assets", value: "3" },
];

function formatTvl(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatItem[]>(FALLBACK);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/markets`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const markets: Array<{ totalSupplyUsd: number; supplyApy: number }> =
          Array.isArray(data?.data) ? data.data : [];
        if (markets.length === 0) return;
        const tvl = markets.reduce((acc, m) => acc + (m.totalSupplyUsd || 0), 0);
        const bestApy = Math.max(...markets.map((m) => m.supplyApy || 0));
        setStats([
          { label: "Total Value Locked", value: formatTvl(tvl) },
          { label: "Active Markets", value: String(markets.length) },
          { label: "Best Supply APY", value: `${(bestApy * 100).toFixed(2)}%` },
          { label: "Supported Assets", value: String(markets.length) },
        ]);
      } catch {
        // keep fallback
      }
    }
    fetchStats();
  }, []);

  return (
    <section className="px-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto border border-white/10 rounded-2xl overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 divide-y md:divide-y-0"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 py-5 text-center">
            <div className="text-2xl font-bold font-mono text-white mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
