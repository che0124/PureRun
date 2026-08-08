'use client';

import React from 'react';
import { 
  Heart, 
  Activity,
  ArrowRight,
  Route
} from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecentActivitiesList({ activities, isCompact = false }: { activities: any[], isCompact?: boolean }) {
  if (activities.length === 0) {
    return (
      <div className={`bg-[var(--input-bg)] backdrop-blur-3xl border border-border rounded-3xl ${isCompact ? 'p-6' : 'p-12'} text-center flex flex-col items-center justify-center min-h-[${isCompact ? '150px' : '300px'}] shadow-xl`}>
        <div className="text-[var(--text-accent)] mb-4 opacity-50 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
          <Activity className="w-10 h-10" />
        </div>
        <p className="font-sans text-[var(--text-muted)] text-sm tracking-wider">尚未同步任何活動紀錄</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isCompact ? 'gap-3' : 'gap-5'}`}>
      {activities.map((act) => (
        <Link
          href={`/activity/${act.activityId}`}
          key={act.activityId.toString()}
          className={`bg-[var(--input-bg)] backdrop-blur-xl border border-border rounded-[24px] ${isCompact ? 'p-4' : 'p-6 md:p-8'} flex flex-col ${isCompact ? '' : 'md:flex-row md:items-center'} justify-between group hover:bg-surface-hover hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden hover:shadow-[0_0_20px_-5px_rgba(52,211,153,0.15)] hover:-translate-y-0.5`}
        >
          {isCompact ? (
            // Compact Layout
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-surface-hover/50 border border-border flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300">
                  {act.activityTypeKey === 'running' ? (
                    <Route className="w-5 h-5 text-[var(--text-accent)] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  ) : (
                    <Activity className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-[var(--text-primary)] text-[15px] uppercase tracking-wider group-hover:text-[var(--text-accent)] transition-colors truncate max-w-[150px]">
                    {act.activityName}
                  </h3>
                  <span className="font-mono text-xs text-[var(--text-muted)] block mt-1 tracking-wide">
                    {new Date(act.date).toISOString().split('T')[0]}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right flex items-center gap-6">
                  <div className="flex flex-col">
                    <div className="font-mono text-lg font-bold text-[var(--text-primary)] flex items-baseline gap-1 justify-end">
                      {act.distanceKm} <span className="text-[10px] text-[var(--text-muted)] font-sans tracking-widest uppercase">km</span>
                    </div>
                  </div>
                  <div className="flex flex-col hidden sm:flex border-l border-border pl-6">
                    <div className="font-mono text-[15px] font-medium text-[var(--text-secondary)] flex items-baseline gap-1 justify-end">
                      {act.avgPaceStr ?? '--'} <span className="text-[10px] text-[var(--text-muted)] font-sans tracking-widest uppercase">/km</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-hover/50 border border-border flex items-center justify-center shrink-0 group-hover:bg-emerald-400 group-hover:border-emerald-400 transition-all duration-300 shadow-lg">
                  <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                </div>
              </div>
            </div>
          ) : (
            // Regular Layout (Original)
            <>
              {/* Left: Icon, Name and Date */}
              <div className="flex items-start gap-4 mb-6 md:mb-0 md:w-1/4">
                <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center shrink-0">
                  {act.activityTypeKey === 'running' ? (
                    <Route className="w-5 h-5 text-[var(--text-accent)]" />
                  ) : (
                    <Activity className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-[var(--text-primary)] text-base uppercase tracking-wide group-hover:text-[var(--text-accent)] transition-colors">
                    {act.activityName}
                  </h3>
                  <span className="font-mono text-xs text-[var(--text-muted)] mt-1 block">
                    {new Date(act.date).toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              {/* Middle: Core Stats (Distance, Pace, Time) */}
              <div className="flex items-center justify-between md:justify-start md:gap-16 flex-1 mb-6 md:mb-0">
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-[var(--text-muted)] mb-2">距離 <span className="text-[10px]">km</span></span>
                  <div className="font-mono text-4xl font-bold text-[var(--text-primary)]">
                    {act.distanceKm}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-[var(--text-muted)] mb-2">配速 <span className="text-[10px]">/km</span></span>
                  <div className="font-mono text-4xl font-bold text-[var(--text-primary)]">
                    {act.avgPaceStr ?? <span className="opacity-30">--</span>}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-[var(--text-muted)] mb-2">時間 <span className="text-[10px]">min</span></span>
                  <div className="font-mono text-4xl font-bold text-[var(--text-primary)]">
                    {act.durationMin}
                  </div>
                </div>
              </div>

              {/* Right: Secondary Stats (HR) and Action Button */}
              <div className="flex items-center justify-between md:justify-end md:w-1/5 gap-6">
                <div className="flex flex-col items-start md:items-end">
                  <span className="font-sans text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> 心率 <span className="text-[10px]">bpm</span>
                  </span>
                  <span className="font-mono text-2xl font-bold text-[var(--text-secondary)]">
                    {act.avgHr ?? <span className="opacity-30">--</span>}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-[var(--text-primary)] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                </div>
              </div>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
