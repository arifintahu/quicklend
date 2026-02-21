"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Github, Lock, Eye } from "lucide-react";

const trust = [
  {
    icon: ShieldCheck,
    color: "text-[#42e695]",
    bg: "bg-[#42e695]/10",
    title: "Audited Smart Contracts",
    body: "QuickLend contracts have undergone an independent security audit. All findings are publicly documented and resolved.",
    cta: { label: "View audit report", href: "#" },
  },
  {
    icon: Lock,
    color: "text-[#00C6FF]",
    bg: "bg-[#00C6FF]/10",
    title: "Non-Custodial by Design",
    body: "Your assets are held exclusively by audited smart contracts on-chain. QuickLend never holds your keys and cannot move your funds.",
    cta: null,
  },
  {
    icon: Github,
    color: "text-[#FFB800]",
    bg: "bg-[#FFB800]/10",
    title: "Fully Open Source",
    body: "Every line of code — contracts, frontend, and backend — is public. Verify the math, fork the UI, or run your own instance.",
    cta: { label: "View on GitHub", href: "https://github.com" },
  },
  {
    icon: Eye,
    color: "text-[#00C6FF]",
    bg: "bg-[#00C6FF]/10",
    title: "Transparent Risk Display",
    body: "Your health factor, collateral ratio, and liquidation threshold are displayed in real-time. No hidden risks, no fine print.",
    cta: null,
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="py-24 px-4 relative overflow-hidden">
      {/* Background orb */}
      <div
        className="orb w-[500px] h-[500px] bg-[#42e695] top-0 right-[-200px]"
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
            Security & Trust
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Built to be trusted
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            DeFi should be transparent. Here is exactly what we have done to
            protect your funds.
          </p>
        </motion.div>

        {/* Trust grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {trust.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-panel rounded-2xl p-7 flex flex-col gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center`}
              >
                <t.icon size={24} className={t.color} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{t.body}</p>
              </div>
              {t.cta && (
                <a
                  href={t.cta.href}
                  className={`text-sm font-medium ${t.color} hover:underline mt-auto cursor-pointer`}
                  target={t.cta.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    t.cta.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {t.cta.label} →
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* Protocol parameters */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-8 mt-8"
        >
          <h3 className="text-base font-semibold text-white mb-5">
            Protocol parameters (on-chain, immutable)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: "Base Interest Rate", value: "2%" },
              { label: "Reserve Factor", value: "10%" },
              { label: "Close Factor (liquidation)", value: "50%" },
              { label: "Liquidation Bonus", value: "≤ 20%" },
            ].map((p) => (
              <div key={p.label} className="flex flex-col gap-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {p.value}
                </span>
                <span className="text-xs text-gray-500">{p.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
