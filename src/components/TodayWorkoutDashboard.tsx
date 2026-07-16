'use client';

import React from 'react';
import { 
  Flame, 
  Activity, 
  Clock, 
  Heart, 
  Zap, 
  Navigation, 
  BatteryCharging, 
  CalendarDays,
  Gauge,
  Brain,
  Sparkles
} from 'lucide-react';

export interface Workout {
  date: string;
  workout_type: 'Recovery' | 'Interval' | 'Tempo' | 'LongRun' | 'Rest';
  title: string;
  target_pace?: string;
  target_hr_zone?: number;
  description?: string;
  status?: string;
}

interface DashboardProps {
  workout?: Workout | null;
  onStartRun?: () => void;
}

export default function TodayWorkoutDashboard({ 
  workout, 
  onStartRun 
}: DashboardProps) {

  const activeWorkout: Workout = workout || {
    date: new Date().toISOString().split('T')[0],
    workout_type: 'Tempo',
    title: '門檻配速有氧跑',
    target_pace: '5:10 - 5:25',
    target_hr_zone: 3,
    description: '熱身 10 分鐘，接著以門檻配速跑 5 公里（心率維持在 Zone 3 區間），最後緩和慢跑 5 分鐘。注意換氣節奏。',
    status: 'Pending'
  };

  const isRest = activeWorkout.workout_type === 'Rest';

  const typeConfig: Record<string, { label: string; text: string; bg: string; icon: React.ReactNode }> = {
    Recovery: { 
      label: '恢復跑', 
      text: 'text-emerald-400', 
      bg: 'bg-emerald-400/10', 
      icon: <BatteryCharging className="w-5 h-5 text-emerald-400" /> 
    },
    Interval: { 
      label: '間歇跑', 
      text: 'text-rose-400', 
      bg: 'bg-rose-400/10', 
      icon: <Flame className="w-5 h-5 text-rose-400" /> 
    },
    Tempo: { 
      label: '節奏跑', 
      text: 'text-amber-400', 
      bg: 'bg-amber-400/10', 
      icon: <Zap className="w-5 h-5 text-amber-400" /> 
    },
    LongRun: { 
      label: '長距離', 
      text: 'text-purple-400', 
      bg: 'bg-purple-400/10', 
      icon: <Navigation className="w-5 h-5 text-purple-400" /> 
    },
    Rest: { 
      label: '休息日', 
      text: 'text-slate-400', 
      bg: 'bg-slate-800', 
      icon: <Clock className="w-5 h-5 text-slate-400" /> 
    },
  };

  const currentType = typeConfig[activeWorkout.workout_type] || typeConfig.Rest;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

      {/* Main Today's Workout Card */}
      <div className="relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-8 lg:p-10 lg:col-span-2 flex flex-col justify-between border border-white/[0.05] shadow-2xl group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-10">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${currentType.bg} border border-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]`}>
              {currentType.icon}
            </div>
            <span className={`text-sm font-bold uppercase tracking-[0.2em] ${currentType.text}`}>
              {currentType.label}
            </span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs font-mono text-slate-300 backdrop-blur-md shadow-lg">
            <CalendarDays className="w-4 h-4" />
            <span>今日課表</span>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight font-sans mb-6">
            {activeWorkout.title}
          </h3>
          <p className="text-lg text-slate-400/90 leading-relaxed max-w-3xl mb-12 font-light">
            {activeWorkout.description}
          </p>
        </div>

        {/* Target Specs Metrics */}
        {!isRest && (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/[0.05]">
            <div className="group/metric">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-3 block flex items-center gap-2">
                <Gauge className="w-4 h-4 group-hover/metric:text-emerald-400 transition-colors" /> 目標配速區間
              </span>
              <span className="text-4xl lg:text-5xl font-bold text-slate-100 tracking-tight font-mono">{activeWorkout.target_pace}</span>
            </div>
            <div className="group/metric">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-3 block flex items-center gap-2">
                <Heart className="w-4 h-4 group-hover/metric:text-rose-400 transition-colors" /> 心率區間
              </span>
              <span className="text-4xl lg:text-5xl font-bold text-slate-100 tracking-tight font-mono">Zone {activeWorkout.target_hr_zone}</span>
            </div>
          </div>
        )}

        {isRest && (
          <div className="relative z-10 pt-8 border-t border-white/[0.05]">
            <div className="text-slate-400 font-sans text-base flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400/50" />
              今天是休息日，好好放鬆肌肉，有助於下週的超補償效應。
            </div>
          </div>
        )}
      </div>

      {/* AI Coach Audio Tip bubble */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-500/[0.08] to-transparent rounded-3xl p-8 lg:p-10 flex flex-col gap-6 items-start justify-center border border-emerald-500/20 lg:col-span-1 shadow-[0_0_40px_-15px_rgba(52,211,153,0.15)] group hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.25)] transition-all duration-500">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 p-4 rounded-2xl bg-emerald-500/20 shrink-0 border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(52,211,153,0.2)]">
          <Brain className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-[0.2em] font-sans mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI 教練分析
          </h4>
          <p className="text-lg text-emerald-50/90 leading-relaxed font-medium">
            「今日準備度很高，Zone 3 門檻配速跑有助於建立乳酸閾值。前 1 公里請放慢腳步熱身，將步頻穩定控制在 180 spm 左右，這會顯著降低關節衝擊負荷。」
          </p>
        </div>
      </div>

    </div>
  );
}
