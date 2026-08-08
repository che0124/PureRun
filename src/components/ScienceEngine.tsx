'use client';

import { useState, useMemo, useEffect } from 'react';
import { Activity, CalendarDays, TrendingUp, Settings2, Target, Lock, Unlock } from 'lucide-react';
import { generateWeeklyPlan, RaceGoal } from '@/lib/science/scheduler';
import { loadCredentials, saveCredentials } from '@/lib/credentials';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScienceEngine({
  initialVdot = 45,
  initialCtl = 40,
  hasRealData = false
}: {
  initialVdot?: number,
  initialCtl?: number,
  hasRealData?: boolean
}) {
  const [goal, setGoal] = useState<RaceGoal>('HalfMarathon');
  const [targetDate, setTargetDate] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  const [vdot, setVdot] = useState<number>(initialVdot);
  const [ctl, setCtl] = useState<number>(initialCtl);
  const [availableDays, setAvailableDays] = useState<number[]>([0, 2, 4, 6]);

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
      setCtl(initialCtl);
    }
  }, [isSimulationMode, initialVdot, initialCtl]);

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
  const [lastWeekCompliance, setLastWeekCompliance] = useState<number>(100);

  const { blocks: plan, metadata } = useMemo(() => {
    return generateWeeklyPlan(goal, vdot, ctl, availableDays, weeksToRace, lastWeekCompliance);
  }, [goal, vdot, ctl, availableDays, weeksToRace, lastWeekCompliance]);

  const totalTss = plan.reduce((acc, p) => acc + p.tssTarget, 0);
  const totalMins = plan.reduce((acc, p) => acc + p.durationMinutes, 0);

  return (
    <div className="space-y-8 mt-0 md:mt-2">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
          <Settings2 className="w-4 h-4" />
          科學訓練引擎
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">規則化訓練計畫生成器</h2>
        <p className="text-[var(--text-secondary)] text-base">
          體驗純粹的演算法。調整下方的生理指標，即時查看引擎如何適應並重新計算訓練區塊。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,380px)_1fr] gap-8">
        {/* Controls Panel */}
        <div className="space-y-6">
          <div className="bg-[var(--input-bg)] border border-border rounded-3xl p-6 shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-6 text-[var(--text-primary)]">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                運動員檔案
              </h3>
              {hasRealData && (
                <button
                  onClick={() => setIsSimulationMode(!isSimulationMode)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors border ${isSimulationMode
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-border hover:bg-surface-hover'
                    }`}
                >
                  {isSimulationMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  手動模擬
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Goal */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--text-secondary)]">賽事目標</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as RaceGoal)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                >
                  <option value="5K">5K</option>
                  <option value="10K">10K</option>
                  <option value="HalfMarathon">半程馬拉松</option>
                  <option value="Marathon">全程馬拉松</option>
                  <option value="Fitness">一般健康</option>
                </select>
              </div>

              {/* Target Date (Real Mode Settings) */}
              {!isSimulationMode && (
                <div className="space-y-3 border-t border-border pt-4">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">真實賽事日期</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />

                  <button
                    onClick={handleSaveRaceSettings}
                    className="mt-2 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-[var(--text-accent)] font-bold rounded-xl border border-emerald-500/20 transition-all"
                  >
                    {savedStatus ? '✅ 賽事設定已儲存' : '儲存賽事設定'}
                  </button>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    儲存後，儀表板的 AI 課表生成功能將自動抓取此日期進行週期化運算。
                  </p>
                </div>
              )}

              {/* VDOT */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">預估跑力 (VDOT)</label>
                  <span className="text-indigo-400 font-mono font-bold">{vdot.toFixed(1)}</span>
                </div>
                {isSimulationMode ? (
                  <>
                    <input
                      type="range"
                      min="30"
                      max="70"
                      value={vdot}
                      onChange={(e) => setVdot(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <p className="text-xs text-[var(--text-muted)]">決定你的配速區間 (例如：45 ≈ 22:15 5K)。</p>
                  </>
                ) : (
                  <p className="text-xs text-indigo-400/80 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    目前使用從 Garmin 同步的真實跑力數據。開啟「手動模擬」即可微調。
                  </p>
                )}
              </div>

              {/* CTL */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">長期訓練負荷 (CTL)</label>
                  <span className="text-[var(--text-accent)] font-mono font-bold">{ctl.toFixed(1)}</span>
                </div>
                {isSimulationMode ? (
                  <>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={ctl}
                      onChange={(e) => setCtl(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-xs text-[var(--text-muted)]">決定你的每週跑量上限以避免受傷。</p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--text-accent)]/80 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    目前使用從 Garmin 同步的長期訓練負荷數據。開啟「手動模擬」即可微調。
                  </p>
                )}
              </div>

              {/* Weeks to Race */}
              {isSimulationMode && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">距離賽事週數</label>
                    <span className="text-amber-400 font-mono font-bold">{weeksToRace} 週</span>
                  </div>
                  <input
                    type="range" min="1" max="24" value={weeksToRace}
                    onChange={(e) => setWeeksToRace(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    決定訓練階段。目前階段：<span className="font-bold text-[var(--text-primary)]">{metadata.phase}</span>
                  </p>
                </div>
              )}

              {/* Last Week Compliance */}
              {isSimulationMode && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">上週達成率</label>
                    <span className="text-rose-400 font-mono font-bold">{lastWeekCompliance}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={lastWeekCompliance}
                    onChange={(e) => setLastWeekCompliance(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    模擬疲勞動態降載。調整狀態：<span className="font-bold text-[var(--text-primary)]">{metadata.complianceAdjustment}</span>
                  </p>
                </div>
              )}

              {/* Available Days */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--text-secondary)]">每週可訓練日</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const isSelected = availableDays.includes(idx);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(idx)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${isSelected
                            ? 'bg-indigo-500 text-[var(--text-primary)] shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                            : 'bg-surface-hover/50 text-[var(--text-secondary)] hover:bg-surface-hover'
                          }`}
                      >
                        {day.charAt(0)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">

          {/* Stats Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--input-bg)] border border-border rounded-3xl p-5 flex items-center gap-4 backdrop-blur-3xl">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <CalendarDays className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">訓練天數</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{availableDays.length}</p>
              </div>
            </div>
            <div className="bg-[var(--input-bg)] border border-border rounded-3xl p-5 flex items-center gap-4 backdrop-blur-3xl">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-[var(--text-accent)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">每週總 TSS</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(totalTss)}</p>
              </div>
            </div>
            <div className="bg-[var(--input-bg)] border border-border rounded-3xl p-5 flex items-center gap-4 backdrop-blur-3xl">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Activity className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">總時長</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {Math.floor(totalMins / 60)}h {totalMins % 60}m
                </p>
              </div>
            </div>
          </div>

          {/* Generated Plan */}
          <div className="bg-[var(--input-bg)] border border-border rounded-3xl p-2 shadow-2xl backdrop-blur-3xl">
            {plan.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-muted)] font-medium">
                請至少選擇一天來生成訓練計畫。
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto pr-2">
                {plan.map((block) => {
                  const isRest = block.type === 'Rest';
                  return (
                    <div
                      key={block.dayOfWeek}
                      className={`p-5 transition-all hover:bg-surface-hover rounded-2xl ${isRest ? 'opacity-50' : ''
                        }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-20 shrink-0">
                          <span className={`text-sm font-bold uppercase tracking-wider ${block.dayOfWeek === 0 || block.dayOfWeek === 6 ? 'text-rose-400' : 'text-[var(--text-secondary)]'
                            }`}>
                            {DAYS_OF_WEEK[block.dayOfWeek]}
                          </span>
                        </div>

                        {!isRest && (
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border
                                ${block.type === 'Long' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                                ${block.type === 'Easy' ? 'bg-emerald-500/10 text-[var(--text-accent)] border-emerald-500/20' : ''}
                                ${['Threshold', 'Interval', 'Marathon'].includes(block.type) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                              `}>
                                {block.type}
                              </span>
                              <span className="text-[var(--text-primary)] font-medium">
                                {block.durationMinutes} 分鐘
                              </span>
                              <span className="text-[var(--text-muted)] text-sm font-mono">
                                (TSS: {block.tssTarget})
                              </span>
                            </div>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                              {block.description}
                            </p>
                          </div>
                        )}

                        {isRest && (
                          <div className="flex-1">
                            <span className="text-[var(--text-muted)] text-sm font-medium">休息日</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
