import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Zap, Wallet } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="w-full h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/10 backdrop-blur-md bg-[#0B0E11]/80 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-[#00F0FF]/10 rounded-lg flex items-center justify-center border border-[#00F0FF]/30">
            <Zap className="text-[#00F0FF]" fill="#00F0FF" />
        </div>
        <span className="text-xl font-bold tracking-tight">QuickLend</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-medium">
            <a href="#" className="text-white hover:text-[#00F0FF] transition-colors">Dashboard</a>
            <a href="#" className="hover:text-[#00F0FF] transition-colors">Markets</a>
            <a href="#" className="hover:text-[#00F0FF] transition-colors">Governance</a>
        </div>
        
        <Button size="sm" variant="ghost" className="gap-2 font-mono">
            <Wallet size={16} />
            0x12...34
            <span className="w-2 h-2 rounded-full bg-[#00FF41]" />
        </Button>
      </div>
    </nav>
  );
};
