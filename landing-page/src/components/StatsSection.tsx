"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, BarChart2, TrendingUp, Users } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Stat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}

const FALLBACK_STATS: Stat[] = [
  {
    label: "Total Value Locked",
    value: "$—",
    icon: DollarSign,
    color: "text-[#00C6FF]",
  },
  {
    label: "Active Markets",
    value: "—",
    icon: BarChart2,
    color: "text-[#42e695]",
  },
  {
    label: "Best Supply APY",
    value: "—%",
    icon: TrendingUp,
    color: "text-[#FFB800]",
  },
  {
    label: "Total Suppliers",
    value: "—",
    icon: Users,
    color: "text-[#00C6FF]",
  },
];

function formatTvl(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stat[]>(FALLBACK_STATS);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/markets`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        const markets: Array<{
          totalSupplyUsd: number;
          supplyApy: number;
          totalBorrowsUsd: number;
        }> = Array.isArray(data?.data) ? data.data : [];

        if (markets.length === 0) return;

        const tvl = markets.reduce(
          (acc, m) => acc + (m.totalSupplyUsd || 0),
          0
        );
        const bestApy = Math.max(...markets.map((m) => m.supplyApy || 0));

        setStats([
          {
            label: "Total Value Locked",
            value: formatTvl(tvl),
            icon: DollarSign,
            color: "text-[#00C6FF]",
          },
          {
            label: "Active Markets",
            value: String(markets.length),
            icon: BarChart2,
            color: "text-[#42e695]",
          },
          {
            label: "Best Supply APY",
            value: `${(bestApy * 100).toFixed(2)}%`,
            icon: TrendingUp,
            color: "text-[#FFB800]",
          },
          {
            label: "Total Suppliers",
            value: "—",
            icon: Users,
            color: "text-[#00C6FF]",
          },
        ]);
      } catch {
        // keep fallback
      }
    }

    fetchStats();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="glass-panel rounded-2xl p-5 flex flex-col items-center text-center gap-2"
          >
            <stat.icon size={20} className={stat.color} />
            <span className={`text-3xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-xs text-gray-500 leading-tight">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
