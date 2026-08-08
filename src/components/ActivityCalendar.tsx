'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { loadCredentials } from '@/lib/credentials';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activities: any[];
}

export default function ActivityCalendar({ activities }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [targetDateStr, setTargetDateStr] = useState<string>('');

  useEffect(() => {
    const creds = loadCredentials();
    if (creds.targetDate) {
      setTargetDateStr(creds.targetDate);
    }
  }, []);

  const { daysInMonth, emptyDaysAtStart, monthData } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Day of week of the 1st day (0 = Sunday)
    const firstDay = new Date(year, month, 1);
    const emptyDaysAtStart = firstDay.getDay();

    // Group activities by date
    const dataMap = new Map<string, number>();
    activities.forEach(act => {
      let dObj = typeof act.date === 'string' ? new Date(act.date) : act.date;
      if (dObj && !isNaN(dObj.getTime())) {
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        const actDateStr = `${y}-${m}-${d}`;
        const currentDist = dataMap.get(actDateStr) || 0;
        dataMap.set(actDateStr, currentDist + (act.distanceKm || 0));
      }
    });

    const monthData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      monthData.push({
        day: d,
        dateStr,
        distance: dataMap.get(dateStr) || 0
      });
    }

    return { daysInMonth, emptyDaysAtStart, monthData };
  }, [currentDate, activities]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 bg-[var(--input-bg)] rounded-full px-2 py-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-surface-hover rounded-full transition-colors">
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <span className="text-sm font-bold text-[var(--text-accent)] w-20 text-center">
            {currentDate.getFullYear()} {monthNames[currentDate.getMonth()]}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-surface-hover rounded-full transition-colors">
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-[var(--text-muted)] py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 flex-1">
        {Array.from({ length: emptyDaysAtStart }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-xl bg-[var(--input-bg)]" />
        ))}
        {monthData.map(dayInfo => {
          const hasRun = dayInfo.distance > 0;
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const isToday = todayStr === dayInfo.dateStr;
          const isRaceDay = targetDateStr === dayInfo.dateStr;
          
          let intensityClass = 'bg-[var(--input-bg)] border-transparent hover:bg-surface-hover text-[var(--text-primary)]';
          if (hasRun) {
            if (dayInfo.distance >= 15) {
              intensityClass = 'bg-emerald-500/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-[var(--text-primary)]';
            } else if (dayInfo.distance >= 8) {
              intensityClass = 'bg-emerald-500/25 border-emerald-500/30 text-[var(--text-primary)]';
            } else {
              intensityClass = 'bg-emerald-500/15 border-emerald-500/20 text-[var(--text-primary)]';
            }
          } else if (isRaceDay) {
            intensityClass = 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-amber-600 dark:text-amber-400';
          }

          return (
            <div 
              key={dayInfo.day} 
              className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${intensityClass} ${isToday ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-background' : ''}`}
            >
              {isRaceDay && (
                <div className="absolute -top-1.5 -right-1.5 z-10 bg-background rounded-full">
                  <Target className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                </div>
              )}
              <span className={`text-xs font-mono font-medium ${hasRun ? 'opacity-80' : isRaceDay ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'}`}>
                {dayInfo.day}
              </span>
              {hasRun && (
                <span className="text-[10px] font-bold font-mono mt-0.5">
                  {dayInfo.distance.toFixed(1)}
                </span>
              )}
              {isRaceDay && !hasRun && (
                <span className="text-[9px] font-bold mt-0.5 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  RACE
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
