import React from 'react';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import { getPaceZones, formatPace, calculateVDOT } from '@/lib/science/vdot';
import FitnessTrendChart from '@/components/charts/FitnessTrendChart';
import TrainingLoadChart from '@/components/charts/TrainingLoadChart';
import MileageInteractiveCard from '@/components/MileageInteractiveCard';
import VdotInteractiveCard from '@/components/VdotInteractiveCard';
import RecentActivitiesList from '@/components/RecentActivitiesList';

import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
  Activity,
  BarChart2,
  History,
  CalendarDays
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const deviceId = await getDeviceId();

  let allActivitiesAsc: {
    activityId: bigint;
    date: Date;
    distanceKm: number;
    durationMin: number;
    avgHr: number | null;
    activityName: string;
    activityTypeKey: string;
    avgPaceStr: string | null;
  }[] = [];

  let stats: { weeklyKm: number; avgPaceStr: string; estimatedVdot: number; totalActivities: number } | null = null;
  let nextWorkout: any = null;
  let dbError = false;

  try {
    allActivitiesAsc = await prisma.garminActivity.findMany({
      where: { deviceId },
      select: {
        activityId: true,
        date: true,
        distanceKm: true,
        durationMin: true,
        avgHr: true,
        activityName: true,
        activityTypeKey: true,
        avgPaceStr: true,
      },
      orderBy: { date: 'asc' }
    });

    stats = await prisma.garminStats.findUnique({ where: { deviceId } });

    // Fetch the immediate next pending workout for the user
    nextWorkout = await prisma.workout.findFirst({
      where: {
        status: 'Pending',
        plan: {
          deviceId: deviceId
        }
      },
      orderBy: {
        date: 'asc'
      },
      include: {
        plan: true
      }
    });

  } catch (error) {
    console.warn('Dashboard: Database unreachable, showing empty state.');
    dbError = true;
  }

  // Calculate PMC and Daily TSS
  const fitnessData: { date: string; ctl: number; atl: number; tsb: number }[] = [];
  const trainingLoadData: { date: string; load: number }[] = [];
  let currentCtl = 0;
  let currentAtl = 0;
  let todayFitness: { ctl: number; atl: number; tsb: number } | null = null;

  if (allActivitiesAsc.length > 0) {
    const today = new Date();
    const firstActDate = new Date(allActivitiesAsc[0].date);
    const maxWarmupDate = new Date();
    maxWarmupDate.setDate(today.getDate() - 180);

    const startDate = firstActDate < maxWarmupDate ? maxWarmupDate : firstActDate;
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    const actsByDate = new Map<string, typeof allActivitiesAsc>();
    allActivitiesAsc.forEach((a: any) => {
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

      dayActs.forEach((act: any) => {
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

      // Store last 14 days for the Training Load (TRIMP) chart
      if (daysDiff - i < 14) {
        trainingLoadData.push({
          date: dateStr,
          load: dailyTss
        });
      }
    }

    if (fitnessData.length > 0) {
      todayFitness = fitnessData[fitnessData.length - 1];
    }
  }

  let calculatedWeeklyKm = 0;
  let calculatedMonthlyKm = 0;

  if (allActivitiesAsc.length > 0) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // Assuming Monday is the start of the week
    const dayOfWeek = today.getDay() || 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    allActivitiesAsc.forEach(act => {
      const dObj = typeof act.date === 'string' ? new Date(act.date) : act.date;
      if (act.activityTypeKey === 'running') {
        if (dObj >= startOfMonth) {
          calculatedMonthlyKm += act.distanceKm;
        }
        if (dObj >= startOfWeek) {
          calculatedWeeklyKm += act.distanceKm;
        }
      }
    });
  }

  const targetWeeklyKm = 50;
  const targetMonthlyKm = 200;

  // AI Prompt Logic based on TSB
  const tsbValue = todayFitness?.tsb ?? 0;
  const aiGreeting = "教練早報";
  let aiMessage = "請先同步您的 Garmin 數據，以獲得個人化的訓練分析。";
  if (todayFitness) {
    if (tsbValue < -10) {
      aiMessage = `目前訓練壓力平衡 (TSB) 為 ${tsbValue}，身體處於較疲勞的狀態。建議今天安排徹底休息或輕鬆的恢復跑，先避開高強度課表，給肌肉修復的時間。`;
    } else if (tsbValue > 10) {
      aiMessage = `目前訓練壓力平衡 (TSB) 為 ${tsbValue}，身體已充分恢復！今天非常適合挑戰高質量的間歇訓練或是長距離跑 (Long Run)。`;
    } else {
      aiMessage = `目前訓練壓力平衡 (TSB) 為 ${tsbValue}，身體處於穩定的適應期。請按表操課，若感覺狀況不錯，可以在訓練中段加入幾趟短衝刺 (Strides) 刺激神經。`;
    }

    // Add mileage progress context
    if (calculatedWeeklyKm > 0) {
      const remainingKm = targetWeeklyKm - calculatedWeeklyKm;
      if (remainingKm > 0) {
        aiMessage += `\n\n本週目前已累積 ${calculatedWeeklyKm.toFixed(1)} km，距離週目標還差 ${remainingKm.toFixed(1)} km，繼續保持好節奏！`;
      } else {
        aiMessage += `\n\n太棒了！本週跑量已達 ${calculatedWeeklyKm.toFixed(1)} km，提早達成訓練目標！`;
      }
    }
  }



  // Calculate dynamic VDOT based on best recent activity (last 90 days, >3km)
  let bestRecentVdot = 0;
  const vdotTrendData: { date: string; vdot: number; activityName: string }[] = [];

  if (allActivitiesAsc.length > 0) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    allActivitiesAsc.forEach(act => {
      const d = typeof act.date === 'string' ? new Date(act.date) : act.date;
      if (d >= ninetyDaysAgo && act.activityTypeKey === 'running' && act.distanceKm >= 3 && act.durationMin > 0) {
        const vdot = calculateVDOT(act.distanceKm * 1000, act.durationMin);
        if (vdot > bestRecentVdot) {
          bestRecentVdot = vdot;
        }

        // Push all valid VDOT computations to the trend chart data
        vdotTrendData.push({
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          vdot: Math.round(vdot * 10) / 10, // keep 1 decimal
          activityName: act.activityName
        });
      }
    });
  }

  const displayVdot = bestRecentVdot > 0 ? bestRecentVdot : (stats?.estimatedVdot ?? 0);

  let paceZonesObj = null;
  if (displayVdot > 0) {
    paceZonesObj = getPaceZones(displayVdot);
  }

  const getPaceString = (zoneKey: 'E' | 'M' | 'T' | 'I') => {
    if (!paceZonesObj) return "--:-- - --:--";
    const [fast, slow] = paceZonesObj[zoneKey];
    return `${formatPace(fast)} - ${formatPace(slow)}`;
  };

  const formattedPaceZones = [
    { label: 'E Pace (輕鬆)', pace: getPaceString('E'), color: 'text-blue-400', bg: 'hover:bg-blue-900/20' },
    { label: 'M Pace (馬拉松)', pace: getPaceString('M'), color: 'text-emerald-400', bg: 'hover:bg-emerald-900/20' },
    { label: 'T Pace (節奏)', pace: getPaceString('T'), color: 'text-amber-400', bg: 'hover:bg-amber-900/20' },
    { label: 'I Pace (間歇)', pace: getPaceString('I'), color: 'text-rose-400', bg: 'hover:bg-rose-900/20' },
  ];

  return (
    <main className="min-h-[100dvh] bg-neutral-950 relative text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 selection:text-emerald-50 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-6">
      {dbError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 text-center shrink-0">
          ⚠️ 無法連線至資料庫，目前顯示為空白狀態。請檢查網路連線或資料庫設定。
        </div>
      )}

      <div className="relative w-full sm:max-w-none lg:max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 pt-6 md:pt-8 flex flex-col gap-6 flex-1 h-full">

        {/* ======================= ROW 1 ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Card A: AI Coach Insight (Span 8) */}
          <div className="lg:col-span-8 card-glass p-6 flex flex-col group">
            <div className="flex items-center gap-4 mb-2 shrink-0">
              <div className="text-emerald-400 shrink-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-2 rounded-2xl group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-emerald-50 flex items-center gap-2.5">
                {aiGreeting}
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">教練洞察</span>
              </h2>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl whitespace-pre-wrap pl-[52px]">
                {aiMessage}
              </p>
            </div>
          </div>

          {/* Card B: Next Workout (Span 4) */}
          <div className="lg:col-span-4 card-glass p-6 flex flex-col relative group cursor-pointer">
            <div className="flex justify-between items-center h-8 mb-4 shrink-0">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-500" /> 即將到來
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20">
                {nextWorkout ? "Pending" : "無計畫"}
              </span>
            </div>

            {nextWorkout ? (
              <>
                <h3 className="text-xl font-bold text-white mb-1">{nextWorkout.title}</h3>
                <p className="text-xs text-neutral-400 line-clamp-1 mb-3">{nextWorkout.description}</p>
                <div className="mt-auto flex items-center justify-between text-sm">
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10 text-xs">
                    目標: {nextWorkout.targetPace || '輕鬆跑'}
                  </span>
                  <Link href="/plan" className="text-neutral-300 flex items-center gap-1 group-hover:text-white transition-colors text-xs">
                    詳情 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                <p className="mb-3 text-sm">目前沒有安排未來的訓練。</p>
                <Link href="/plan" className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  前往科學引擎排表
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ======================= ROW 2 ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[460px]">

          {/* Card C: PMC Fitness Chart (Span 8) */}
          <div className="lg:col-span-8 card-glass p-6 flex flex-col relative group h-full overflow-hidden min-h-[400px] lg:min-h-0">
            <div className="flex flex-wrap items-center justify-between min-h-[32px] mb-4 gap-2 z-10 relative shrink-0">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> 體能與疲勞 (PMC)
              </div>
              <div className="flex items-center gap-4 text-sm font-mono font-bold">
                <div className="flex items-center gap-2"><span className="text-neutral-500 text-[10px] tracking-wider">CTL</span> <span className="text-blue-400">{todayFitness?.ctl ?? '--'}</span></div>
                <div className="flex items-center gap-2"><span className="text-neutral-500 text-[10px] tracking-wider">ATL</span> <span className="text-rose-400">{todayFitness?.atl ?? '--'}</span></div>
                <div className="flex items-center gap-2"><span className="text-neutral-500 text-[10px] tracking-wider">TSB</span> <span className={(todayFitness?.tsb ?? 0) >= 0 ? 'text-emerald-400' : 'text-amber-400'}>{todayFitness?.tsb ?? '--'}</span></div>
              </div>
            </div>
            <div className="flex-1 w-full relative min-h-0 -mx-2">
              <div className="absolute inset-0 pb-2">
                <FitnessTrendChart data={fitnessData} />
              </div>
            </div>
          </div>

          {/* Card D: VDOT & Paces (Span 4) */}
          <VdotInteractiveCard
            currentVdot={displayVdot}
            paceZones={formattedPaceZones}
            trendData={vdotTrendData}
          />
        </div>

        {/* ======================= ROW 3 ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[360px]">

          {/* Card E: Mileage Progress (Span 4) */}
          <MileageInteractiveCard
            currentWeeklyKm={calculatedWeeklyKm}
            targetWeeklyKm={targetWeeklyKm}
            currentMonthlyKm={calculatedMonthlyKm}
            targetMonthlyKm={targetMonthlyKm}
          />

          {/* Card F: Training Load Trend (Span 4) */}
          <div className="lg:col-span-4 card-glass p-6 flex flex-col relative group h-full overflow-hidden min-h-[300px] lg:min-h-0">
            <div className="flex justify-between items-center h-8 mb-4 z-10 relative shrink-0">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-500" /> 訓練負荷 (TRIMP)
              </div>
              <span className="text-[10px] px-2 py-1 rounded-md bg-neutral-800 text-neutral-400">近 14 天</span>
            </div>
            <div className="flex-1 relative w-full h-full min-h-0 -mx-2">
              <div className="absolute inset-0 pb-2">
                <TrainingLoadChart data={trainingLoadData} />
              </div>
            </div>
          </div>

          {/* Card G: Recent Activities (Span 4) */}
          <div className="lg:col-span-4 card-glass p-6 flex flex-col relative group h-full overflow-hidden min-h-[300px] lg:min-h-0">
            <div className="flex justify-between items-center h-8 mb-4 shrink-0">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-500" /> 近期紀錄
              </div>
              <Link href="/activity" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group/link bg-emerald-500/10 px-2 py-1 rounded-md">
                查看全部 <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
              {allActivitiesAsc.length > 0 ? (
                <RecentActivitiesList activities={allActivitiesAsc.slice(-4).reverse()} isCompact={true} />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
                  尚無活動紀錄
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
