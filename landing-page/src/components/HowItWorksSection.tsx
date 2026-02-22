"use client";

import { motion } from "framer-motion";
import { Wallet, ArrowDownToLine, TrendingUp } from "lucide-react";

const steps = [
  {
    step: "1",
    icon: Wallet,
    iconColor: "text-[#00C6FF]",
    title: "Connect your wallet",
    description:
      "Click 'Launch App' and connect with MetaMask, WalletConnect, or any popular wallet. QuickLend never stores your keys.",
  },
  {
    step: "2",
    icon: ArrowDownToLine,
    iconColor: "text-[#42e695]",
    title: "Supply an asset",
    description:
      "Choose USDC, WETH, or WBTC. Enter an amount and confirm. Your projected APY updates in real-time before you sign.",
  },
  {
    step: "3",
    icon: TrendingUp,
    iconColor: "text-[#FFB800]",
    title: "Earn or borrow",
    description:
      "Supplied assets start earning immediately. Optionally borrow against your collateral and monitor your health factor from the dashboard.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            DeFi in three steps
          </h2>
          <p className="text-gray-400 mt-3 max-w-md mx-auto text-sm">
            From wallet connection to earning interest in minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="border border-white/10 rounded-2xl p-6 bg-white/[0.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <s.icon size={18} className={s.iconColor} />
                </div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Step {s.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
