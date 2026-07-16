'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Settings, Activity } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: '首頁', path: '/', icon: LayoutDashboard },
    { name: 'AI課表', path: '/plan', icon: Zap },
    { name: '紀錄', path: '/activity', icon: Activity },
    { name: '設定', path: '/settings', icon: Settings }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 relative ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-emerald-400 rounded-b-md shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-sans font-bold tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
