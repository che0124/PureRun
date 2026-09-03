'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Settings, Activity } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: '首頁', path: '/', icon: LayoutDashboard },
    { name: '訓練計畫', path: '/plan', icon: Zap },
    { name: '紀錄', path: '/activity', icon: Activity },
    { name: '設定', path: '/settings', icon: Settings }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-2xl border-t border-border pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 relative ${isActive ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} active:scale-90`}
            >
              {isActive && (
                <div className="absolute top-0 w-6 h-[3px] bg-gradient-to-b from-emerald-400 to-transparent rounded-b-full opacity-80" />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-sans tracking-wide transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

