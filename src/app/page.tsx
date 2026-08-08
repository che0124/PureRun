import React from 'react';
import { prisma } from '@/lib/db';
import FitnessTrendChart from '@/components/charts/FitnessTrendChart';
import ClientZoneChartWrapper from '@/components/charts/ClientZoneChartWrapper';
import ActivityCalendar from '@/components/ActivityCalendar';
import TabbedWidget from '@/components/TabbedWidget';

import {
  Flame,
  Gauge,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const allActivitiesAsc = await prisma.garminActivity.findMany({
    select: {
      activityId: true,
      date: true,
      distanceKm: true,
      durationMin: true,
      avgHr: true,
      // metricsData is explicitly excluded to prevent massive payload sizes and slow client-side rendering
    },
    orderBy: { date: 'asc' }
  });

  const stats = await prisma.garminStats.findUnique({ where: { id: 1 } });
  
  const fitnessData = [];
  let currentCtl = 0; 
  let currentAtl = 0; 
  
  if (allActivitiesAsc.length > 0) {
    const today = new Date();
    const firstActDate = new Date(allActivitiesAsc[0].date);
    const maxWarmupDate = new Date();
    maxWarmupDate.setDate(today.getDate() - 180);
    
    const startDate = firstActDate < maxWarmupDate ? maxWarmupDate : firstActDate;
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    const actsByDate = new Map<string, typeof allActivitiesAsc>();
    allActivitiesAsc.forEach(a => {
      const dObj = typeof a.date === 'string' ? new Date(a.date) : a.date;
      if (!dObj || isNaN(dObj.getTime())) return;
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const d = String(dObj.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      if (!actsByDate.has(dStr)) actsByDate.set(dStr, []);
      actsByDate.get(dStr)!.push(a);
    });
    
    for (let i = 0; i <= daysDiff; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayActs = actsByDate.get(dateStr) || [];
      let dailyTss = 0;
      
      dayActs.forEach(act => {
        const hrFactor = act.avgHr ? (act.avgHr / 150) : 1;
        dailyTss += (act.durationMin || 0) * Math.pow(hrFactor, 2) * 1.5; 
      });

      currentCtl = currentCtl + 0.0465 * (dailyTss - currentCtl);
      currentAtl = currentAtl + 0.25 * (dailyTss - currentAtl);
      
      if (daysDiff - i < 30) {
        fitnessData.push({
          date: dateStr,
          ctl: Number(currentCtl.toFixed(1)),
          atl: Number(currentAtl.toFixed(1)),
          tsb: Number((currentCtl - currentAtl).toFixed(1))
        });
      }
    }
  }

  let readinessScore = 100;
  let recoveryHours = 0;
  
  if (fitnessData.length > 0) {
    const todayFitness = fitnessData[fitnessData.length - 1];
    readinessScore = Math.min(100, Math.max(0, Math.round(85 + todayFitness.tsb * 1.5)));
    recoveryHours = Math.max(0, Math.round(todayFitness.atl * 0.5));
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-background relative text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 selection:text-emerald-50 overflow-hidden flex flex-col">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        
        {/* ================= LEFT COLUMN: Core Stats + Trend ================= */}
        <div className="flex-[3] flex flex-col gap-4 min-w-0 min-h-0">
          
          {/* Merged Core Stats */}
          <div className="shrink-0 bg-surface-hover/50 backdrop-blur-3xl rounded-[2rem] border border-border p-5 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-y-4 md:gap-y-0 divide-y md:divide-y-0 md:divide-x divide-border">
              
              {/* Volume */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-4 md:pt-0">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Flame className="w-4 h-4 text-[var(--text-accent)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">本週跑量</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] font-mono tracking-tight">{stats ? stats.weeklyKm : '--'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">km</span>
                </div>
              </div>

              {/* VDOT */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-4 md:pt-0">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">預估跑力</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] font-mono tracking-tight">{stats ? stats.estimatedVdot : '--'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">VDOT</span>
                </div>
              </div>

              {/* Pace */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-4 md:pt-0">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">近期均速</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] font-mono tracking-tight">{stats ? stats.avgPaceStr : '--'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">/km</span>
                </div>
              </div>

              {/* Readiness */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-4 md:pt-0">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">體能準備度</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-[var(--text-primary)] font-mono tracking-tight">{readinessScore}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">%</span>
                </div>
              </div>

              {/* Recovery */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-4 md:pt-0">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">建議恢復</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-rose-300 to-[var(--text-primary)] font-mono tracking-tight">{recoveryHours}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Hrs</span>
                </div>
              </div>

            </div>
          </div>

          {/* Fitness Trend Chart */}
          <div className="flex-1 bg-surface-hover/50 backdrop-blur-3xl rounded-[2rem] border border-border overflow-hidden flex min-h-0">
            <FitnessTrendChart data={fitnessData} />
          </div>

        </div>

        {/* ================= RIGHT COLUMN: Calendar & Zone Tabs ================= */}
        <div className="flex-[1.2] flex flex-col gap-4 min-w-0 min-h-0">
          
          <TabbedWidget
            tabs={[
              {
                name: '跑步月曆',
                content: <ActivityCalendar activities={allActivitiesAsc} />
              },
              {
                name: '心率分佈',
                content: <ClientZoneChartWrapper activities={allActivitiesAsc} />
              }
            ]}
          />

        </div>
      </div>
    </div>
  );
}
