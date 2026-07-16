'use client';

import React, { useState } from 'react';
import type { RunnerStats, NormalizedActivity } from '@/lib/garmin';
import ActivityDetailPanel from './ActivityDetailPanel';
import { Brain, User, Loader2, Sparkles } from 'lucide-react';

interface Props {
  onGeneratePlan: () => Promise<void>;
  weeklyAnalysis: string;
  garminStats: RunnerStats | null;
  isConnected: boolean;
  onOpenSettings: () => void;
  generateError: string | null;
}

export default function AiPanel({ onGeneratePlan, weeklyAnalysis, garminStats, isConnected, onOpenSettings, generateError }: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<NormalizedActivity | null>(null);

  const handleGenerate = async () => {
    if (!isConnected) {
      onOpenSettings();
      return;
    }
    setLoading(true);
    await onGeneratePlan();
    setLoading(false);
  };

  return (
    <>
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.04)] transition-all duration-300 shadow-xl flex flex-col h-full gap-6 animate-fade-up">
        {/* Title */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-50 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Brain className="w-5 h-5 text-emerald-400" />
            <span>AI 訓練洞察</span>
          </h2>
          <div className="min-h-[160px] bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-xs sm:text-sm leading-relaxed text-slate-300 flex flex-col justify-center">
            {generateError ? (
              <div className="text-rose-400 font-medium py-4">
                <strong>錯誤：</strong> {generateError}
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="text-xs text-slate-400 font-mono">GEN_DYNAMIC_PLAN...</span>
              </div>
            ) : weeklyAnalysis ? (
              <div className="whitespace-pre-line text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">{weeklyAnalysis}</div>
            ) : (
              <p className="text-slate-500 text-center py-8 text-xs font-sans">
                點擊下方「生成與調整計畫」同步數據，獲取 AI 教練為您動態調整的課表。
              </p>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-50 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-emerald-400" />
            <span>跑者檔案</span>
          </h2>
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-xs">
            {garminStats ? (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-bold">資料來源</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-xl bg-emerald-500/10 text-emerald-405 border border-emerald-500/20 font-bold tracking-wider uppercase">Garmin 數據</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-850">
                  <span className="text-slate-400 font-bold">VDOT 跑力</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{garminStats.estimatedVdot}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-850">
                  <span className="text-slate-400 font-bold">7天跑量</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{garminStats.weeklyKm} 公里</span>
                </div>
                
                <h3 className="font-bold text-slate-350 mt-4 mb-2 tracking-wide text-[10px] uppercase">近期活動紀錄</h3>
                <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
                  {garminStats.recentActivities.length > 0 ? (
                    garminStats.recentActivities.map(act => (
                      <div 
                        key={act.activityId} 
                        className="p-2 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex justify-between items-center group"
                        onClick={() => setSelectedActivity(act)}
                      >
                        <div className="flex flex-col gap-0.5 max-w-[65%]">
                          <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate text-xs">{act.activityName}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{act.date}</span>
                        </div>
                        <div className="text-right flex flex-col gap-0.5">
                          <span className="text-emerald-400 font-bold font-mono text-xs">{act.distanceKm}k</span>
                          <span className="text-[9px] text-slate-450 font-mono">{act.avgPaceStr}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-2">找不到近期的活動。</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-4 font-sans">連接 Garmin 以同步檔案</div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <button 
            id="generate-plan-btn"
            className="w-full py-3 bg-emerald-400 hover:bg-emerald-350 active:scale-[0.98] text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all text-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>生成與調整計畫</span>
              </>
            )}
          </button>
        </div>
      </div>

      <ActivityDetailPanel 
        activity={selectedActivity} 
        onClose={() => setSelectedActivity(null)} 
      />
    </>
  );
}
