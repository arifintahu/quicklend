import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickLend — DeFi Lending Made Simple",
  description:
    "Supply crypto assets to earn algorithmic interest, or borrow against your holdings — all without giving up custody. Fast, safe, and built for everyone.",
  openGraph: {
    title: "QuickLend — DeFi Lending Made Simple",
    description:
      "Supply, borrow, and earn with real-time risk visualisation. No lock-ups. Non-custodial. Audited.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
