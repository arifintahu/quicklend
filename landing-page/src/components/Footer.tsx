"use client";

import { Github, Twitter, FileText, Zap } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const links = [
  { label: "Launch App", href: APP_URL },
  { label: "Markets", href: `${APP_URL}/markets` },
  { label: "Documentation", href: "#" },
  { label: "Security Audit", href: "#" },
  { label: "GitHub", href: "https://github.com" },
];

const socials = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: FileText, href: "#", label: "Docs" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white">
            Quick<span className="text-gradient-primary">Lend</span>
          </span>
        </a>

        {/* Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Socials */}
        <div className="flex items-center gap-2 shrink-0">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={label}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
            >
              <Icon size={15} />
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} QuickLend. All rights reserved.
        </p>
        <p className="text-xs text-gray-600">
          DeFi carries risk. Only supply assets you can afford to lose.
        </p>
      </div>
    </footer>
  );
}
