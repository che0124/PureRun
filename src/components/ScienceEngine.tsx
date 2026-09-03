'use client';

import { useState, useMemo, useEffect } from 'react';
import { Activity, CalendarDays, TrendingUp, Settings2, Target, Lock, Unlock, ChevronDown, X, Info, Timer, Gauge } from 'lucide-react';
import { generateWeeklyPlan, RaceGoal } from '@/lib/science/scheduler';
import { loadCredentials, saveCredentials } from '@/lib/credentials';
import { formatDurationHHMMSS } from '@/lib/formatters';
import { getPaceZones, formatPace } from '@/lib/science/vdot';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScienceEngine({
  initialVdot = 45,
  initialVo2Max = 50,
  initialCtl = 40,
  hasRealData = false
}: {
  initialVdot?: number,
  initialVo2Max?: number,
  initialCtl?: number,
  hasRealData?: boolean
}) {
  const [goal, setGoal] = useState<RaceGoal>('HalfMarathon');
  const [targetDate, setTargetDate] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  const [vdot, setVdot] = useState<number>(initialVdot);
  const [vo2max, setVo2max] = useState<number>(initialVo2Max);
  const [ctl, setCtl] = useState<number>(initialCtl);
  const [availableDays, setAvailableDays] = useState<number[]>([0, 2, 4, 6]);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const [isSimulationMode, setIsSimulationMode] = useState(!hasRealData);

  useEffect(() => {
    // Load saved settings
    const creds = loadCredentials();
    let loadedDate = '';
    if (creds.targetDate) {
      setTargetDate(creds.targetDate);
      loadedDate = creds.targetDate;
    }
    if (creds.targetDistance) {
      const goalMap: Record<string, RaceGoal> = { '5K': '5K', '10K': '10K', '21K': 'HalfMarathon', '42K': 'Marathon' };
      setGoal(goalMap[creds.targetDistance] || 'HalfMarathon');
    }

    if (loadedDate) {
      const dateObj = new Date(loadedDate);
      const today = new Date();
      const diffWeeks = Math.max(1, Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7)));
      setWeeksToRace(diffWeeks);
    }
  }, []);

  useEffect(() => {
    if (!isSimulationMode) {
      setVdot(initialVdot);
      setVo2max(initialVo2Max);
      setCtl(initialCtl);
    }
  }, [isSimulationMode, initialVdot, initialVo2Max, initialCtl]);

  const handleSaveRaceSettings = () => {
    const creds = loadCredentials();
    const distanceMap: Record<RaceGoal, string> = { '5K': '5K', '10K': '10K', 'HalfMarathon': '21K', 'Marathon': '42K', 'Fitness': 'Fitness' };

    creds.targetDate = targetDate;
    creds.targetDateType = 'date';
    creds.targetDistance = distanceMap[goal] || '42K';

    saveCredentials(creds);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);

    if (targetDate) {
      const dateObj = new Date(targetDate);
      const today = new Date();
      const diffWeeks = Math.max(1, Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7)));
      setWeeksToRace(diffWeeks);
    }
  };

  const toggleDay = (day: number) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const [weeksToRace, setWeeksToRace] = useState<number>(8);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [lastWeekCompliance, setLastWeekCompliance] = useState<number>(100);

  const { blocks: plan, metadata } = useMemo(() => {
    return generateWeeklyPlan(goal, vdot, ctl, availableDays, weeksToRace, lastWeekCompliance);
  }, [goal, vdot, ctl, availableDays, weeksToRace, lastWeekCompliance]);

  const totalTss = plan.reduce((acc, p) => acc + p.tssTarget, 0);
  const totalMins = plan.reduce((acc, p) => acc + p.durationMinutes, 0);

  const paceZonesObj = useMemo(() => getPaceZones(vdot), [vdot]);

  const getTargetPaceString = (type: string) => {
    if (type === 'Rest') return null;
    let zoneKey: 'E' | 'M' | 'T' | 'I' | 'R' = 'E';
    if (type === 'Marathon') zoneKey = 'M';
    else if (type === 'Threshold') zoneKey = 'T';
    else if (type === 'Interval') zoneKey = 'I';
    
    const [fast, slow] = paceZonesObj[zoneKey];
    return `${formatPace(fast)}-${formatPace(slow)}`;
  };

  // Reusable complex slider class with dynamic color
  const getSliderClass = (colorClass: string, shadowColor: string) => `w-full appearance-none bg-transparent 
  [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-black/10 dark:[&::-webkit-slider-runnable-track]:bg-white/10 
  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:rounded-full ${colorClass} ${shadowColor} [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110`;

  return (
    <div className="space-y-6 mt-0 md:mt-2">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-br from-indigo-500/20 to-transparent text-indigo-400 text-[11px] font-medium border border-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Settings2 className="w-3.5 h-3.5" />
            科學訓練引擎
          </div>
          規則化訓練計畫生成器
        </h2>
        <p className="text-[var(--text-secondary)] text-sm">
          體驗純粹的演算法。調整下方的生理指標，即時查看引擎如何適應並重新計算訓練區塊。
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Top Section: Athlete Profile and Summary Metrics */}
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          
          {/* Athlete Profile */}
          <div className="w-full lg:w-[420px] shrink-0 card-glass p-6 transition-all flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <Target className="w-4 h-4 text-indigo-400" />
                運動員檔案
              </h3>
              {hasRealData && (
                <button
                  onClick={() => setIsSimulationMode(!isSimulationMode)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all duration-200 active:scale-95 border ${isSimulationMode
                    ? 'bg-gradient-to-br from-indigo-500/20 to-transparent text-indigo-400 border-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                >
                  {isSimulationMode ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  手動模擬
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {/* Top Stats Rows */}
              <div className="flex flex-row flex-wrap gap-4 w-full">
                
                {/* Col 1: Goal & Date */}
                <div className="flex flex-col gap-3 flex-1 min-w-[120px]">
                  {/* Goal */}
                  <div className="w-full space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">賽事目標</label>
                    <div className="relative group">
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value as RaceGoal)}
                        className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-indigo-500/30 cursor-pointer"
                      >
                        <option value="5K">5K</option>
                        <option value="10K">10K</option>
                        <option value="HalfMarathon">半程馬拉松</option>
                        <option value="Marathon">全程馬拉松</option>
                        <option value="Fitness">一般健康</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Target Date */}
                  {!isSimulationMode && (
                    <div className="w-full space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">真實賽事日期</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Col 2: Weeks & Compliance */}
                {isSimulationMode && (
                  <div className="flex flex-col gap-3 flex-1 min-w-[120px]">
                    {/* Weeks */}
                    <div className="w-full space-y-1.5">
                      <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        <span>距離賽事 (週數)</span>
                        <span className="text-amber-400 font-mono font-bold">{weeksToRace} 週</span>
                      </label>
                      <div className="h-[38px] flex items-center">
                        <input
                          type="range" min="1" max="24" value={weeksToRace}
                          onChange={(e) => setWeeksToRace(Number(e.target.value))}
                          className={getSliderClass('bg-amber-500', '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(245,158,11,0.6)]')}
                        />
                      </div>
                    </div>

                    {/* Compliance */}
                    <div className="w-full space-y-1.5">
                      <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        <span>上週達成率</span>
                        <span className="text-rose-400 font-mono font-bold">{lastWeekCompliance}%</span>
                      </label>
                      <div className="h-[38px] flex items-center">
                        <input
                          type="range" min="0" max="100" value={lastWeekCompliance}
                          onChange={(e) => setLastWeekCompliance(Number(e.target.value))}
                          className={getSliderClass('bg-rose-500', '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(244,63,94,0.6)]')}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Row: Available Days & Save */}
              <div className="flex flex-col sm:flex-row gap-3 items-end mt-2">
                {/* Available Days */}
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">每週可訓練日</label>
                  <div className="flex gap-1 h-[38px]">
                    {DAYS_OF_WEEK.map((day, idx) => {
                      const isSelected = availableDays.includes(idx);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(idx)}
                          className={`flex-1 h-full rounded-md text-[11px] transition-all duration-200 active:scale-[0.92] flex items-center justify-center
                            ${isSelected
                              ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-sm ring-1 ring-white/20 text-white font-bold'
                              : 'bg-background text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 border border-border font-medium'
                            }`}
                        >
                          {day.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="h-[38px] w-full sm:w-auto shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        setGeneratingPlan(true);
                        
                        // 自動儲存使用者的賽事與日期設定 (僅限真實模式)
                        if (!isSimulationMode) {
                          handleSaveRaceSettings();
                        }
                        
                        const today = new Date();
                        const startDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                        const res = await fetch('/api/plan/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            blocks: plan,
                            startDate: startDateStr,
                            goal,
                            vdot,
                          })
                        });
                        if (res.ok) {
                          alert('訓練計畫已成功生成並套用至課表！');
                        } else {
                          alert('生成失敗，請稍後再試。');
                        }
                      } catch (e) {
                        alert('生成發生錯誤');
                      } finally {
                        setGeneratingPlan(false);
                      }
                    }}
                    disabled={plan.length === 0 || generatingPlan}
                    className="w-full sm:w-auto px-4 h-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white text-sm font-bold rounded-lg shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    {generatingPlan ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        生成中
                      </>
                    ) : (
                      <>
                        <CalendarDays className="w-4 h-4" />
                        套用
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="flex-1 flex flex-col justify-between gap-8 card-glass p-6">
            
            {/* Top Row: VDOT, VO2MAX, and CTL Charts */}
            <div className="flex flex-row gap-2 sm:gap-4 w-full justify-around items-center pt-2">
              {/* VDOT */}
              <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
                <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" /> <span className="hidden sm:inline">預估跑力</span><span className="sm:hidden">VDOT</span>
                </span>
                
                <div className="relative flex flex-col items-center w-full max-w-[80px] sm:max-w-[120px]">
                  <svg width="100%" height="auto" viewBox="0 0 100 55" className="overflow-visible drop-shadow-sm">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-black/10 dark:text-white/10" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#818cf8" strokeWidth="8" strokeLinecap="round" 
                          strokeDasharray="125.66" strokeDashoffset={125.66 - (Math.max(0, Math.min(100, ((vdot - 30) / 40) * 100)) / 100) * 125.66} 
                          className="transition-all duration-500 ease-out" />
                  </svg>
                  <div className="absolute bottom-0 flex flex-col items-center translate-y-1">
                    <span className="text-lg sm:text-2xl font-mono font-extrabold text-indigo-400 leading-none">{vdot.toFixed(1)}</span>
                  </div>
                </div>

                {isSimulationMode && (
                  <div className="h-[28px] w-full max-w-[140px] flex items-center mt-1">
                    <input type="range" min="30" max="70" value={vdot} onChange={(e) => setVdot(Number(e.target.value))} className={getSliderClass('bg-indigo-500', '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.6)]')} />
                  </div>
                )}
              </div>

              {/* VO2MAX */}
              <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
                <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" /> <span className="hidden sm:inline">最大攝氧量</span><span className="sm:hidden">VO2MAX</span>
                </span>
                
                <div className="relative flex flex-col items-center w-full max-w-[80px] sm:max-w-[120px]">
                  <svg width="100%" height="auto" viewBox="0 0 100 55" className="overflow-visible drop-shadow-sm">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-black/10 dark:text-white/10" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#22d3ee" strokeWidth="8" strokeLinecap="round" 
                          strokeDasharray="125.66" strokeDashoffset={125.66 - (Math.max(0, Math.min(100, ((vo2max - 30) / 50) * 100)) / 100) * 125.66} 
                          className="transition-all duration-500 ease-out" />
                  </svg>
                  <div className="absolute bottom-0 flex flex-col items-center translate-y-1">
                    <span className="text-lg sm:text-2xl font-mono font-extrabold text-cyan-400 leading-none">{vo2max.toFixed(1)}</span>
                  </div>
                </div>

                {isSimulationMode && (
                  <div className="h-[28px] w-full max-w-[140px] flex items-center mt-1">
                    <input type="range" min="30" max="80" value={vo2max} onChange={(e) => setVo2max(Number(e.target.value))} className={getSliderClass('bg-cyan-500', '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.6)]')} />
                  </div>
                )}
              </div>

              {/* CTL */}
              <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
                <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> <span className="hidden sm:inline">訓練負荷</span><span className="sm:hidden">CTL</span>
                </span>
                
                <div className="relative flex flex-col items-center w-full max-w-[80px] sm:max-w-[120px]">
                  <svg width="100%" height="auto" viewBox="0 0 100 55" className="overflow-visible drop-shadow-sm">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-black/10 dark:text-white/10" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#34d399" strokeWidth="8" strokeLinecap="round" 
                          strokeDasharray="125.66" strokeDashoffset={125.66 - (Math.max(0, Math.min(100, ((ctl - 5) / 95) * 100)) / 100) * 125.66} 
                          className="transition-all duration-500 ease-out" />
                  </svg>
                  <div className="absolute bottom-0 flex flex-col items-center translate-y-1">
                    <span className="text-lg sm:text-2xl font-mono font-extrabold text-emerald-400 leading-none">{ctl.toFixed(1)}</span>
                  </div>
                </div>

                {isSimulationMode && (
                  <div className="h-[28px] w-full max-w-[140px] flex items-center mt-1">
                    <input type="range" min="5" max="100" value={ctl} onChange={(e) => setCtl(Number(e.target.value))} className={getSliderClass('bg-emerald-500', '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.6)]')} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: 3 Metrics */}
            <div className="flex flex-row gap-2 sm:gap-4 justify-around items-center w-full pb-2">
              {/* Training Days */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1">
                <span className="text-[10px] sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> <span className="hidden sm:inline">訓練天數</span><span className="inline sm:hidden">天數</span>
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{availableDays.length}</span>
                  <span className="text-xs sm:text-sm font-sans font-bold text-[var(--text-secondary)]">Days</span>
                </div>
              </div>

              {/* Total TSS */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1">
                <span className="text-[10px] sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" /> <span className="hidden sm:inline">每週總 </span>TSS
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{Math.round(totalTss)}</span>
                </div>
              </div>

              {/* Total Duration */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1">
                <span className="text-[10px] sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /> <span className="hidden sm:inline">總時長</span><span className="inline sm:hidden">時長</span>
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{Math.floor(totalMins / 60)}</span>
                  <span className="text-xs sm:text-sm font-sans font-bold text-[var(--text-secondary)]">h</span>
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{totalMins % 60}</span>
                  <span className="text-xs sm:text-sm font-sans font-bold text-[var(--text-secondary)]">m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Schedule Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {plan.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[var(--text-muted)] bg-black/5 dark:bg-white/5 rounded-xl border border-dashed border-border">
              無資料。請點擊「生成課表」。
            </div>
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const block = plan.find(p => p.dayOfWeek === dayIdx) || { type: 'Rest', dayOfWeek: dayIdx, durationMinutes: 0, tssTarget: 0, description: '休息日' };
              const isRest = block.type === 'Rest';
              
              return (
                <button
                  key={dayIdx}
                  onClick={() => !isRest && setSelectedBlock(block)}
                  disabled={isRest}
                  className={`group flex text-left p-3.5 sm:p-2.5 rounded-2xl sm:rounded-xl border transition-all duration-300 ease-out w-full min-h-[84px] sm:h-36 lg:h-40 ${isRest
                    ? 'bg-transparent border-dashed border-[var(--text-muted)]/30 opacity-60 cursor-default'
                    : 'bg-surface-hover/10 border-border/50 hover:bg-black/5 dark:hover:bg-white/5 hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-lg cursor-pointer'
                    }`}
                >
                  {/* === MOBILE LAYOUT === */}
                  <div className="flex sm:hidden flex-col w-full h-full justify-center gap-3 py-1">
                    {/* Top Row: Day and Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`text-[15px] font-black uppercase tracking-widest ${dayIdx === 0 || dayIdx === 6 ? 'text-pink-500 dark:text-pink-300' : 'text-[var(--text-muted)]'}`}>
                        {DAYS_OF_WEEK[dayIdx]}
                      </span>
                      
                      {!isRest && (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full
                            ${block.type === 'Long' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : ''}
                            ${block.type === 'Easy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}
                            ${['Threshold', 'Interval', 'Marathon'].includes(block.type) ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''}
                          `} />
                          <span className={`text-[12px] font-black uppercase tracking-widest
                            ${block.type === 'Long' ? 'text-amber-500 dark:text-amber-400' : ''}
                            ${block.type === 'Easy' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                            ${['Threshold', 'Interval', 'Marathon'].includes(block.type) ? 'text-rose-600 dark:text-rose-400' : ''}
                          `}>
                            {block.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Two Columns for Stats */}
                    {!isRest ? (
                      <div className="flex items-center justify-between w-full pr-2">
                        {/* Left: Time */}
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          <span className="font-mono text-[16px] text-[var(--text-primary)] font-bold leading-none mt-0.5">
                            {formatDurationHHMMSS(block.durationMinutes)}
                          </span>
                        </div>
                        
                        {/* Right: Pace */}
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                          <span className="font-mono text-[16px] text-[var(--text-primary)] font-bold leading-none mt-0.5">
                            {getTargetPaceString(block.type)} <span className="font-sans text-[12px] text-[var(--text-muted)] font-medium">/km</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex text-[var(--text-muted)] mt-1">
                        <span className="text-sm font-medium">休息日</span>
                      </div>
                    )}
                  </div>

                  {/* === DESKTOP LAYOUT === */}
                  <div className="hidden sm:flex flex-col w-full h-full gap-2">
                    {/* Top: Day and Badge stacked vertically */}
                    <div className="flex flex-col items-start gap-1 w-full">
                      <span className={`text-[13px] font-black uppercase tracking-widest ${dayIdx === 0 || dayIdx === 6 ? 'text-pink-500 dark:text-pink-300' : 'text-[var(--text-muted)]'}`}>
                        {DAYS_OF_WEEK[dayIdx]}
                      </span>
                      {!isRest && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full
                            ${block.type === 'Long' ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]' : ''}
                            ${block.type === 'Easy' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : ''}
                            ${['Threshold', 'Interval', 'Marathon'].includes(block.type) ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]' : ''}
                          `} />
                          <span className={`text-[11px] font-bold uppercase tracking-widest
                            ${block.type === 'Long' ? 'text-amber-500 dark:text-amber-400' : ''}
                            ${block.type === 'Easy' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                            ${['Threshold', 'Interval', 'Marathon'].includes(block.type) ? 'text-rose-600 dark:text-rose-400' : ''}
                          `}>
                            {block.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Stats without background */}
                    {!isRest ? (
                      <div className="flex flex-col gap-2 mt-auto w-full pt-1.5">
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                          <Timer className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          <span className="font-mono text-[14px] font-bold leading-none mt-0.5">{formatDurationHHMMSS(block.durationMinutes)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                          <Gauge className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                          <span className="font-mono text-[14px] font-bold leading-none mt-0.5">
                            {getTargetPaceString(block.type)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-start justify-start text-[var(--text-muted)] w-full mt-auto pt-2">
                        <span className="text-[13px] font-medium">休息日</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Drawer / Modal for Workout Details */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedBlock(null)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm h-full bg-surface border-l border-border p-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col gap-6 overflow-y-auto">
            <button
              onClick={() => setSelectedBlock(null)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pr-10 mt-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                {DAYS_OF_WEEK[selectedBlock.dayOfWeek]} Workout
              </span>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {selectedBlock.type} Run
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card-glass p-4 flex flex-col gap-1 rounded-2xl">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">目標時長</span>
                <span className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">{formatDurationHHMMSS(selectedBlock.durationMinutes)}</span>
              </div>
              <div className="card-glass p-4 flex flex-col gap-1 rounded-2xl">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">訓練壓力 (TSS)</span>
                <span className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">{selectedBlock.tssTarget}</span>
              </div>
            </div>

            <div className="card-glass p-5 flex-1 rounded-2xl">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-400" /> AI 執行指引
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {selectedBlock.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedBlock(null)}
              className="w-full py-3 bg-emerald-500/10 text-emerald-500 font-bold rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all mt-4"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
