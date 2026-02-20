"use client";

import { motion } from "framer-motion";
import { TrendingUp, CreditCard, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    iconColor: "text-[#42e695]",
    iconBg: "bg-[#42e695]/10",
    title: "Supply → Earn",
    headline: "Put idle crypto to work",
    description:
      "Deposit USDC, WETH, or WBTC and immediately start earning algorithmic interest. No lock-up periods. No minimum amounts. Withdraw any time.",
    highlights: [
      "Interest accrues every block",
      "Receive yield-bearing qTokens",
      "No minimum deposit",
    ],
  },
  {
    icon: CreditCard,
    iconColor: "text-[#00C6FF]",
    iconBg: "bg-[#00C6FF]/10",
    title: "Borrow → Spend",
    headline: "Unlock liquidity without selling",
    description:
      "Use your ETH or BTC as collateral to borrow stablecoins. Keep your long exposure while accessing cash — pay back whenever you're ready.",
    highlights: [
      "Over-collateralised, non-custodial",
      "Rates driven by market utilization",
      "One unified health score",
    ],
  },
  {
    icon: ShieldCheck,
    iconColor: "text-[#FFB800]",
    iconBg: "bg-[#FFB800]/10",
    title: "Safe → Audited",
    headline: "Risk you can see and control",
    description:
      "QuickLend shows you exactly how each transaction changes your risk profile — before you sign. Audited smart contracts with no admin keys.",
    highlights: [
      "Real-time health factor preview",
      "Audited by independent researchers",
      "No admin keys or upgradeable proxies",
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-widest text-[#00C6FF] mb-3 font-medium">
            What you can do
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Three things. Done right.
          </h2>
        </motion.div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.55 }}
              className="glass-panel rounded-2xl p-7 flex flex-col gap-5 hover:border-white/15 transition-colors"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center`}
              >
                <f.icon size={24} className={f.iconColor} />
              </div>

              {/* Label + headline */}
              <div>
                <span className={`text-xs font-semibold uppercase tracking-widest ${f.iconColor}`}>
                  {f.title}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {f.headline}
                </h3>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed">
                {f.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2 mt-auto">
                {f.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${f.iconBg} ${f.iconColor} flex-shrink-0`} />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
