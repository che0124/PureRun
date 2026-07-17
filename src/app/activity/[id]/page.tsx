import React from 'react';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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
  Target
} from 'lucide-react';
import RealMapWrapper from '@/components/RealMapWrapper';
import ActivityMetricsChart, { TimeSeriesDataPoint } from '@/components/charts/ActivityMetricsChart';
import ClientActivityHrZones from '@/components/charts/ClientActivityHrZones';
import AiAnalysisButton from '@/components/AiAnalysisButton';
import CircularProgress from '@/components/CircularProgress';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;

  let activityIdBigInt: bigint;
  try {
    activityIdBigInt = BigInt(id);
  } catch (error) {
    return notFound();
  }

  const activity = await prisma.garminActivity.findUnique({
    where: { activityId: activityIdBigInt }
  });

  if (!activity) {
    return notFound();
  }

  // Fetch corresponding workout to show Target vs Actual
  const workout = await prisma.workout.findFirst({
    where: { actualActivityId: activityIdBigInt }
  });

  const isRun = activity.activityTypeKey === 'running';

  // --- Extract Real Time-Series Data for Charts ---
  let timeSeriesData: TimeSeriesDataPoint[] = [];
  let paceData: number[] = [];
  let hrData: number[] = [];
  let cadenceData: number[] = [];

  if (activity.metricsData) {
    try {
      const metrics = JSON.parse(activity.metricsData);

      // Subsample to max 300 points for performance
      const step = Math.ceil(metrics.length / 300);
      const subsampled = metrics.filter((_: any, i: number) => i % step === 0);

      timeSeriesData = subsampled.map((m: any, i: number) => {
        // Try multiple common Garmin keys for altitude
        const el = m.elevation || m.altitude || m.enhancedAltitude || m.Elevation || m.Altitude || 0;
        return {
          time: m.time || `${i}min`,
          hr: m.hr || activity.avgHr || 140,
          pace: m.pace || activity.avgPaceMinPerKm || 6.0,
          elevation: el,
          cadence: m.cadence || activity.cadence || 160
        };
      });

      hrData = subsampled.map((m: any) => m.hr).filter((v: any) => v != null);
    } catch (e) {
      console.error("Failed to parse metricsData", e);
    }
  }

  // Fallback if no detailed data (e.g. not synced yet)
  const duration = Math.max(1, Math.round(activity.durationMin ?? 0));
  if (timeSeriesData.length === 0) {
    const baseHr = activity.avgHr || 145;
    const basePace = activity.avgPaceMinPerKm || 5.5;
    timeSeriesData = Array.from({ length: 60 }, (_, i) => ({
      time: `${i}m`,
      hr: baseHr + (Math.random() * 10 - 5),
      pace: basePace + (Math.random() * 0.5 - 0.25),
      elevation: 0,
      cadence: 165 + (Math.random() * 6 - 3)
    }));
  }

  // We no longer calculate HR zones on the server because we need to read user credentials
  // from localStorage to get accurate user-defined heart rate zones. 
  // We delegate this to the ClientActivityHrZones component.

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-50 pb-20">

      {/* Header Navigation */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-sans font-bold text-sm tracking-wider uppercase">返回主控台</span>
          </Link>
          <div className="text-[10px] px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase tracking-widest font-mono">
            ID: {activity.activityId.toString()}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 animate-fade-up">

        {/* Title Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {isRun ? <Route className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isRun ? '跑步紀錄' : '運動紀錄'}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-50 tracking-tight leading-tight">
            {activity.activityName}
          </h1>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
            <Calendar className="w-4 h-4" />
            {new Date(activity.date).toLocaleString('zh-TW')}
          </div>
        </div>

        {/* Map Visualization */}
        <RealMapWrapper routeData={activity.routeData as string} />

        {/* Primary Core Stats (Hero) */}
        <div className="bg-slate-900/40 backdrop-blur-lg border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">

            <div className="flex flex-col items-center justify-center space-y-2 pt-4 md:pt-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-emerald-500/50" /> 總距離
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.distanceKm}</span>
                <span className="text-sm text-emerald-400 font-sans font-bold">公里</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2 pt-6 md:pt-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500/50" /> 持續時間
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.durationMin}</span>
                <span className="text-sm text-emerald-400 font-sans font-bold">分鐘</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2 pt-6 md:pt-0 col-span-2 md:col-span-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-emerald-500/50" /> 平均配速
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.avgPaceStr ?? '--'}</span>
                <span className="text-sm text-emerald-400 font-sans font-bold">/km</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2 pt-6 md:pt-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500/50" /> 總爬升
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.elevationGain ? Math.round(activity.elevationGain) : '--'}</span>
                <span className="text-sm text-emerald-400 font-sans font-bold">m</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2 pt-6 md:pt-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-500/50" /> 消耗熱量
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.calories ?? '--'}</span>
                <span className="text-sm text-emerald-400 font-sans font-bold">kcal</span>
              </div>
            </div>

          </div>
        </div>

        {/* Target vs Actual Comparison (If linked to a Workout) */}
        {workout && (
          <div className="bg-slate-900/60 backdrop-blur-lg border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex-1 space-y-4 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI 課表執行分析</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-50">{workout.title}</h2>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">配速表現 (預期 vs 實際)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-slate-400 line-through decoration-slate-600">{workout.targetPace || '--'}</span>
                    <span className="text-2xl font-mono font-extrabold text-emerald-400">{activity.avgPaceStr}</span>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">心率區間 (預期 vs 實際)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-slate-400 line-through decoration-slate-600">Z{workout.targetHrZone || '-'}</span>
                    <span className="text-2xl font-mono font-extrabold text-rose-400">{activity.avgHr} bpm</span>
                  </div>
                </div>
              </div>
            </div>

            {workout.complianceRate != null && (
              <div className="shrink-0 relative z-10">
                <CircularProgress
                  value={workout.complianceRate}
                  max={100}
                  size={140}
                  strokeWidth={12}
                  label="課表達成率"
                  color={workout.complianceRate >= 90 ? "text-emerald-400" : workout.complianceRate >= 70 ? "text-amber-400" : "text-rose-400"}
                />
              </div>
            )}
          </div>
        )}

        {/* AI Post-Run Analysis */}
        <AiAnalysisButton activityId={activity.activityId.toString()} />

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

          {/* Heart Rate & Effort */}
          <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6 md:p-8 space-y-8 flex flex-col">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Heart className="w-5 h-5 text-rose-400" /> 心肺與負荷
            </h2>

            <div className="grid grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">平均心率</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.avgHr ?? '--'}</span>
                  <span className="text-sm font-sans font-bold text-slate-500">bpm</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">最高心率</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.maxHr ?? '--'}</span>
                  <span className="text-sm font-sans font-bold text-slate-500">bpm</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" /> 最大攝氧量
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-emerald-400">{activity.vO2MaxValue ?? '--'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 訓練壓力(TSS)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-indigo-400">
                    {activity.trainingLoad ? activity.trainingLoad.toFixed(1) : (activity.trainingEffect ? (activity.trainingEffect * 25).toFixed(1) : '--')}
                  </span>
                </div>
              </div>
            </div>

            <ClientActivityHrZones activity={activity} />
          </div>

          {/* Running Dynamics */}
          <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6 md:p-8 space-y-8 flex flex-col">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Footprints className="w-5 h-5 text-amber-400" /> 跑步動態與環境
            </h2>

            <div className="grid grid-cols-2 gap-6 md:gap-8">
              <div className={`space-y-2 ${!activity.cadence ? 'opacity-40 grayscale' : ''} transition-opacity`}>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">平均步頻</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.cadence ?? '--'}</span>
                  <span className="text-sm font-sans font-bold text-slate-500">spm</span>
                </div>
              </div>
              <div className={`space-y-2 ${!activity.strideLength ? 'opacity-40 grayscale' : ''} transition-opacity`}>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">平均步幅</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.strideLength ? `${(activity.strideLength / 100).toFixed(2)}` : '--'}</span>
                  <span className="text-sm font-sans font-bold text-slate-500">公尺</span>
                </div>
              </div>
              {activity.groundContactTime != null && (
                <div className="space-y-2 transition-opacity">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">觸地時間 (GCT)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.groundContactTime}</span>
                    <span className="text-sm font-sans font-bold text-slate-500">ms</span>
                  </div>
                </div>
              )}
              {activity.verticalOscillation != null && (
                <div className="space-y-2 transition-opacity">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">垂直振幅 (VO)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-mono font-extrabold text-slate-100">{activity.verticalOscillation}</span>
                    <span className="text-sm font-sans font-bold text-slate-500">cm</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ECharts Full Width Professional View */}
        <div className="mt-8">
          <ActivityMetricsChart data={timeSeriesData} />
        </div>
      </div>
    </div>
  );
}
