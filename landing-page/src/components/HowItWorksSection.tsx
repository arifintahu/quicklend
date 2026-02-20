"use client";

import { motion } from "framer-motion";
import { Wallet, ArrowDownToLine, TrendingUp } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const steps = [
  {
    step: "01",
    icon: Wallet,
    iconColor: "text-[#00C6FF]",
    gradientFrom: "#00C6FF",
    title: "Connect your wallet",
    description:
      "Click 'Launch App' and connect with MetaMask, Coinbase Wallet, WalletConnect, or any other popular wallet. QuickLend never stores your keys.",
  },
  {
    step: "02",
    icon: ArrowDownToLine,
    iconColor: "text-[#42e695]",
    gradientFrom: "#42e695",
    title: "Supply an asset",
    description:
      "Choose USDC, WETH, or WBTC from the Markets page. Enter an amount — watch your projected APY update in real-time — then confirm. Done.",
  },
  {
    step: "03",
    icon: TrendingUp,
    iconColor: "text-[#FFB800]",
    gradientFrom: "#FFB800",
    title: "Earn interest or borrow",
    description:
      "Your supplied assets start earning immediately. Optionally, borrow against your collateral. Monitor your health factor at a glance from the dashboard.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-widest text-[#42e695] mb-3 font-medium">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            DeFi in three steps
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            From wallet connection to earning interest — the fastest path in
            DeFi.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-gradient-to-r from-[#00C6FF]/30 via-[#42e695]/30 to-[#FFB800]/30"
            aria-hidden
          />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.55 }}
                className="flex flex-col items-center text-center gap-5"
              >
                {/* Icon circle */}
                <div
                  className="relative w-20 h-20 rounded-full glass-panel-strong flex items-center justify-center z-10"
                  style={{
                    boxShadow: `0 0 40px ${s.gradientFrom}22`,
                  }}
                >
                  <s.icon size={32} className={s.iconColor} />
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full glass-panel flex items-center justify-center text-xs font-bold"
                    style={{ color: s.gradientFrom }}
                  >
                    {s.step.slice(-1)}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <a
            href={APP_URL}
            className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold"
          >
            Launch App — it&apos;s free
          </a>
          <p className="text-gray-600 text-xs mt-3">
            No account required. Just a web3 wallet.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
