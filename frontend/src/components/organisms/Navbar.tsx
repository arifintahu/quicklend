import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Wallet, Bell, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/markets': return 'Markets';
      case '/portfolio': return 'My Portfolio';
      case '/history': return 'History';
      case '/settings': return 'Settings';
      default: return 'QuickLend';
    }
  };

  const handleConnect = () => {
      setIsConnected(true);
  };

  const handleDisconnect = () => {
      setIsConnected(false);
      setIsDropdownOpen(false);
  };

  return (
    <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
            <p className="text-gray-400">Welcome back to QuickLend</p>
        </div>

        <div className="flex items-center gap-4">
            {/* Notification Bell (Mock) */}
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell size={20} className="text-gray-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#00C6FF] rounded-full border border-[#0B0E11]" />
            </button>

            {/* Wallet Button */}
            <div className="relative">
                {!isConnected ? (
                    <Button onClick={handleConnect} className="gap-2">
                        <Wallet size={18} />
                        Connect Wallet
                    </Button>
                ) : (
                    <div className="relative">
                        <motion.button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                0x
                            </div>
                            <div className="text-left hidden md:block">
                                <div className="text-sm font-bold text-white">0x12...34</div>
                                <div className="text-[10px] text-gray-400">Ethereum</div>
                            </div>
                            <ChevronDown size={16} className="text-gray-400" />
                        </motion.button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-48 bg-[#161A1E] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 glass-panel-strong"
                                >
                                    <div className="p-2">
                                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors">
                                            Copy Address
                                        </button>
                                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors">
                                            View on Etherscan
                                        </button>
                                        <div className="h-px bg-white/10 my-1" />
                                        <button 
                                            onClick={handleDisconnect}
                                            className="w-full text-left px-4 py-2 text-sm text-[#FF4B4B] hover:bg-[#FF4B4B]/10 rounded-lg transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};
