'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Settings, Activity } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isSingleActivity = pathname?.startsWith('/activity/') && pathname !== '/activity';

  if (isSingleActivity) {
    return null;
  }

  const navItems = [
    { name: '首頁', path: '/', icon: LayoutDashboard },
    { name: '訓練計畫', path: '/plan', icon: Zap },
    { name: '紀錄', path: '/activity', icon: Activity },
    { name: '設定', path: '/settings', icon: Settings }
  ];

  return (
    <>
      {/* Spacer to prevent content from being covered by fixed bottom nav on mobile */}
      <div className="md:hidden h-[calc(4.5rem+env(safe-area-inset-bottom,0px))] w-full pointer-events-none" />
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-md mx-auto flex justify-around items-center h-14 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex flex-col items-center justify-center pt-2.5 pb-1 w-16 h-full gap-1 transition-all duration-300 relative ${isActive ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} active:scale-95`}
              >
                {isActive && (
                  <div className="absolute -top-[1px] w-8 h-[2.5px] bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-105 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-sans tracking-wide transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

