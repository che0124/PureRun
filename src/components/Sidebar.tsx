'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import SyncGarminButton from './SyncGarminButton';
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, CalendarDays, Activity, Settings, Target } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const isSingleActivity = pathname?.startsWith('/activity/') && pathname !== '/activity';

  if (isSingleActivity) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Training Plan', path: '/plan', icon: CalendarDays },
    { name: 'Activities', path: '/activity', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-surface/50 backdrop-blur-xl border-r border-border/60 p-4">
      {/* Logo */}
      <Link href="/" className="flex flex-col px-3 mb-8 mt-2 group">
        <div className="relative h-7 w-36 mb-1">
          <Image
            src="/logo-text-two-tone.png"
            alt="PureRun"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <span className="text-[10px] font-mono tracking-wider uppercase font-bold whitespace-nowrap">
          SYNC. ANALYZE. EVOLVE.
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-sans font-medium text-sm group ${isActive
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'text-[var(--text-secondary)] hover:bg-surface-hover hover:text-[var(--text-primary)] border border-transparent'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'opacity-70 group-hover:opacity-100'} transition-opacity`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4 border-t border-border/50 pt-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
        <SyncGarminButton variant="full" />
      </div>
    </aside>
  );
}
