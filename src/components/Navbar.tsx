'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import SyncGarminButton from './SyncGarminButton';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const isSingleActivity = pathname?.startsWith('/activity/') && pathname !== '/activity';

  if (isSingleActivity) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-border transition-all duration-300 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center group py-1">
          <div className="relative h-7 w-36">
            <Image
              src="/logo-text-two-tone.png"
              alt="PureRun"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {[
              { name: 'Dashboard', path: '/', icon: '◱' },
              { name: 'Training Plan', path: '/plan', icon: '⚡' },
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
                      ? 'text-[var(--text-accent)] bg-emerald-500/10' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-surface-hover'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 bottom-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                  <span className={`${isActive ? 'text-[var(--text-accent)]' : 'opacity-70'} text-[10px]`}>{item.icon}</span>
                  <span className="tracking-wide uppercase font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="h-6 w-px bg-border hidden md:block" />
          <ThemeToggle />
          <SyncGarminButton />
        </div>
      </div>
    </header>
  );
}
