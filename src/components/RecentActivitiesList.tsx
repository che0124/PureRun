'use client';

import React from 'react';
import { 
  Heart, 
  Activity,
  ArrowRight,
  Route
} from 'lucide-react';
import Link from 'next/link';
import { formatDurationHHMMSS } from '@/lib/formatters';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecentActivitiesList({ activities, isCompact = false }: { activities: any[], isCompact?: boolean }) {
  if (!activities || activities.length === 0) {
    return (
      <div className={`card-glass flex flex-col items-center justify-center text-center ${isCompact ? 'p-6 min-h-[150px]' : 'p-6 md:p-8 min-h-[300px]'}`}>
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
          <Activity className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="font-sans text-[var(--text-muted)] text-sm tracking-wider">尚未同步任何活動紀錄</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isCompact ? 'gap-3' : 'gap-4'}`}>
      {activities.map((act) => (
        <Link
          href={`/activity/${act.activityId}`}
          key={act.activityId.toString()}
          className={`group w-full flex items-center gap-4 ${isCompact ? 'p-4' : 'p-4 md:p-6'} relative overflow-hidden card-glass`}
        >
          {/* Icon */}
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 transition-colors">
            {act.activityTypeKey === 'running' ? (
              <Route className="w-4 h-4 text-emerald-500" />
            ) : (
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </div>

          {/* Title & Date */}
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <h3 className="font-sans font-bold text-[var(--text-primary)] text-sm truncate group-hover:text-emerald-500 transition-colors">
              {act.activityName}
            </h3>
            <span className="font-mono text-[10px] text-[var(--text-muted)] truncate">
              {new Date(act.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 shrink-0 text-right">
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-0.5">
                <span className={`font-mono font-bold text-[var(--text-primary)] ${isCompact ? 'text-sm' : 'text-sm md:text-base'}`}>{act.distanceKm}</span>
                <span className="text-[9px] text-[var(--text-muted)]">km</span>
              </div>
            </div>
            
            {!isCompact && (
              <>
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-mono text-sm md:text-base font-bold text-[var(--text-secondary)]">{act.avgPaceStr ?? '--'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">/km</span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-mono text-sm md:text-base font-bold text-[var(--text-secondary)]">{formatDurationHHMMSS(act.durationMin)}</span>
                  </div>
                </div>
              </>
            )}

            <div className="w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors shrink-0 ml-1 hidden md:flex">
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-emerald-500" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

