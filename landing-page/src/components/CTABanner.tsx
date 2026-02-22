"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function CTABanner() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-white/10 rounded-2xl p-10 sm:p-14 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,198,255,0.05), rgba(0,114,255,0.03))",
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">
            Supply and start earning in under 2 minutes. No account required. Your keys, your crypto.
          </p>
          <a
            href={APP_URL}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
          >
            Launch App
            <ArrowRight size={16} />
          </a>
          <p className="text-xs text-gray-600 mt-5">
            Non-custodial · Audited · Open source · No sign-up
          </p>
        </motion.div>
      </div>
    </section>
  );
}
