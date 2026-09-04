import React from 'react';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDurationHHMMSS } from '@/lib/formatters';

export const dynamic = 'force-dynamic';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Route,
  Timer,
  Heart,
  Activity,
  Flame,
  Footprints,
  TrendingUp,
  Gauge,
  Sparkles,
  Target,
  Share2,
  Maximize2
} from 'lucide-react';
import RealMapWrapper from '@/components/RealMapWrapper';
import ActivityMetricsChart, { TimeSeriesDataPoint } from '@/components/charts/ActivityMetricsChart';
import ClientActivityHrZones from '@/components/charts/ClientActivityHrZones';

import ActivityDetailTabs from '@/components/ActivityDetailTabs';
import ActivityDetailHeader from '@/components/ActivityDetailHeader';
import { BarChart3 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deviceId = await getDeviceId();

  let activity;
  let workout;

  try {
    activity = await prisma.garminActivity.findUnique({
      where: {
        deviceId_activityId: {
          deviceId,
          activityId: BigInt(id)
        }
      }
    });

    if (!activity) {
      return notFound();
    }

    // Fetch corresponding workout to show Target vs Actual
    workout = await prisma.workout.findFirst({
      where: {
        plan: { deviceId },
        actualActivityId: activity.activityId
      }
    });
  } catch (error) {
    console.warn('ActivityDetailPage: Database unreachable.');



    return (
      <div className="min-h-screen bg-background text-[var(--text-primary)] font-sans flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold">無法連線至資料庫</h1>
          <p className="text-[var(--text-secondary)] text-sm">請檢查網路連線或資料庫設定後重試。</p>
          <a href="/" className="inline-block mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-[var(--text-accent)] rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition">
            返回主控台
          </a>
        </div>
      </div>
    );
  }

  const isRun = activity.activityTypeKey === 'running';

  // --- Extract Real Time-Series Data for Charts ---
  let timeSeriesData: TimeSeriesDataPoint[] = [];

  if (activity.metricsData) {
    try {
      const metrics = JSON.parse(activity.metricsData);

      // Subsample to max 300 points for performance
      const step = Math.ceil(metrics.length / 300);
      const subsampled = metrics.filter((_: unknown, i: number) => i % step === 0);

      const totalDurationSec = (activity.durationMin || 0) * 60;
      const numPoints = metrics.length;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timeSeriesData = subsampled.map((m: any) => {
        // Try multiple common Garmin keys for altitude
        const el = m.elevation ?? m.altitude ?? m.enhancedAltitude ?? m.Elevation ?? m.Altitude ?? null;

        const originalIndex = parseInt(m.time || '0');
        const pointSec = Math.floor((originalIndex / Math.max(1, numPoints - 1)) * totalDurationSec);
        const h = Math.floor(pointSec / 3600);
        const min = Math.floor((pointSec % 3600) / 60);
        const sec = pointSec % 60;
        const timeStr = h > 0
          ? `${h}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
          : `${min}:${sec.toString().padStart(2, '0')}`;

        return {
          time: timeStr,
          hr: m.hr ?? null,
          pace: m.pace ?? null,
          elevation: el,
          cadence: m.cadence ?? null
        };
      });

      // HR data calculation removed since it is unused
    } catch (e) {
      console.error("Failed to parse metricsData", e);
    }
  }

  // Fallback if no detailed data (e.g. not synced yet)
  if (timeSeriesData.length === 0) {
    const baseHr = activity.avgHr || 145;
    const basePace = activity.avgPaceMinPerKm || 5.5;
    timeSeriesData = Array.from({ length: 60 }, (_, i) => ({
      time: `${i}m`,
      hr: baseHr + (i % 10) - 5,
      pace: basePace + (i % 5) * 0.1 - 0.25,
      elevation: 0,
      cadence: 165 + (i % 6) - 3
    }));
  }

  // We no longer calculate HR zones on the server because we need to read user credentials
  // from localStorage to get accurate user-defined heart rate zones. 
  // We delegate this to the ClientActivityHrZones component.

  const hasRoute = Boolean(activity.routeData && activity.routeData !== '[]' && activity.routeData !== 'null');

  const mapContent = hasRoute ? (
    <Link
      href={`/activity/${activity.activityId}/map`}
      className="group relative block w-full h-[220px] xs:h-[240px] sm:h-[280px] lg:h-full overflow-hidden border border-border/80 shadow-md hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all cursor-pointer isolate z-0"
      title="點擊查看完整地圖"
    >
      <div className="w-full h-full pointer-events-none">
        <RealMapWrapper
          routeData={activity.routeData as string}
          interactive={false}
          className="w-full h-full"
        />
      </div>

      {/* Floating Action Badge */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/80 text-[11px] font-bold text-[var(--text-primary)] shadow-md group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 group-hover:scale-105 transition-all">
        <Maximize2 className="w-3.5 h-3.5" />
        <span>查看完整地圖</span>
      </div>

      {/* Subtle hover overlay tint */}
      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors pointer-events-none" />
    </Link>
  ) : (
    <div className="w-full h-[220px] xs:h-[240px] sm:h-[280px] lg:h-full overflow-hidden border border-border isolate z-0">
      <RealMapWrapper
        routeData={activity.routeData as string}
        interactive={false}
        className="w-full h-full"
      />
    </div>
  );

  const overviewContent = (
    <div className="space-y-4 lg:space-y-6">
      {/* Top Hero Section: Side-by-Side (Left: Map, Right: Title & Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-stretch">
        {/* Left: Map Preview (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col h-[220px] xs:h-[240px] sm:h-[280px] lg:h-full">
          {mapContent}
        </div>

        {/* Right: Title & Dense Core Stats Dashboard (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 sm:gap-4 lg:gap-4 p-1">
          {/* 1. Header: Badge, Title & Date */}
          <div className="space-y-1.5 sm:space-y-2 border-b border-border/60 pb-2.5 sm:pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[var(--text-accent)] text-xs font-bold">
                {isRun ? <Route className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                <span>{isRun ? '跑步紀錄' : '運動紀錄'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>{new Date(activity.date).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              {activity.activityName}
            </h1>
          </div>

          {/* 2. Primary Highlights: Distance on top, Pace & Time below */}
          <div className="space-y-2.5 sm:space-y-3 py-0.5">
            {/* Distance */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Route className="w-4 h-4 text-emerald-500" /> 距離
              </span>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-6xl xs:text-7xl font-mono font-black text-[var(--text-primary)] tracking-tight leading-none">
                  {activity.distanceKm}
                </span>
                <span className="text-lg sm:text-xl font-bold text-[var(--text-secondary)]">km</span>
              </div>
            </div>

            {/* Pace & Duration (2 columns under distance) */}
            <div className="grid grid-cols-2 gap-4 pt-2.5 sm:pt-3 border-t border-border/40">
              {/* Avg Pace */}
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                  <Timer className="w-4 h-4 text-indigo-400" /> 配速
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl xs:text-4xl font-mono font-black text-[var(--text-primary)] tracking-tight">
                    {activity.avgPaceStr ?? '--'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)]">/km</span>
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-4 h-4 text-blue-500" /> 時間
                </span>
                <div className="flex items-baseline">
                  <span className="text-3xl xs:text-4xl font-mono font-black text-[var(--text-primary)] tracking-tight">
                    {formatDurationHHMMSS(activity.durationMin)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Secondary Detailed Metrics Grid (3x2 Dense Grid) */}
          <div className="grid grid-cols-3 gap-x-3 gap-y-3 sm:gap-y-3.5 pt-2.5 sm:pt-3 border-t border-border/60">
            {/* Heart Rate */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> 心率
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl xs:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {activity.avgHr ?? '--'}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">bpm</span>
              </div>
            </div>

            {/* Cadence */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Footprints className="w-3.5 h-3.5 text-amber-500" /> 步頻
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl xs:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {activity.cadence ?? '--'}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">spm</span>
              </div>
            </div>

            {/* Elevation */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 爬升
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl xs:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {activity.elevationGain ? Math.round(activity.elevationGain) : '--'}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">m</span>
              </div>
            </div>

            {/* Calories */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> 熱量
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl xs:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {activity.calories ?? '--'}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">kcal</span>
              </div>
            </div>

            {/* Stride Length */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> 步幅
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl xs:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {activity.strideLength ? (activity.strideLength / 100).toFixed(2) : '--'}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">m</span>
              </div>
            </div>

            {/* Training Load / TSS / VO2 */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> 負荷
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl xs:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {activity.trainingLoad ? activity.trainingLoad.toFixed(0) : (activity.trainingEffect ? (activity.trainingEffect * 25).toFixed(0) : (activity.vO2MaxValue ? activity.vO2MaxValue.toFixed(0) : '--'))}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {activity.trainingLoad ? 'TSS' : activity.trainingEffect ? 'TE' : activity.vO2MaxValue ? 'VO2' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Workout Plan Analysis (Integrated, compact, transparent) */}
          {workout && (
            <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-border/60">
              {/* Header: Title & Compliance Rate Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                    課表：{workout.title}
                  </span>
                </div>
                {workout.complianceRate != null && (
                  <span className={`font-mono text-xs font-bold shrink-0 px-2.5 py-0.5 rounded-full ${workout.complianceRate >= 90
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : workout.complianceRate >= 70
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                    達成率 {workout.complianceRate}%
                  </span>
                )}
              </div>

              {/* Compliance Progress Bar */}
              {workout.complianceRate != null && (
                <div className="w-full bg-surface-hover/80 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${workout.complianceRate >= 90
                        ? 'bg-emerald-500'
                        : workout.complianceRate >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    style={{ width: `${Math.min(100, Math.max(0, workout.complianceRate))}%` }}
                  />
                </div>
              )}

              {/* Target vs Actual Comparison Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-0.5 text-[var(--text-muted)]">
                <div className="flex items-center gap-1 truncate">
                  <span>目標配速</span>
                  <span className="font-mono font-bold text-[var(--text-secondary)]">
                    {workout.targetPace || '--'}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    (實: <span className="font-mono text-emerald-400 font-bold">{activity.avgPaceStr ?? '--'}</span>)
                  </span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <span>目標心率</span>
                  <span className="font-mono font-bold text-[var(--text-secondary)]">
                    {workout.targetHrZone ? `Zone ${workout.targetHrZone}` : '--'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const chartsContent = (
    <div className="space-y-6 md:space-y-8">
      <div className="card-glass flex flex-col overflow-hidden p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" /> 心率區間分佈
        </h2>
        <ClientActivityHrZones activity={activity} />
      </div>
      <div className="card-glass flex flex-col overflow-hidden">
        <div className="p-4 sm:p-6 pb-3 border-b border-border/50">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> 詳細數據序列
          </h2>
        </div>
        <div className="p-1 sm:p-2 md:p-3">
          <ActivityMetricsChart data={timeSeriesData} />
        </div>
      </div>
    </div>
  );

  const dynamicsContent = (
    <div className="space-y-6 md:space-y-8">
      <div className="card-glass p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-border/50 pb-3">
          <Heart className="w-5 h-5 text-rose-500" /> 心肺與負荷
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">平均心率</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.avgHr ?? '--'}</span>
              <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">bpm</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">最高心率</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.maxHr ?? '--'}</span>
              <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">bpm</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" /> 最大攝氧量
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.vO2MaxValue ?? '--'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> 訓練壓力(TSS)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                {activity.trainingLoad ? activity.trainingLoad.toFixed(1) : (activity.trainingEffect ? (activity.trainingEffect * 25).toFixed(1) : '--')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-glass p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-border/50 pb-3">
          <Footprints className="w-5 h-5 text-amber-500" /> 跑步動態與環境
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className={`flex flex-col gap-1 ${!activity.cadence ? 'opacity-40 grayscale' : ''} transition-opacity`}>
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">平均步頻</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.cadence ?? '--'}</span>
              <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">spm</span>
            </div>
          </div>
          <div className={`flex flex-col gap-1 ${!activity.strideLength ? 'opacity-40 grayscale' : ''} transition-opacity`}>
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">平均步幅</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.strideLength ? `${(activity.strideLength / 100).toFixed(2)}` : '--'}</span>
              <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">m</span>
            </div>
          </div>
          {activity.groundContactTime != null && (
            <div className="flex flex-col gap-1 transition-opacity">
              <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">觸地時間</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.groundContactTime}</span>
                <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">ms</span>
              </div>
            </div>
          )}
          {activity.verticalOscillation != null && (
            <div className="flex flex-col gap-1 transition-opacity">
              <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">垂直振幅</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.verticalOscillation}</span>
                <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">cm</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return (
    <div className="w-full min-h-full bg-background text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 selection:text-emerald-50">

      {/* Header Navigation */}
      <ActivityDetailHeader
        activityId={activity.activityId.toString()}
        activityName={activity.activityName}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
        <ActivityDetailTabs
          overviewContent={overviewContent}
          chartsContent={chartsContent}
          dynamicsContent={dynamicsContent}
        />
      </div>
    </div>
  );
}
