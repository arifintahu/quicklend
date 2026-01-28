"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { motion } from 'framer-motion';
import { Bell, Globe, DollarSign, ShieldAlert, Zap } from 'lucide-react';

// Simple Toggle Component
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 relative ${checked ? 'bg-[#00C6FF]' : 'bg-gray-700'}`}
    >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
);

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
      liquidation: true,
      apySpikes: false,
      newsletter: true
  });

  const [currency, setCurrency] = useState('USD');

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
        <Navbar />
        
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Preferences */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-[#00C6FF]" />
                    Global Preferences
                </h3>
                <GlassCard className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold">Display Currency</div>
                            <div className="text-sm text-gray-400">Select your preferred currency for display</div>
                        </div>
                        <div className="flex bg-black/20 p-1 rounded-lg">
                            {['USD', 'EUR', 'GBP'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currency === c ? 'bg-[#00C6FF] text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold">Language</div>
                            <div className="text-sm text-gray-400">Platform language</div>
                        </div>
                        <select className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00C6FF]">
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>Chinese</option>
                        </select>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Notifications */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Bell size={20} className="text-[#FFB800]" />
                    Notifications
                </h3>
                <GlassCard className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FF4B4B]/10 flex items-center justify-center text-[#FF4B4B]">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <div className="font-bold">Liquidation Risk</div>
                                <div className="text-sm text-gray-400">Alert when Health Factor drops below 1.5</div>
                            </div>
                        </div>
                        <Toggle 
                            checked={notifications.liquidation} 
                            onChange={() => setNotifications({...notifications, liquidation: !notifications.liquidation})} 
                        />
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#42e695]/10 flex items-center justify-center text-[#42e695]">
                                <Zap size={20} />
                            </div>
                            <div>
                                <div className="font-bold">APY Spikes</div>
                                <div className="text-sm text-gray-400">Alert when Supply APY exceeds 10%</div>
                            </div>
                        </div>
                        <Toggle 
                            checked={notifications.apySpikes} 
                            onChange={() => setNotifications({...notifications, apySpikes: !notifications.apySpikes})} 
                        />
                    </div>
                </GlassCard>
            </motion.div>
        </div>
      </main>
    </>
  );
}
