'use client';

import React from 'react';
import { 
  Heart, 
  Activity,
  ArrowRight,
  Route
} from 'lucide-react';
import Link from 'next/link';

export default function RecentActivitiesList({ activities, isCompact = false }: { activities: any[], isCompact?: boolean }) {
  if (activities.length === 0) {
    return (
      <div className={`bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] rounded-3xl ${isCompact ? 'p-6' : 'p-12'} text-center flex flex-col items-center justify-center min-h-[${isCompact ? '150px' : '300px'}] shadow-xl`}>
        <div className="text-emerald-400 mb-4 opacity-50 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
          <Activity className="w-10 h-10" />
        </div>
        <p className="font-sans text-slate-500 text-sm tracking-wider">尚未同步任何活動紀錄</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isCompact ? 'gap-3' : 'gap-5'}`}>
      {activities.map((act) => (
        <Link
          href={`/activity/${act.activityId}`}
          key={act.activityId.toString()}
          className={`bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[24px] ${isCompact ? 'p-4' : 'p-6 md:p-8'} flex flex-col ${isCompact ? '' : 'md:flex-row md:items-center'} justify-between group hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden hover:shadow-[0_0_20px_-5px_rgba(52,211,153,0.15)] hover:-translate-y-0.5`}
        >
          {isCompact ? (
            // Compact Layout
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300">
                  {act.activityTypeKey === 'running' ? (
                    <Route className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  ) : (
                    <Activity className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-100 text-[15px] uppercase tracking-wider group-hover:text-emerald-400 transition-colors truncate max-w-[150px]">
                    {act.activityName}
                  </h3>
                  <span className="font-mono text-xs text-slate-500 block mt-1 tracking-wide">
                    {act.date}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right flex items-center gap-6">
                  <div className="flex flex-col">
                    <div className="font-mono text-lg font-bold text-slate-100 flex items-baseline gap-1 justify-end">
                      {act.distanceKm} <span className="text-[10px] text-slate-500 font-sans tracking-widest uppercase">km</span>
                    </div>
                  </div>
                  <div className="flex flex-col hidden sm:flex border-l border-white/10 pl-6">
                    <div className="font-mono text-[15px] font-medium text-slate-300 flex items-baseline gap-1 justify-end">
                      {act.avgPaceStr ?? '--'} <span className="text-[10px] text-slate-500 font-sans tracking-widest uppercase">/km</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-400 group-hover:border-emerald-400 transition-all duration-300 shadow-lg">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-950" />
                </div>
              </div>
            </div>
          ) : (
            // Regular Layout (Original)
            <>
              {/* Left: Icon, Name and Date */}
              <div className="flex items-start gap-4 mb-6 md:mb-0 md:w-1/4">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0">
                  {act.activityTypeKey === 'running' ? (
                    <Route className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Activity className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-100 text-base uppercase tracking-wide group-hover:text-emerald-400 transition-colors">
                    {act.activityName}
                  </h3>
                  <span className="font-mono text-xs text-slate-500 mt-1 block">
                    {act.date}
                  </span>
                </div>
              </div>

              {/* Middle: Core Stats (Distance, Pace, Time) */}
              <div className="flex items-center justify-between md:justify-start md:gap-16 flex-1 mb-6 md:mb-0">
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-slate-500 mb-2">距離 <span className="text-[10px]">km</span></span>
                  <div className="font-mono text-4xl font-bold text-slate-100">
                    {act.distanceKm}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-slate-500 mb-2">配速 <span className="text-[10px]">/km</span></span>
                  <div className="font-mono text-4xl font-bold text-slate-100">
                    {act.avgPaceStr ?? <span className="opacity-30">--</span>}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-slate-500 mb-2">時間 <span className="text-[10px]">min</span></span>
                  <div className="font-mono text-4xl font-bold text-slate-100">
                    {act.durationMin}
                  </div>
                </div>
              </div>

              {/* Right: Secondary Stats (HR) and Action Button */}
              <div className="flex items-center justify-between md:justify-end md:w-1/5 gap-6">
                <div className="flex flex-col items-start md:items-end">
                  <span className="font-sans text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> 心率 <span className="text-[10px]">bpm</span>
                  </span>
                  <span className="font-mono text-2xl font-bold text-slate-300">
                    {act.avgHr ?? <span className="opacity-30">--</span>}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-950" />
                </div>
              </div>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
