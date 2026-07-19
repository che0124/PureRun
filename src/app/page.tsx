import React from 'react';
import { prisma } from '@/lib/db';
import TodayWorkoutDashboard from '@/components/TodayWorkoutDashboard';
import RecentActivitiesList from '@/components/RecentActivitiesList';
import FitnessTrendChart from '@/components/charts/FitnessTrendChart';
import ClientZoneChartWrapper from '@/components/charts/ClientZoneChartWrapper';

import Link from 'next/link';
import {
  Flame,
  Gauge,
  Activity,
  TrendingUp,
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure it fetches fresh from DB

export default async function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs/promises');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allActivitiesAsc: any[] = [];
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const cacheFile = path.join(dataDir, 'activities.json');
    const cacheData = await fs.readFile(cacheFile, 'utf-8');
    const activities = JSON.parse(cacheData);
    if (Array.isArray(activities)) {
      // activities.json 是從新到舊排列，反轉為從舊到新 (asc) 以符合後續圖表需求
      allActivitiesAsc = activities.reverse();
    }
  } catch {
    // 若沒有 JSON 快取，可以 fall back 到 DB
    allActivitiesAsc = await prisma.garminActivity.findMany({
      orderBy: { date: 'asc' }
    });
  }

  // 保留從 DB 讀取 stats 以顯示儀表板數據
  const stats = await prisma.garminStats.findUnique({ where: { id: 1 } });
  
  // Use last 10 activities for zone chart to show meaningful distribution
  const chartActivities = [...allActivitiesAsc].reverse().slice(0, 10);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayWorkout = await prisma.workout.findFirst({
    where: { date: todayStr }
  });

  // Map database Workout model to TodayWorkoutDashboard Workout interface
  const todayWorkoutPayload = todayWorkout ? {
    date: todayWorkout.date,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workout_type: todayWorkout.workoutType as any,
    title: todayWorkout.title,
    target_pace: todayWorkout.targetPace || undefined,
    target_hr_zone: todayWorkout.targetHrZone || undefined,
    description: todayWorkout.description,
    status: todayWorkout.status
  } : null;



  // Calculate real Fitness Trend (CTL/ATL/TSB) starting from the oldest activity to properly warm up the EMA
  const fitnessData = [];
  let currentCtl = 0; 
  let currentAtl = 0; 
  
  if (allActivitiesAsc.length > 0) {
    const today = new Date();
    // Start EMA warmup from either the first activity or 180 days ago (max historical warmup window)
    const firstActDate = new Date(allActivitiesAsc[0].date);
    const maxWarmupDate = new Date();
    maxWarmupDate.setDate(today.getDate() - 180);
    
    const startDate = firstActDate < maxWarmupDate ? maxWarmupDate : firstActDate;
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayActs = allActivitiesAsc.filter(a => a.date === dateStr);
      let dailyTss = 0;
      
      dayActs.forEach(act => {
        const hrFactor = act.avgHr ? (act.avgHr / 150) : 1;
        // TSS calculation approximation
        dailyTss += (act.durationMin) * Math.pow(hrFactor, 2) * 1.5; 
      });

      // Exponential Moving Average
      // CTL (42 days) alpha = 2/(42+1) = 0.0465
      // ATL (7 days) alpha = 2/(7+1) = 0.25
      currentCtl = currentCtl + 0.0465 * (dailyTss - currentCtl);
      currentAtl = currentAtl + 0.25 * (dailyTss - currentAtl);
      
      // Only keep the last 30 days for the chart display
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

  // Fallback if no recent data
  if (fitnessData.length === 0) {
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      fitnessData.push({
        date: dateStr,
        ctl: 0,
        atl: 0,
        tsb: 0
      });
    }
  }

  // --- REAL DATA FOR READINESS & RECOVERY ---
  let readinessScore = 100;
  let recoveryHours = 0;
  
  if (fitnessData.length > 0) {
    const todayFitness = fitnessData[fitnessData.length - 1];
    // TSB (Training Stress Balance) typically ranges from -30 to +20.
    // TSB = 0 means neutral (Readiness ~ 85)
    // TSB > 10 means very fresh (Readiness > 95)
    // TSB < -20 means heavily fatigued (Readiness < 50)
    readinessScore = Math.min(100, Math.max(0, Math.round(85 + todayFitness.tsb * 1.5)));
    
    // ATL (Acute Training Load) represents short-term fatigue.
    // Roughly, ATL of 50 might mean ~24 hours of recovery needed.
    recoveryHours = Math.max(0, Math.round(todayFitness.atl * 0.5));
  }

  // Use 3 most recent activities for the spacious list instead of 1
  const recentActivitiesList = [...allActivitiesAsc].reverse().slice(0, 3);

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-fade-up space-y-12 md:space-y-16">
        
        {/* ================= SECTION 1: CORE STATS ================= */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Widget 1: Volume */}
            <div className="group relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 hover:bg-white/[0.04] transition-all duration-500 border border-white/[0.05] hover:border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.2)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]">
                  <Flame className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">本週跑量</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 font-mono tracking-tight">{stats ? stats.weeklyKm : '--'}</span>
                    <span className="text-xs text-slate-500 font-medium">/ 40km</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Widget 2: VDOT */}
            <div className="group relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 hover:bg-white/[0.04] transition-all duration-500 border border-white/[0.05] hover:border-blue-500/30 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-900/20 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]">
                  <TrendingUp className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">預估跑力</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 font-mono tracking-tight">{stats ? stats.estimatedVdot : '--'}</span>
                    <span className="text-xs text-slate-500 font-medium">VDOT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 3: Pace */}
            <div className="group relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 hover:bg-white/[0.04] transition-all duration-500 border border-white/[0.05] hover:border-amber-500/30 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/20 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
                  <Gauge className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">近期均速</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 font-mono tracking-tight">{stats ? stats.avgPaceStr : '--'}</span>
                    <span className="text-xs text-slate-500 font-medium">/km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 4: Readiness */}
            <div className="group relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 hover:bg-white/[0.04] transition-all duration-500 border border-white/[0.05] hover:border-purple-500/30 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/20 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]">
                  <Activity className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">體能準備度</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 font-mono tracking-tight">{readinessScore}</span>
                    <span className="text-xs text-slate-500 font-medium">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 5: Recovery */}
            <div className="group relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 hover:bg-white/[0.04] transition-all duration-500 border border-white/[0.05] hover:border-rose-500/30 hover:shadow-[0_0_30px_-10px_rgba(244,63,94,0.2)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-900/20 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]">
                  <Clock className="w-6 h-6 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">建議恢復時間</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 font-mono tracking-tight">{recoveryHours}</span>
                    <span className="text-xs text-slate-500 font-medium">小時</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: TODAY'S ACTION ================= */}
        <section className="space-y-6 relative">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-50 tracking-wide">
              今日訓練與 AI 建議
            </h2>
          </div>
          <TodayWorkoutDashboard
            workout={todayWorkoutPayload}
          />
        </section>

        {/* ================= SECTION 3 & 4: CHARTS AND LIST ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column: Charts (60%) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="font-sans text-xl font-bold text-slate-50 tracking-wide">
                進階趨勢分析
              </h2>
            </div>
            <div className="space-y-6">
              <div className="w-full bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 md:p-8 border border-white/[0.05] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
                <FitnessTrendChart data={fitnessData} />
              </div>
              <div className="w-full bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-5 md:p-8 border border-white/[0.05] shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
                <ClientZoneChartWrapper activities={chartActivities} />
              </div>
            </div>
          </div>

          {/* Right Column: Recent Activities (40%) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="font-sans text-xl font-bold text-slate-50 tracking-wide">
                  近期活動紀錄
                </h2>
              </div>
              <Link href="/activity" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20">
                查看全部 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <RecentActivitiesList 
              isCompact={true}
              activities={recentActivitiesList.map(a => ({
                ...a,
                activityId: Number(a.activityId)
              }))} 
            />
          </div>
          
        </section>

      </div>
    </div>
  );
}
