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
  Share2
} from 'lucide-react';
import RealMapWrapper from '@/components/RealMapWrapper';
import ActivityMetricsChart, { TimeSeriesDataPoint } from '@/components/charts/ActivityMetricsChart';
import ClientActivityHrZones from '@/components/charts/ClientActivityHrZones';

import CircularProgress from '@/components/CircularProgress';
import ActivityDetailTabs from '@/components/ActivityDetailTabs';
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

  const mapContent = (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-border/50 shadow-sm relative z-0">
      <RealMapWrapper routeData={activity.routeData as string} />
    </div>
  );

  const overviewContent = (
    <div className="space-y-8">
        {/* Map Section */}
        {mapContent}

        {/* Primary Core Stats (Hero) */}
        <div className="flex flex-wrap items-center gap-x-8 md:gap-x-16 lg:gap-x-20 gap-y-8 pt-2">
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <Route className="w-4 h-4 text-emerald-500" /> 總距離
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.distanceKm}</span>
                <span className="text-sm text-[var(--text-secondary)] font-sans font-bold">km</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-indigo-400" /> 平均配速
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.avgPaceStr ?? '--'}</span>
                <span className="text-sm text-[var(--text-secondary)] font-sans font-bold">/km</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> 持續時間
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{formatDurationHHMMSS(activity.durationMin)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" /> 總爬升
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.elevationGain ? Math.round(activity.elevationGain) : '--'}</span>
                <span className="text-sm text-[var(--text-secondary)] font-sans font-bold">m</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" /> 消耗熱量
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{activity.calories ?? '--'}</span>
                <span className="text-sm text-[var(--text-secondary)] font-sans font-bold">kcal</span>
              </div>
            </div>
        </div>

        {/* Target vs Actual Comparison */}
        {workout && (
          <div className="group card-glass p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex-1 space-y-4 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[var(--text-accent)] border border-emerald-500/20">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI 課表執行分析</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{workout.title}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest block mb-1">配速表現 (預期 vs 實際)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-[var(--text-secondary)] line-through decoration-[var(--text-muted)]">{workout.targetPace || '--'}</span>
                    <span className="text-2xl font-mono font-extrabold text-[var(--text-accent)]">{activity.avgPaceStr}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest block mb-1">心率區間 (預期 vs 實際)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-[var(--text-secondary)] line-through decoration-[var(--text-muted)]">Z{workout.targetHrZone || '-'}</span>
                    <span className="text-2xl font-mono font-extrabold text-rose-400">{activity.avgHr} bpm</span>
                  </div>
                </div>
              </div>
            </div>

            {workout.complianceRate != null && (
              <div className="shrink-0 relative z-10 mt-4 md:mt-0">
                <CircularProgress
                  value={workout.complianceRate}
                  max={100}
                  size={100}
                  strokeWidth={8}
                  label="課表達成率"
                  color={workout.complianceRate >= 90 ? "text-[var(--text-accent)]" : workout.complianceRate >= 70 ? "text-amber-400" : "text-rose-400"}
                />
              </div>
            )}
          </div>
        )}

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
    </div>
  );

  const chartsContent = (
    <div className="space-y-8">
        <div className="card-glass flex flex-col overflow-hidden p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" /> 心率區間分佈
            </h2>
            <ClientActivityHrZones activity={activity} />
        </div>
        <div className="card-glass flex flex-col overflow-hidden p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> 詳細數據序列
            </h2>
            <ActivityMetricsChart data={timeSeriesData} />
        </div>
    </div>
  );

  const dynamicsContent = (
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
  );
  return (
    <div className="min-h-screen bg-background text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 selection:text-emerald-50">

      {/* Header Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-sans font-bold text-sm tracking-wider uppercase">返回主控台</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-[10px] px-2.5 py-1 rounded bg-surface text-[var(--text-secondary)] border border-border uppercase tracking-widest font-mono">
              ID: {activity.activityId.toString()}
            </div>
            <Link 
              href={`/activity/${activity.activityId}/share`}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-[var(--text-accent)] rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition-all"
            >
              <Share2 className="w-4 h-4" />
              分享
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-10">

        {/* Title Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[var(--text-accent)]">
            {isRun ? <Route className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isRun ? '跑步紀錄' : '運動紀錄'}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
            {activity.activityName}
          </h1>
          <div className="flex items-center gap-2 text-[var(--text-secondary)] font-mono text-sm">
            <Calendar className="w-4 h-4" />
            {new Date(activity.date).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })}
          </div>
        </div>


  <ActivityDetailTabs 
          overviewContent={overviewContent}
          chartsContent={chartsContent}
          dynamicsContent={dynamicsContent}
        />
      </div>
    </div>
  );
}
