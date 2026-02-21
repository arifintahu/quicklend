import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, TrendingUp, Wallet, Settings, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const SidebarItem = ({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="block w-full">
        <motion.div
        whileHover={{ scale: 1.05, x: 5 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
            "flex items-center gap-3 p-3 rounded-xl w-full transition-all duration-300 relative overflow-hidden group",
            isActive ? "text-white" : "text-gray-400 hover:text-white"
        )}
        >
        {isActive && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        )}
        
        <div className={cn(
            "relative z-10 flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
            isActive ? "bg-gradient-to-br from-[#00C6FF] to-[#0072FF] shadow-[0_0_15px_rgba(0,198,255,0.4)]" : "bg-white/5 group-hover:bg-white/10"
        )}>
            <Icon size={20} className={isActive ? "text-white" : "text-gray-400 group-hover:text-white"} />
        </div>
        
        <span className="relative z-10 font-medium hidden md:block">{label}</span>
        </motion.div>
    </Link>
  );
};

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 glass-panel border-r border-white/5 hidden md:flex flex-col p-4 z-50">
      <div className="flex items-center gap-3 px-2 mb-12 mt-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white fill-white" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight hidden md:block bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            QuickLend
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" />
        <SidebarItem icon={TrendingUp} label="Markets" href="/markets" />
        <SidebarItem icon={Wallet} label="My Portfolio" href="/portfolio" />
        <SidebarItem icon={History} label="History" href="/history" />
        <SidebarItem icon={Settings} label="Settings" href="/settings" />
      </nav>
    </aside>
  );
};
