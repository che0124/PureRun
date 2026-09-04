'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Route,
  Timer,
  Clock,
  TrendingUp,
  Heart,
  Flame,
  Layers,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Activity as ActivityIcon
} from 'lucide-react';
import RealMapWrapper from '@/components/RealMapWrapper';
import type { TileLayerType } from '@/components/RealMapVisualizer';
import { formatDurationHHMMSS } from '@/lib/formatters';

interface ActivityMapData {
  id: string;
  name: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  avgPaceStr: string | null;
  avgHr: number | null;
  maxHr?: number | null;
  elevationGain?: number | null;
  calories?: number | null;
  cadence?: number | null;
  strideLength?: number | null;
  isRun: boolean;
  routeData: string | null;
}

interface ActivityMapViewerProps {
  activity: ActivityMapData;
}

const TILE_OPTIONS: { id: TileLayerType; label: string }[] = [
  { id: 'topo', label: '地形圖' },
  { id: 'satellite', label: '衛星圖' },
  { id: 'dark', label: '深色圖' },
  { id: 'street', label: '街道圖' }
];

export default function ActivityMapViewer({ activity }: ActivityMapViewerProps) {
  const router = useRouter();
  const [selectedLayer, setSelectedLayer] = useState<TileLayerType>('topo');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [showStats, setShowStats] = useState(true);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/activity/${activity.id}`);
    }
  };

  const formattedDate = new Date(activity.date).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="fixed inset-0 w-full h-full bg-background text-[var(--text-primary)] font-sans overflow-hidden select-none">
      {/* Main Full-Screen Map Area (Absolute inset for 100% mobile viewport stability) */}
      <main className="absolute inset-0 w-full h-full">
        <RealMapWrapper
          routeData={activity.routeData}
          interactive={true}
          tileLayerType={selectedLayer}
          showZoomControl={true}
          resetTrigger={resetCount}
          className="w-full h-full"
        />
      </main>

      {/* Top Floating Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-[1100] pointer-events-none p-2.5 sm:p-4 pt-safe">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Back Button and Activity Title Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface/90 backdrop-blur-xl border border-border/80 text-[var(--text-primary)] hover:text-[var(--text-accent)] hover:border-emerald-500/50 shadow-lg active:scale-95 transition-all cursor-pointer"
              title="返回上一頁"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-surface/90 backdrop-blur-xl border border-border/80 shadow-lg flex flex-col justify-center min-w-0 max-w-[150px] xs:max-w-[200px] sm:max-w-md">
              <div className="flex items-center gap-1.5 min-w-0">
                {activity.isRun ? (
                  <Route className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <ActivityIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
                <h1 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  {activity.name}
                </h1>
              </div>
              <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-mono truncate">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Top Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
            {/* Layer Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLayerMenu((prev) => !prev)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-surface/90 backdrop-blur-xl border border-border/80 text-xs font-semibold text-[var(--text-primary)] shadow-lg hover:border-emerald-500/50 active:scale-95 transition-all cursor-pointer"
                title="切換地圖樣式"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                <span className="hidden xs:inline text-[11px] sm:text-xs">
                  {TILE_OPTIONS.find((t) => t.id === selectedLayer)?.label}
                </span>
              </button>

              {showLayerMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayerMenu(false)}
                  />
                  <div className="absolute right-0 top-11 sm:top-12 z-50 w-36 rounded-2xl bg-surface/95 backdrop-blur-xl border border-border shadow-2xl p-1.5 flex flex-col gap-1">
                    {TILE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedLayer(opt.id);
                          setShowLayerMenu(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors flex items-center justify-between cursor-pointer ${
                          selectedLayer === opt.id
                            ? 'bg-emerald-500/15 text-[var(--text-accent)] font-bold'
                            : 'text-[var(--text-secondary)] hover:bg-surface-hover hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedLayer === opt.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Re-center / Fit bounds */}
            <button
              type="button"
              onClick={() => setResetCount((c) => c + 1)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface/90 backdrop-blur-xl border border-border/80 text-[var(--text-primary)] hover:text-emerald-400 hover:border-emerald-500/50 shadow-lg active:scale-95 transition-all cursor-pointer"
              title="重新置中視野"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Share Link */}
            <Link
              href={`/activity/${activity.id}/share`}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 text-[var(--text-accent)] hover:bg-emerald-500/20 shadow-lg active:scale-95 transition-all"
              title="分享活動圖卡"
            >
              <Share2 className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom Floating Stats Drawer */}
      <footer className="absolute bottom-0 left-0 right-0 z-[1100] pointer-events-none p-2.5 sm:p-4 pb-safe">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Toggle Tab */}
          <button
            type="button"
            onClick={() => setShowStats((s) => !s)}
            className="pointer-events-auto -mb-1.5 z-10 px-3.5 py-1 rounded-t-xl bg-surface/90 backdrop-blur-xl border-t border-x border-border/80 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 shadow-md transition-all cursor-pointer"
          >
            {showStats ? (
              <>
                <span>隱藏數據</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <MapIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>展開數據</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Stats Bar */}
          {showStats && (
            <div className="pointer-events-auto w-full rounded-2xl bg-surface/90 backdrop-blur-2xl border border-border/80 shadow-2xl p-2.5 sm:p-4 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-3 text-center">
                {/* Distance */}
                <div className="bg-surface/50 border border-border/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                    <Route className="w-3 h-3 text-emerald-500 shrink-0" /> 距離
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <span className="text-base sm:text-xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
                      {activity.distanceKm}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-bold">km</span>
                  </div>
                </div>

                {/* Pace */}
                <div className="bg-surface/50 border border-border/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                    <Timer className="w-3 h-3 text-indigo-400 shrink-0" /> 配速
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <span className="text-base sm:text-xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
                      {activity.avgPaceStr ?? '--'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-bold">/km</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-surface/50 border border-border/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500 shrink-0" /> 時間
                  </span>
                  <div className="mt-0.5">
                    <span className="text-base sm:text-xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
                      {formatDurationHHMMSS(activity.durationMin)}
                    </span>
                  </div>
                </div>

                {/* Elevation Gain */}
                <div className="bg-surface/50 border border-border/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-500 shrink-0" /> 爬升
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <span className="text-base sm:text-xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
                      {activity.elevationGain ? Math.round(activity.elevationGain) : '--'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-bold">m</span>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="bg-surface/50 border border-border/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500 shrink-0" /> 心率
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <span className="text-base sm:text-xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
                      {activity.avgHr ?? '--'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-bold">bpm</span>
                  </div>
                </div>

                {/* Calories */}
                <div className="bg-surface/50 border border-border/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500 shrink-0" /> 熱量
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <span className="text-base sm:text-xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
                      {activity.calories ?? '--'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-bold">kcal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
