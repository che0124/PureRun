'use client';

import React from 'react';
import type { NormalizedActivity } from '@/lib/garmin';
import { X, Calendar, Activity, Timer, Heart, Map, ActivitySquare, Flame, Mountain, Footprints, Zap } from 'lucide-react';

interface Props {
  activity: NormalizedActivity | null;
  onClose: () => void;
}

export default function ActivityDetailPanel({ activity, onClose }: Props) {
  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full sm:max-w-lg bg-surface border border-border rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-background/50">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-[var(--text-accent)]" />
              {activity.activityName || '跑步紀錄'}
            </h2>
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1 font-mono">
              <Calendar className="w-3 h-3" />
              {new Date(activity.date).toISOString().split('T')[0]}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-surface-hover hover:bg-[var(--input-bg)] text-[var(--text-secondary)] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-background/40 rounded-xl border border-border">
              <Map className="w-5 h-5 text-[var(--text-accent)] mb-2" />
              <span className="text-xl font-black text-[var(--text-primary)] font-mono">{activity.distanceKm.toFixed(2)}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">公里</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-background/40 rounded-xl border border-border">
              <Timer className="w-5 h-5 text-blue-400 mb-2" />
              <span className="text-xl font-black text-[var(--text-primary)] font-mono">{activity.avgPaceStr || '--:--'}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">平均配速</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-background/40 rounded-xl border border-border">
              <Activity className="w-5 h-5 text-rose-400 mb-2" />
              <span className="text-xl font-black text-[var(--text-primary)] font-mono">{Math.floor(activity.durationMin)}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">時間 (分)</span>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="bg-background/40 rounded-xl border border-border p-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" />
              詳細數據
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400"/> 平均心率</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{activity.avgHr ? `${activity.avgHr} bpm` : '--'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500"/> 最高心率</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{activity.maxHr ? `${activity.maxHr} bpm` : '--'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400"/> 消耗卡路里</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{activity.calories ? `${activity.calories} kcal` : '--'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5"><Mountain className="w-3.5 h-3.5 text-emerald-500"/> 總爬升</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{activity.elevationGain ? `${activity.elevationGain} m` : '--'}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5"><Footprints className="w-3.5 h-3.5 text-indigo-400"/> 平均步頻</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{activity.cadence ? `${activity.cadence} spm` : '--'}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-400"/> 訓練效果</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{activity.trainingEffect ? activity.trainingEffect.toFixed(1) : '--'}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
