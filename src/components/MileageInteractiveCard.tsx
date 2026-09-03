'use client';

import React, { useState } from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import MileageRingChart from './charts/MileageRingChart';

interface MileageInteractiveCardProps {
  currentWeeklyKm: number;
  targetWeeklyKm: number;
  currentMonthlyKm: number;
  targetMonthlyKm: number;
}

export default function MileageInteractiveCard({
  currentWeeklyKm,
  targetWeeklyKm,
  currentMonthlyKm,
  targetMonthlyKm
}: MileageInteractiveCardProps) {
  const [viewMode, setViewMode] = useState<'週' | '月'>('週');

  const current = viewMode === '週' ? currentWeeklyKm : currentMonthlyKm;
  const target = viewMode === '週' ? targetWeeklyKm : targetMonthlyKm;

  return (
    <div className="lg:col-span-4 card-glass p-6 flex flex-col relative group h-full min-h-[300px] lg:min-h-0">
      
      {/* Title & Toggle */}
      <div className="flex justify-between items-center h-8 mb-4 shrink-0 z-10">
        <Link href="/calendar" className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 hover:text-emerald-400 transition-colors group/link">
          <Flame className="w-4 h-4 text-emerald-500" /> 跑量追蹤
          <ArrowRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" />
        </Link>
        <div className="flex gap-1 bg-neutral-950 p-1 rounded-full border border-neutral-800 cursor-pointer">
          <button 
            onClick={(e) => { e.preventDefault(); setViewMode('週'); }}
            className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors ${viewMode === '週' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-500 hover:text-white'}`}
          >
            週
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); setViewMode('月'); }}
            className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors ${viewMode === '月' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-500 hover:text-white'}`}
          >
            月
          </button>
        </div>
      </div>
      
      {/* Chart - Click to navigate to calendar */}
      <Link href="/calendar" className="flex-1 relative w-full h-full min-h-0 -mx-2 block cursor-pointer group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all">
        <div className="absolute inset-0 pb-4 pointer-events-none">
          <MileageRingChart current={current} target={target} label={viewMode} />
        </div>
      </Link>

    </div>
  );
}
