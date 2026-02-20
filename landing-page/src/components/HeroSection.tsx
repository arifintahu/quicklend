"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  } as const;
}

const badges = [
  { icon: Shield, label: "Audited Contracts", color: "text-[#42e695]" },
  { icon: Zap, label: "Instant Execution", color: "text-[#00C6FF]" },
  { icon: TrendingUp, label: "Real-Time Risk Preview", color: "text-[#FFB800]" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="orb w-[600px] h-[600px] bg-[#0072FF] top-[-100px] left-[-200px]"
        aria-hidden
      />
      <div
        className="orb w-[500px] h-[500px] bg-[#42e695] bottom-[-100px] right-[-150px]"
        aria-hidden
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Pill label */}
        <motion.div
          {...fadeUp(0)}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-sm text-gray-300 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#42e695] animate-pulse" />
          Decentralised · Non-custodial · Open Source
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.12)}
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6"
        >
          <span className="text-gradient-hero">Supply and borrow tokens</span>
          <br />
          <span className="text-white">so seamlessly, even new</span>
          <br />
          <span className="text-white">crypto users feel right at home.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          {...fadeUp(0.24)}
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
        >
          Deposit your crypto to earn algorithmic interest. Borrow against your
          holdings without selling. See your risk in real-time — before you sign
          anything.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          {...fadeUp(0.36)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <a
            href={APP_URL}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base"
          >
            Start Earning
            <ArrowRight size={18} />
          </a>
          <a
            href="#how-it-works"
            className="btn-secondary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base"
          >
            How it works
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          {...fadeUp(0.48)}
          className="flex flex-wrap items-center justify-center gap-6"
        >
          {badges.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <Icon size={16} className={color} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 text-xs"
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-600" />
        scroll
      </motion.div>
    </section>
  );
}
