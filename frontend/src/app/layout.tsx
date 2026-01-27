import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickLend",
  description: "Hyper-Modern DeFi Lending Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased min-h-screen relative overflow-x-hidden`}
      >
        {/* Ambient Background Orbs */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="fixed top-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none" />
        
        {/* Noise Texture Overlay (Optional for grit) */}
        <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
