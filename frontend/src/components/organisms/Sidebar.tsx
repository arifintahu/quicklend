import React from 'react';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, TrendingUp, Wallet, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, x: 5 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl w-full transition-all duration-300 relative overflow-hidden group",
        active ? "text-white" : "text-gray-400 hover:text-white"
      )}
    >
      {active && (
        <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <div className={cn(
          "relative z-10 flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          active ? "bg-gradient-to-br from-[#00C6FF] to-[#0072FF] shadow-[0_0_15px_rgba(0,198,255,0.4)]" : "bg-white/5 group-hover:bg-white/10"
      )}>
        <Icon size={20} className={active ? "text-white" : "text-gray-400 group-hover:text-white"} />
      </div>
      
      <span className="relative z-10 font-medium hidden md:block">{label}</span>
    </motion.button>
  );
};

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 glass-panel border-r border-white/5 flex flex-col p-4 z-50">
      <div className="flex items-center gap-3 px-2 mb-12 mt-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white fill-white" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight hidden md:block bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            QuickLend
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={TrendingUp} label="Markets" />
        <SidebarItem icon={Wallet} label="My Portfolio" />
        <SidebarItem icon={Settings} label="Settings" />
      </nav>

      <div className="mt-auto">
        <div className="glass-panel p-4 rounded-xl">
             <div className="text-xs text-gray-400 mb-2">Connected Wallet</div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#42e695] animate-pulse" />
                <span className="font-mono text-sm text-white">0x12...34</span>
             </div>
        </div>
      </div>
    </aside>
  );
};
