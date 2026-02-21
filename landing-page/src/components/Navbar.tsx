"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-panel border-b border-white/8" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 font-bold text-lg cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white">
              Quick<span className="text-gradient-primary">Lend</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <a
              href={APP_URL}
              className="btn-primary hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm"
            >
              Launch App
            </a>
            <button
              className="md:hidden p-2 rounded-lg glass-panel cursor-pointer"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-40 glass-panel-strong flex flex-col pt-20 px-6 gap-6 md:hidden"
          >
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xl text-white font-medium py-2 border-b border-white/8"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href={APP_URL}
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base mt-4"
              onClick={() => setMobileOpen(false)}
            >
              Launch App
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
