'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 

  Target,
  Award,
  X,
  Clock,
  Heart,
  Activity
} from 'lucide-react';

export interface Workout {
  date: string;
  workout_type: 'Recovery' | 'Interval' | 'Tempo' | 'LongRun' | 'Rest';
  title: string;
  target_pace?: string;
  target_hr_zone?: number;
  description?: string;
  status?: string; 
  actual_distance?: number;
  actual_duration?: number;
  actual_avg_hr?: number;
  actual_pace_str?: string;
  compliance_rate?: number;
}

interface CalendarProps {
  plan: Workout[];
  onWorkoutClick?: (workout: Workout) => void;
}

const TYPE_STYLE: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Recovery: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  Interval: { bg: 'bg-rose-500/10', text: 'text-rose-450', border: 'border-rose-500/30', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' },
  Tempo:    { bg: 'bg-amber-500/10', text: 'text-amber-450', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
  LongRun:  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  Rest:     { bg: 'bg-slate-900/50', text: 'text-slate-500', border: 'border-slate-800', glow: 'shadow-none' },
};

const TYPE_NAME_ZH: Record<string, string> = {
  Recovery: '恢復跑',
  Interval: '間歇跑',
  Tempo:    '節奏跑',
  LongRun:  '長距離',
  Rest:     '休息日',
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar({ plan, onWorkoutClick }: CalendarProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Generate a window of days: 7 days in the past, 21 days in the future
  const days = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 7);
  for (let i = 0; i < 28; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    days.push(d);
  }

  const workoutMap: Record<string, Workout> = {};
  plan.forEach(w => { workoutMap[w.date] = w; });

  useEffect(() => {
    // Scroll to today on mount
    if (scrollContainerRef.current) {
      const todayElement = scrollContainerRef.current.querySelector('[data-is-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [plan]);

  const handleCellClick = (workout: Workout) => {
    if (onWorkoutClick) {
      onWorkoutClick(workout);
    } else {
      setSelectedWorkout(workout);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-up">
      {/* Horizontal Swipeable Timeline */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 pt-2 px-2 scrollbar-hide -mx-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          const workout = workoutMap[dateStr];
          const style = workout ? TYPE_STYLE[workout.workout_type] : null;
          
          return (
            <div 
              key={dateStr}
              data-is-today={isToday}
              className={`snap-center shrink-0 w-[260px] sm:w-[280px] rounded-3xl border flex flex-col p-5 transition-all duration-300 relative overflow-hidden ${
                workout ? 'bg-slate-900/80 backdrop-blur-xl border-slate-800 hover:-translate-y-1 hover:shadow-2xl' : 'bg-slate-950/40 border-slate-900 opacity-60'
              } ${isToday && !workout ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''} ${style ? style.glow : ''}`}
            >
              {isToday && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {date.getMonth() + 1}月{date.getDate()}日 星期{WEEKDAYS[date.getDay()]}
                    {isToday && ' (今日)'}
                  </div>
                  {workout && (
                    <h3 className={`text-xl font-bold mt-1 font-sans tracking-tight ${workout.status === 'Completed' ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-slate-50'}`}>
                      {workout.title}
                    </h3>
                  )}
                  {!workout && (
                    <h3 className="text-lg font-bold mt-1 font-sans text-slate-600">
                      無排定課表
                    </h3>
                  )}
                </div>
                
                {workout && (
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${style?.bg} ${style?.text} ${style?.border}`}>
                    {TYPE_NAME_ZH[workout.workout_type]}
                  </div>
                )}
              </div>

              {workout && (
                <div className="flex-grow flex flex-col justify-end gap-3">
                  <div className="flex items-center gap-3 text-sm font-mono bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                    {workout.workout_type !== 'Rest' ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest">目標配速</span>
                          <span className="text-emerald-400 font-bold">{workout.target_pace || '--'}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest">心率區間</span>
                          <span className="text-rose-400 font-bold">Z{workout.target_hr_zone || '-'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400 text-xs py-1">完全休息，促進肌肉恢復</div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleCellClick(workout)}
                    className="w-full py-2.5 mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 hover:border-slate-600 flex justify-center items-center gap-2"
                  >
                    查看課表細節
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Details Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300 z-[100]">
          <div className="bg-slate-900 border-t sm:border border-slate-800 w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl relative animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-300 flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="flex justify-between items-center p-6 pb-4 shrink-0 border-b border-slate-800">
              <span className={`text-[10px] px-3 py-1 rounded-full border uppercase tracking-widest font-bold ${
                TYPE_STYLE[selectedWorkout.workout_type]?.bg
              } ${TYPE_STYLE[selectedWorkout.workout_type]?.text} ${TYPE_STYLE[selectedWorkout.workout_type]?.border}`}>
                {TYPE_NAME_ZH[selectedWorkout.workout_type]}
              </span>
              <button 
                onClick={() => setSelectedWorkout(null)} 
                className="text-slate-450 hover:text-slate-200 transition duration-200 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 pt-2 space-y-6 pb-8 custom-scrollbar">
            
            <div className="pt-2">
              <h3 className="text-2xl font-bold text-slate-50 mt-1 font-sans leading-tight tracking-tight">{selectedWorkout.title}</h3>
              <p className="text-sm text-slate-400 mt-2 font-mono flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {selectedWorkout.date}
              </p>
            </div>

            <div className="space-y-6">
              {selectedWorkout.workout_type !== 'Rest' && (
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex justify-around">
                  <div className="text-center flex flex-col items-center">
                    <Activity className="w-4 h-4 text-slate-500 mb-2" />
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">目標配速</span>
                    <span className="text-lg font-bold text-emerald-450 mt-1 block font-mono">{selectedWorkout.target_pace ?? '--'}</span>
                  </div>
                  <div className="w-px bg-slate-800" />
                  <div className="text-center flex flex-col items-center">
                    <Heart className="w-4 h-4 text-rose-500 mb-2" />
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">目標心率區間</span>
                    <span className="text-lg font-bold text-rose-450 mt-1 block font-mono">{selectedWorkout.target_hr_zone ? `Zone ${selectedWorkout.target_hr_zone}` : '--'}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>教練指導與步驟</span>
                </h4>
                <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-5 rounded-2xl border border-slate-850 whitespace-pre-wrap selection:bg-emerald-500/30">
                  {selectedWorkout.description || '無詳細說明。'}
                </div>
              </div>

              {selectedWorkout.workout_type !== 'Rest' && (
                <div className="pt-6 border-t border-slate-850">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>執行成效</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {selectedWorkout.compliance_rate !== undefined && selectedWorkout.status === 'Completed' && (
                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          達成率 {selectedWorkout.compliance_rate}%
                        </span>
                      )}
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        selectedWorkout.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        selectedWorkout.status === 'Missed' ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20' :
                        'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}>
                        {selectedWorkout.status === 'Completed' ? '✅ 已完成' :
                         selectedWorkout.status === 'Missed' ? '❌ 未執行' : '⏳ 待執行'}
                      </span>
                    </div>
                  </div>

                  {selectedWorkout.status === 'Completed' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center hover:border-emerald-500/30 transition-colors">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">實際距離</span>
                        <span className="text-base font-extrabold text-slate-100 mt-1 block font-mono">{selectedWorkout.actual_distance?.toFixed(2) || '--'} <span className="text-[10px] text-slate-500 font-sans font-normal">km</span></span>
                      </div>
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center hover:border-emerald-500/30 transition-colors">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">實際配速</span>
                        <span className="text-base font-extrabold text-slate-100 mt-1 block font-mono">{selectedWorkout.actual_pace_str || '--'} <span className="text-[10px] text-slate-500 font-sans font-normal">/km</span></span>
                      </div>
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center hover:border-emerald-500/30 transition-colors">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">訓練時間</span>
                        <span className="text-base font-extrabold text-slate-100 mt-1 block font-mono">{selectedWorkout.actual_duration ? Math.floor(selectedWorkout.actual_duration) : '--'} <span className="text-[10px] text-slate-500 font-sans font-normal">min</span></span>
                      </div>
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center hover:border-emerald-500/30 transition-colors">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">平均心率</span>
                        <span className="text-base font-extrabold text-slate-100 mt-1 block font-mono">{selectedWorkout.actual_avg_hr ? Math.round(selectedWorkout.actual_avg_hr) : '--'} <span className="text-[10px] text-slate-500 font-sans font-normal">bpm</span></span>
                      </div>
                    </div>
                  ) : selectedWorkout.status === 'Missed' ? (
                    <p className="text-xs text-rose-455 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl leading-relaxed text-center">
                      此課表日期已過，但系統中未找到您的跑步紀錄。
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 bg-slate-950/50 border border-slate-800 p-4 rounded-xl leading-relaxed text-center">
                      尚未同步當天的 Garmin 活動，完成跑步後系統將自動比對。
                    </p>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
