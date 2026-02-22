"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const badges = [
  { icon: Shield, label: "Audited", color: "text-[#42e695]" },
  { icon: Zap, label: "Non-custodial", color: "text-[#00C6FF]" },
  { icon: TrendingUp, label: "Real-time risk", color: "text-[#FFB800]" },
];

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-4 pt-32 pb-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#42e695]" />
          Decentralised · Non-custodial · Open Source
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 text-white"
        >
          The open liquidity
          <br />
          <span className="text-gradient-primary">protocol.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg text-gray-400 max-w-xl mx-auto mb-10"
        >
          Supply assets to earn yield. Borrow against your holdings without
          selling. Non-custodial and permissionless.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
        >
          <a
            href={APP_URL}
            className="btn-primary inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold"
          >
            Launch App
            <ArrowRight size={16} />
          </a>
          <a
            href="#how-it-works"
            className="btn-secondary inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm"
          >
            How it works
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6"
        >
          {badges.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-sm text-gray-500">
              <Icon size={14} className={color} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
