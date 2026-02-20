"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

const rows: {
  feature: string;
  aave: "yes" | "partial" | "no";
  compound: "yes" | "partial" | "no";
  quicklend: "yes" | "partial" | "no";
  note?: string;
}[] = [
  {
    feature: "Real-time HF preview as you type",
    aave: "partial",
    compound: "no",
    quicklend: "yes",
    note: "Unique to QuickLend",
  },
  {
    feature: "UI complexity",
    aave: "no",
    compound: "no",
    quicklend: "yes",
    note: "QuickLend = Simple",
  },
  {
    feature: "New user onboarding",
    aave: "partial",
    compound: "no",
    quicklend: "partial",
    note: "Guided flow — roadmap",
  },
  {
    feature: "Non-custodial",
    aave: "yes",
    compound: "yes",
    quicklend: "yes",
  },
  {
    feature: "Algorithmic interest rates",
    aave: "yes",
    compound: "yes",
    quicklend: "yes",
  },
  {
    feature: "Mobile-optimised UX",
    aave: "partial",
    compound: "no",
    quicklend: "yes",
    note: "Roadmap",
  },
  {
    feature: "Projected liquidation price preview",
    aave: "partial",
    compound: "no",
    quicklend: "yes",
  },
];

function Cell({ value }: { value: "yes" | "partial" | "no" }) {
  if (value === "yes")
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#42e695]/15">
        <Check size={14} className="text-[#42e695]" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFB800]/15">
        <Minus size={14} className="text-[#FFB800]" />
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FF4B4B]/15">
      <X size={14} className="text-[#FF4B4B]" />
    </span>
  );
}

export default function ComparisonSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm uppercase tracking-widest text-[#42e695] mb-3 font-medium">
            Comparison
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            QuickLend vs the field
          </h2>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-4 px-6 text-gray-500 font-medium w-1/2">
                  Feature
                </th>
                <th className="py-4 px-3 text-gray-500 font-medium text-center">
                  Aave
                </th>
                <th className="py-4 px-3 text-gray-500 font-medium text-center">
                  Compound
                </th>
                <th className="py-4 px-3 font-bold text-center">
                  <span className="text-gradient-primary">QuickLend</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/5 last:border-0 ${
                    i % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <td className="py-4 px-6 text-gray-300">
                    {row.feature}
                    {row.note && (
                      <span className="ml-2 text-xs text-gray-600">
                        ({row.note})
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <Cell value={row.aave} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <Cell value={row.compound} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <Cell value={row.quicklend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <Check size={12} className="text-[#42e695]" /> Yes
          </span>
          <span className="flex items-center gap-1.5">
            <Minus size={12} className="text-[#FFB800]" /> Partial
          </span>
          <span className="flex items-center gap-1.5">
            <X size={12} className="text-[#FF4B4B]" /> No
          </span>
        </div>
      </div>
    </section>
  );
}
