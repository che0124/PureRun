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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-emerald-400" />
              {activity.activityName || '跑步紀錄'}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
              <Calendar className="w-3 h-3" />
              {activity.date}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <Map className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-xl font-black text-slate-100 font-mono">{activity.distanceKm.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">公里</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <Timer className="w-5 h-5 text-blue-400 mb-2" />
              <span className="text-xl font-black text-slate-100 font-mono">{activity.avgPaceStr || '--:--'}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">平均配速</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <Activity className="w-5 h-5 text-rose-400 mb-2" />
              <span className="text-xl font-black text-slate-100 font-mono">{Math.floor(activity.durationMin)}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">時間 (分)</span>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="bg-slate-950/40 rounded-xl border border-slate-800/50 p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" />
              詳細數據
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400"/> 平均心率</span>
                <span className="font-mono text-slate-200 font-semibold">{activity.avgHr ? `${activity.avgHr} bpm` : '--'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500"/> 最高心率</span>
                <span className="font-mono text-slate-200 font-semibold">{activity.maxHr ? `${activity.maxHr} bpm` : '--'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400"/> 消耗卡路里</span>
                <span className="font-mono text-slate-200 font-semibold">{activity.calories ? `${activity.calories} kcal` : '--'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Mountain className="w-3.5 h-3.5 text-emerald-500"/> 總爬升</span>
                <span className="font-mono text-slate-200 font-semibold">{activity.elevationGain ? `${activity.elevationGain} m` : '--'}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Footprints className="w-3.5 h-3.5 text-indigo-400"/> 平均步頻</span>
                <span className="font-mono text-slate-200 font-semibold">{activity.cadence ? `${activity.cadence} spm` : '--'}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-400"/> 訓練效果</span>
                <span className="font-mono text-slate-200 font-semibold">{activity.trainingEffect ? activity.trainingEffect.toFixed(1) : '--'}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
