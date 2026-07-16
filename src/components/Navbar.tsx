'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SyncGarminButton from './SyncGarminButton';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-40 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all">
            <span className="text-white font-mono font-bold text-sm">PR</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-slate-50 text-lg tracking-wide leading-none group-hover:text-emerald-400 transition-colors">
              PureRun<span className="text-emerald-450">_</span>AI
            </span>
            <span className="font-mono text-[9px] text-emerald-455/70 tracking-[0.2em] uppercase mt-0.5">
              Sync. Analyze. Evolve.
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {[
              { name: 'Dashboard', path: '/', icon: '◱' },
              { name: 'AI Plan', path: '/plan', icon: '⚡' },
              { name: 'Records', path: '/activity', icon: '🏃' },
              { name: 'Settings', path: '/settings', icon: '⚙' }
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path}
                  href={item.path} 
                  className={`relative flex items-center gap-1.5 text-xs sm:text-sm font-mono transition-all py-2 px-3 sm:px-4 rounded-md overflow-hidden ${
                    isActive 
                      ? 'text-emerald-400 bg-emerald-500/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 bottom-0 w-full h-[2px] bg-emerald-405 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                  <span className={`${isActive ? 'text-emerald-400' : 'opacity-70'} text-[10px]`}>{item.icon}</span>
                  <span className="tracking-wide uppercase font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="h-6 w-px bg-slate-800 hidden md:block" />
          <SyncGarminButton />
        </div>
      </div>
    </nav>
  );
}
