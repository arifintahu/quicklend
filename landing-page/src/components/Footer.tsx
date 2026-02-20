"use client";

import { Github, Twitter, FileText, Zap } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const columns = [
  {
    heading: "Protocol",
    links: [
      { label: "Launch App", href: APP_URL },
      { label: "Markets", href: `${APP_URL}/markets` },
      { label: "Dashboard", href: APP_URL },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Security Audit", href: "#" },
      { label: "GitHub", href: "https://github.com" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Twitter / X", href: "https://twitter.com" },
      { label: "Discord", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Risk Disclosure", href: "#" },
    ],
  },
];

const socials = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: FileText, href: "#", label: "Docs" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/8 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Top row: logo + socials */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-1">
            <a href="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-white">
                Quick<span className="text-gradient-primary">Lend</span>
              </span>
            </a>
            <p className="text-xs text-gray-600 pl-10">
              Non-custodial DeFi lending protocol
            </p>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={
                  href.startsWith("http") ? "noopener noreferrer" : undefined
                }
                aria-label={label}
                className="w-9 h-9 glass-panel rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} QuickLend. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            ⚠️ DeFi carries risk. Only supply assets you can afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
}
