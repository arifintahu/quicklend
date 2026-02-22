"use client";

import { motion } from "framer-motion";
import { TrendingUp, CreditCard, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    iconColor: "text-[#42e695]",
    iconBg: "bg-[#42e695]/10",
    label: "Supply",
    headline: "Put idle crypto to work",
    description:
      "Deposit USDC, WETH, or WBTC and earn algorithmic interest every block. No lock-up periods. Withdraw any time.",
  },
  {
    icon: CreditCard,
    iconColor: "text-[#00C6FF]",
    iconBg: "bg-[#00C6FF]/10",
    label: "Borrow",
    headline: "Unlock liquidity without selling",
    description:
      "Use your crypto as collateral to borrow stablecoins. Keep your long exposure while accessing cash.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-[#FFB800]",
    iconBg: "bg-[#FFB800]/10",
    label: "Risk",
    headline: "See your risk before you sign",
    description:
      "QuickLend previews how each transaction changes your health factor in real-time. Audited contracts, no admin keys.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need. Nothing you don&apos;t.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="border border-white/10 rounded-2xl p-6 flex flex-col gap-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center`}>
                <f.icon size={20} className={f.iconColor} />
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${f.iconColor}`}>
                  {f.label}
                </p>
                <h3 className="text-lg font-bold text-white">{f.headline}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
