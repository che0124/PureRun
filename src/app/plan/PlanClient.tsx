'use client';

import React, { useState, useEffect } from 'react';
import Calendar, { Workout } from '@/components/Calendar';
import { loadCredentials, saveCredentials, StoredCredentials } from '@/lib/credentials';
import { useRouter } from 'next/navigation';
import { 
  Target, 
  Activity, 
  Sliders, 
  Save, 
  Check, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Brain,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialGarminStats: any;
  initialPlan: {
    weeklyAnalysis: string;
    workouts: Workout[];
  } | null;
}

const WEEKDAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAY_LABELS = {
  Monday: '週一',
  Tuesday: '週二',
  Wednesday: '週三',
  Thursday: '週四',
  Friday: '週五',
  Saturday: '週六',
  Sunday: '週日'
};

const GOAL_LABELS_ZH: Record<string, string> = {
  finish: '無傷完賽',
  pb: '突破 PB',
  maintain: '維持體能',
};

export default function PlanClient({ initialGarminStats, initialPlan }: Props) {
  const [weeklyAnalysis, setWeeklyAnalysis] = useState(initialPlan?.weeklyAnalysis || '');
  const [plan, setPlan] = useState<Workout[]>(initialPlan?.workouts || []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // AI Coach Settings States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [targetDistance, setTargetDistance] = useState('42K');
  const [targetDateType, setTargetDateType] = useState('weeks');
  const [targetDate, setTargetDate] = useState('');
  const [targetWeeks, setTargetWeeks] = useState(16);
  const [targetTime, setTargetTime] = useState('04:00:00');
  const [trainingGoal, setTrainingGoal] = useState('finish');
  const [recentPr, setRecentPr] = useState('');
  const [currentWeeklyVolume, setCurrentWeeklyVolume] = useState(30);
  const [planFrequency, setPlanFrequency] = useState(1);
  const [runningDaysPerWeek, setRunningDaysPerWeek] = useState(4);
  const [longRunDay, setLongRunDay] = useState('Sunday');
  const [absoluteRestDays, setAbsoluteRestDays] = useState<string[]>([]);
  
  // Dynamic Condition State
  const [currentCondition, setCurrentCondition] = useState('normal');

  useEffect(() => {
    const creds = loadCredentials();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetDistance(creds.targetDistance || '42K');
    setTargetDateType(creds.targetDateType || 'weeks');
    setTargetDate(creds.targetDate || '');
    setTargetWeeks(creds.targetWeeks || 16);
    setTargetTime(creds.targetTime || '04:00:00');
    setTrainingGoal(creds.trainingGoal || 'finish');
    setRecentPr(creds.recentPr || '');
    setCurrentWeeklyVolume(creds.currentWeeklyVolume || 30);
    setPlanFrequency(creds.planFrequency || 1);
    setRunningDaysPerWeek(creds.runningDaysPerWeek || 4);
    setLongRunDay(creds.longRunDay || 'Sunday');
    setAbsoluteRestDays(creds.absoluteRestDays || []);
  }, []);

  const handleSaveSettings = () => {
    // 1. Logic check: running days + rest days <= 7
    const maxRestDays = 7 - runningDaysPerWeek;
    if (absoluteRestDays.length > maxRestDays) {
      setValidationError(`絕對休息日最多只能選擇 ${maxRestDays} 天（依據您設定的每週跑步 ${runningDaysPerWeek} 天，剩餘天數才可設定為休息日）。`);
      return;
    }

    // 2. Format check: HH:MM:SS
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(targetTime)) {
      setValidationError("目標完賽成績格式必須為 HH:MM:SS，例如 04:00:00。");
      return;
    }

    if (recentPr && !timeRegex.test(recentPr)) {
      setValidationError("近期最佳 PR 成績格式必須為 HH:MM:SS，例如 03:55:12。");
      return;
    }

    // Clear validation error and save
    setValidationError(null);
    const current = loadCredentials();
    const creds: StoredCredentials = {
      ...current,
      targetDistance,
      targetDateType,
      targetDate,
      targetWeeks,
      targetTime,
      trainingGoal,
      recentPr,
      currentWeeklyVolume,
      planFrequency,
      runningDaysPerWeek,
      longRunDay,
      absoluteRestDays
    };
    saveCredentials(creds);
    setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 2000);
  };

  const handleGeneratePlan = async () => {
    setError(null);
    const creds = loadCredentials();

    if (!creds.geminiApiKey) {
      router.push('/settings');
      return;
    }

    if (!initialGarminStats) {
      setError('請先至儀表板同步 Garmin 數據，以便 AI 取得您的體能指標。');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, currentCondition }),
      });
      const data = await res.json();

      if (res.ok) {
        setWeeklyAnalysis(data.weekly_analysis);
        setPlan(data.training_plan || []);
        router.refresh();
      } else {
        setError(data.message || '計畫生成失敗。');
      }
    } catch {
      setError('發生網路錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const getRestDaysSummary = () => {
    if (absoluteRestDays.length === 0) return '無指定';
    return absoluteRestDays.map(d => WEEKDAY_LABELS[d as keyof typeof WEEKDAY_LABELS]).join('、');
  };

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-900 pb-6 relative">
        <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-emerald-500/30 to-transparent"></div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-slate-50">
              AI 專屬訓練課表
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-xl">
              基於您的真實 Garmin 跑步數據與過去的課表執行率，AI 自動為您滾動規劃週期化課表。
            </p>
          </div>
        </div>

        {/* Generate Action Block */}
        <div className="shrink-0 flex items-center">
          <button 
            onClick={handleGeneratePlan}
            disabled={loading}
            className="relative group overflow-hidden px-5 py-3 bg-emerald-400 hover:bg-emerald-350 active:scale-95 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-glow-sweep pointer-events-none" />
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>AI 計算中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>產生新週期課表</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message Block */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs sm:text-sm text-rose-455 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-455 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Coach Settings Form (Collapsible) */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300 shadow-xl">
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-405">
              <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-50">AI 智慧教練訓練設定</h2>
              <p className="text-sm text-slate-400 mt-1.5 hidden sm:block">
                {isSettingsOpen 
                  ? '請設定您下一週期的馬拉松規劃偏好與限制指標' 
                  : `目標: ${targetDistance} (${GOAL_LABELS_ZH[trainingGoal] || trainingGoal}) | 預計完賽: ${targetTime} | 週跑量: ${currentWeeklyVolume}k | 休息日: ${getRestDaysSummary()}`
                }
              </p>
            </div>
          </div>
          {isSettingsOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {isSettingsOpen && (
          <div className="p-6 border-t border-slate-850/80 space-y-6 animate-fade-in">
            {/* Form grid: 3 blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Block 1: Race & Periodization */}
              <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850 space-y-4">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-850 pb-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>賽事與週期目標</span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="target-distance">目標賽事距離</label>
                    <select
                      id="target-distance"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3 text-sm text-slate-100 outline-none cursor-pointer"
                      value={targetDistance}
                      onChange={e => setTargetDistance(e.target.value)}
                    >
                      <option value="5K">5K 公里</option>
                      <option value="10K">10K 公里</option>
                      <option value="21K">半程馬拉松 (21K)</option>
                      <option value="42K">全程馬拉松 (42K)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">週期目標模式</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${targetDateType === 'weeks' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold' : 'bg-slate-950 border-slate-800 text-slate-450 hover:text-slate-300'}`}
                        onClick={() => setTargetDateType('weeks')}
                      >
                        指定訓練週期
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${targetDateType === 'date' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold' : 'bg-slate-950 border-slate-800 text-slate-450 hover:text-slate-300'}`}
                        onClick={() => setTargetDateType('date')}
                      >
                        指定賽事日期
                      </button>
                    </div>

                    {targetDateType === 'weeks' ? (
                      <select
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                        value={targetWeeks}
                        onChange={e => setTargetWeeks(Number(e.target.value))}
                      >
                        <option value={12}>12 週完整培訓</option>
                        <option value={16}>16 週完整培訓</option>
                        <option value={20}>20 週完整培訓</option>
                      </select>
                    ) : (
                      <input
                        type="date"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2 text-xs text-slate-100 outline-none"
                        value={targetDate}
                        onChange={e => setTargetDate(e.target.value)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="target-time">目標完賽成績</label>
                    <input
                      id="target-time"
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3 text-sm text-slate-100 outline-none font-mono"
                      value={targetTime}
                      onChange={e => setTargetTime(e.target.value)}
                      placeholder="HH:MM:SS (例如 04:00:00)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="training-goal">訓練主軸</label>
                    <select
                      id="training-goal"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                      value={trainingGoal}
                      onChange={e => setTrainingGoal(e.target.value)}
                    >
                      <option value="finish">無傷完賽</option>
                      <option value="pb">突破 PB (個人最佳)</option>
                      <option value="maintain">維持體能</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Block 2: Current Fitness Baseline */}
              <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850 space-y-4">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-850 pb-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>當前體能基準</span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="recent-pr">近期最佳成績 (PR)</label>
                    <input
                      id="recent-pr"
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3 text-sm text-slate-100 outline-none font-mono"
                      value={recentPr}
                      onChange={e => setRecentPr(e.target.value)}
                      placeholder="HH:MM:SS (選填，例如 03:55:12)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="weekly-volume">目前平均週跑量 (公里)</label>
                    <input
                      id="weekly-volume"
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2.5 text-xs text-slate-100 outline-none font-mono"
                      value={currentWeeklyVolume}
                      onChange={e => setCurrentWeeklyVolume(Number(e.target.value))}
                      min={0}
                      max={200}
                      placeholder="例如 30"
                    />
                  </div>
                </div>
              </div>

              {/* Block 3: Training Constraints */}
              <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850 space-y-4">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-850 pb-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>訓練偏好與限制</span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="plan-frequency">AI 課表生成頻率</label>
                    <select
                      id="plan-frequency"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                      value={planFrequency}
                      onChange={e => setPlanFrequency(Number(e.target.value))}
                    >
                      <option value={1}>每 1 週生成一次</option>
                      <option value={2}>每 2 週生成一次</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="running-days">每週預計跑步天數</label>
                    <select
                      id="running-days"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                      value={runningDaysPerWeek}
                      onChange={e => setRunningDaysPerWeek(Number(e.target.value))}
                    >
                      {[3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} 天</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="long-run-day">長距離訓練日 (Long Run)</label>
                    <select
                      id="long-run-day"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                      value={longRunDay}
                      onChange={e => setLongRunDay(e.target.value)}
                    >
                      <option value="Saturday">星期六</option>
                      <option value="Sunday">星期日</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">絕對休息日 (無法訓練)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {WEEKDAY_KEYS.map(day => {
                        const isChecked = absoluteRestDays.includes(day);
                        return (
                          <label 
                            key={day}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer select-none ${
                              isChecked 
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-455 font-extrabold' 
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-350'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setAbsoluteRestDays(absoluteRestDays.filter(d => d !== day));
                                } else {
                                  setAbsoluteRestDays([...absoluteRestDays, day]);
                                }
                              }}
                            />
                            <span>{WEEKDAY_LABELS[day as keyof typeof WEEKDAY_LABELS]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-850/80">
              {validationError && (
                <div className="text-xs text-rose-400 flex items-center gap-1 bg-rose-500/5 border border-rose-500/15 py-1.5 px-3 rounded-lg animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-455 animate-pulse" />
                  <span>{validationError}</span>
                </div>
              )}
              <button 
                onClick={handleSaveSettings}
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-350 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-950" />
                <span>儲存設定變更</span>
              </button>
              {isSavedSuccessfully && (
                <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-405 text-xs font-bold animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>設定儲存成功</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Weekly Analysis / Insights Block (Full Width Alert Design) */}
      {weeklyAnalysis && (
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 self-start">
              <Brain className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1 flex-grow">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <span>AI 教練本週評估與建議</span>
              </h3>
              <p className="text-sm sm:text-base text-slate-350 leading-relaxed whitespace-pre-line mt-3 font-sans">{weeklyAnalysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive AI Coach Daily Check-in */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          今天感覺如何？(動態微調)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'great', icon: '🔥', label: '狀態絕佳', color: 'hover:border-rose-400 hover:bg-rose-500/10', active: 'border-rose-500 bg-rose-500/20 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
            { id: 'normal', icon: '✅', label: '感覺一般', color: 'hover:border-emerald-400 hover:bg-emerald-500/10', active: 'border-emerald-500 bg-emerald-500/20 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
            { id: 'fatigued', icon: '🔋', label: '累積疲勞', color: 'hover:border-amber-400 hover:bg-amber-500/10', active: 'border-amber-500 bg-amber-500/20 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
            { id: 'injured', icon: '🩹', label: '輕微不適', color: 'hover:border-purple-400 hover:bg-purple-500/10', active: 'border-purple-500 bg-purple-500/20 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
            { id: 'sick', icon: '🤒', label: '生病休養', color: 'hover:border-slate-400 hover:bg-slate-500/20', active: 'border-slate-500 bg-slate-500/30 text-slate-100 shadow-[0_0_15px_rgba(100,116,139,0.3)]' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => {
                setCurrentCondition(status.id);
                // Optional: Auto trigger API call when selecting a new state if it differs
              }}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                currentCondition === status.id 
                  ? status.active 
                  : `border-slate-800 bg-slate-950/50 text-slate-400 ${status.color}`
              }`}
            >
              <span className="text-2xl mb-2 filter drop-shadow-md">{status.icon}</span>
              <span className="text-xs font-bold tracking-wide">{status.label}</span>
            </button>
          ))}
        </div>
        
        {/* Dynamic Action Area */}
        <div className="mt-5 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-850">
          <p className="text-xs text-slate-400 flex-1 px-2 font-mono">
            {currentCondition === 'great' && 'AI: 偵測到高昂狀態，是否要將今日課表微調為更具挑戰性的強度？'}
            {currentCondition === 'normal' && 'AI: 保持目前的訓練節奏，依照原訂計畫執行。'}
            {currentCondition === 'fatigued' && 'AI: 建議降低今日訓練量，或將高強度課表替換為恢復跑 (Recovery)。'}
            {currentCondition === 'injured' && 'AI: 安全第一。建議今日徹底休息，並連帶調整明後天的配速。'}
            {currentCondition === 'sick' && 'AI: 身體正在對抗病毒。將為您凍結這兩天的課表並往後延遲。'}
          </p>
          <button 
            onClick={handleGeneratePlan}
            disabled={loading || currentCondition === 'normal'}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ml-4 ${
              currentCondition !== 'normal' 
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 cursor-pointer' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {loading ? '調整中...' : '套用並重算'}
          </button>
        </div>
      </div>

      {/* Calendar Area (Full Width) */}
      <div className="w-full">
        <Calendar plan={plan} />
      </div>

    </div>
  );
}
