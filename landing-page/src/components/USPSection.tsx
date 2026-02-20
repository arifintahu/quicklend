"use client";

import { motion } from "framer-motion";
import { Eye, Zap, Lock, BarChart3 } from "lucide-react";

const usps = [
  {
    icon: Eye,
    color: "text-[#00C6FF]",
    bg: "bg-[#00C6FF]/10",
    border: "border-[#00C6FF]/20",
    title: "\"See Your Risk Before You Sign\"",
    body: "As you type an amount, QuickLend instantly shows how your health factor will change — colour-coded from safe green to danger red. No other protocol does this before you confirm.",
  },
  {
    icon: Zap,
    color: "text-[#42e695]",
    bg: "bg-[#42e695]/10",
    border: "border-[#42e695]/20",
    title: "\"DeFi in Seconds, Not Hours\"",
    body: "One approval, one transaction. Supply USDC and start earning in 2 clicks. Our single-modal flow eliminates the multi-page wizards that plague other protocols.",
  },
  {
    icon: Lock,
    color: "text-[#FFB800]",
    bg: "bg-[#FFB800]/10",
    border: "border-[#FFB800]/20",
    title: "\"Non-Custodial, Always\"",
    body: "QuickLend smart contracts hold your funds — not us. There are no admin keys, no upgradeability, no pause switch in anyone's hands. Your crypto, your rules.",
  },
  {
    icon: BarChart3,
    color: "text-[#00C6FF]",
    bg: "bg-[#00C6FF]/10",
    border: "border-[#00C6FF]/20",
    title: "\"Rates Set by Math, Not a Board\"",
    body: "Interest rates adjust automatically based on supply and demand (utilization). No governance votes, no manual adjustments. Transparent, predictable, fair.",
  },
];

export default function USPSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Ambient orb */}
      <div
        className="orb w-[400px] h-[400px] bg-[#0072FF] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
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
          <p className="text-sm uppercase tracking-widest text-[#00C6FF] mb-3 font-medium">
            Why QuickLend
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Genuinely different
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {usps.map((u, i) => (
            <motion.div
              key={u.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`glass-panel rounded-2xl p-7 border ${u.border} flex gap-5`}
            >
              <div
                className={`w-11 h-11 rounded-xl ${u.bg} flex-shrink-0 flex items-center justify-center mt-0.5`}
              >
                <u.icon size={22} className={u.color} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {u.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{u.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
