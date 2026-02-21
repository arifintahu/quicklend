"use client";

import { motion } from "framer-motion";
import { Coins, DollarSign, BarChart2, HelpCircle, ArrowRight } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const audiences = [
  {
    icon: Coins,
    iconColor: "text-[#FFB800]",
    iconBg: "bg-[#FFB800]/10",
    border: "border-[#FFB800]/20",
    tag: "Crypto Holders",
    headline: "Make your idle ETH work for you",
    body: "Stop leaving value on the table. Supply your ETH or BTC as collateral and earn algorithmic interest — or borrow stablecoins against it without selling your position.",
    cta: { label: "Supply and earn", href: APP_URL },
    ctaColor: "text-[#FFB800]",
  },
  {
    icon: DollarSign,
    iconColor: "text-[#42e695]",
    iconBg: "bg-[#42e695]/10",
    border: "border-[#42e695]/20",
    tag: "Stablecoin Holders",
    headline: "Earn 3–8% APY on USDC, no lock-up",
    body: "Put your stablecoins to work. Deposit USDC and immediately start earning algorithmic interest that adjusts with market demand. Withdraw at any time — no penalties.",
    cta: { label: "Start earning", href: APP_URL },
    ctaColor: "text-[#42e695]",
  },
  {
    icon: BarChart2,
    iconColor: "text-[#00C6FF]",
    iconBg: "bg-[#00C6FF]/10",
    border: "border-[#00C6FF]/20",
    tag: "DeFi Power Users",
    headline: "Over-collateralised lending with real-time risk visualisation",
    body: "Manage cross-collateral positions with a single unified health score. See your exact liquidation price and projected health factor change as you type — before you sign anything.",
    cta: { label: "Explore markets", href: `${APP_URL}/markets` },
    ctaColor: "text-[#00C6FF]",
  },
  {
    icon: HelpCircle,
    iconColor: "text-[#00C6FF]",
    iconBg: "bg-[#00C6FF]/10",
    border: "border-[#00C6FF]/20",
    tag: "New to DeFi",
    headline: "Borrow dollars against your crypto without selling",
    body: "You don't need to sell your ETH to get cash. Supply it as collateral and borrow USDC against it. QuickLend shows you exactly how safe your position is — in plain language.",
    cta: { label: "How it works", href: "#how-it-works" },
    ctaColor: "text-[#00C6FF]",
  },
];

export default function AudienceSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Ambient orb */}
      <div
        className="orb w-[350px] h-[350px] bg-[#42e695] bottom-0 left-[-100px]"
        aria-hidden
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-widest text-[#42e695] mb-3 font-medium">
            Who is QuickLend for?
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Built for every crypto user
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            Whether you&apos;re earning yield on stablecoins or managing a
            complex multi-asset position — QuickLend meets you where you are.
          </p>
        </motion.div>

        {/* Audience cards grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {audiences.map((a, i) => (
            <motion.div
              key={a.tag}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`glass-panel rounded-2xl p-7 border ${a.border} flex flex-col gap-4 group`}
            >
              {/* Tag + icon */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${a.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <a.icon size={20} className={a.iconColor} />
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-widest ${a.iconColor}`}
                >
                  {a.tag}
                </span>
              </div>

              {/* Headline */}
              <h3 className="text-lg font-bold text-white leading-snug">
                {a.headline}
              </h3>

              {/* Body */}
              <p className="text-sm text-gray-400 leading-relaxed flex-1">
                {a.body}
              </p>

              {/* CTA */}
              <a
                href={a.cta.href}
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${a.ctaColor} hover:underline mt-auto group-hover:gap-2.5 transition-all cursor-pointer`}
              >
                {a.cta.label}
                <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
