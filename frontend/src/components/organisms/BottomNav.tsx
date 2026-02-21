'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Wallet, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: TrendingUp, label: 'Markets', href: '/markets' },
  { icon: Wallet, label: 'Portfolio', href: '/portfolio' },
  { icon: History, label: 'History', href: '/history' },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-panel border-t border-white/5 flex items-center justify-around px-2 py-2 safe-area-pb">
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 flex-1 py-1 rounded-xl transition-colors',
              isActive ? 'text-[#FFB800]' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[#FFB800]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
