"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function CTABanner() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="orb w-[500px] h-[500px] bg-[#0072FF] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel-strong rounded-3xl p-12 sm:p-16 text-center flex flex-col items-center gap-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,198,255,0.08), rgba(0,114,255,0.05), rgba(66,230,149,0.05))",
            borderColor: "rgba(0, 198, 255, 0.2)",
          }}
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center shadow-lg shadow-[#0072FF]/30">
            <Zap size={28} className="text-white" />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Ready to put your
              <br />
              <span className="text-gradient-hero">crypto to work?</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Supply and start earning in under 2 minutes. No account required.
              No lock-ups. Your keys, your crypto.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href={APP_URL}
              className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold"
            >
              Launch App — it&apos;s free
              <ArrowRight size={18} />
            </a>
            <a
              href="#how-it-works"
              className="btn-secondary inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base"
            >
              See how it works
            </a>
          </div>

          {/* Trust micro-copy */}
          <p className="text-xs text-gray-600">
            Non-custodial · Audited contracts · Open source · No sign-up
          </p>
        </motion.div>
      </div>
    </section>
  );
}
