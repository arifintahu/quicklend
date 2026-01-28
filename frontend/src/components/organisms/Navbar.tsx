import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Wallet, Bell, ChevronDown, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_NOTIFICATIONS } from '@/lib/mock/notifications';

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
};

export const Navbar = () => {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAllAsRead = () => {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
      switch (type) {
          case 'warning': return <AlertTriangle size={16} className="text-[#FFB800]" />;
          case 'success': return <CheckCircle size={16} className="text-[#42e695]" />;
          case 'error': return <XCircle size={16} className="text-[#FF4B4B]" />;
          default: return <Info size={16} className="text-[#00C6FF]" />;
      }
  };

  return (
    <header className="flex justify-between items-center mb-8 relative z-50">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
            <p className="text-gray-400">Welcome back to QuickLend</p>
        </div>

        <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
                <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative"
                >
                    <Bell size={20} className="text-gray-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-[#00C6FF] rounded-full border border-[#0B0E11]" />
                    )}
                </button>

                <AnimatePresence>
                    {isNotificationsOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 bg-[#0B0E11] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-white/5">
                                <h3 className="font-bold text-white">Notifications</h3>
                                <button onClick={markAllAsRead} className="text-xs text-[#00C6FF] hover:text-[#00C6FF]/80">
                                    Mark all as read
                                </button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative ${!notification.read ? 'bg-white/[0.02]' : ''}`}>
                                            {!notification.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C6FF]" />
                                            )}
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-200 mb-1">{notification.title}</div>
                                                    <div className="text-xs text-gray-400 leading-relaxed mb-2">{notification.message}</div>
                                                    <div className="text-[10px] text-gray-500">{timeAgo(notification.timestamp)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                                    className="absolute right-0 mt-2 w-48 bg-[#0B0E11] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
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
