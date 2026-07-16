'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, RefreshCw, AlertCircle } from 'lucide-react';

export type HRCalcMethod = 'hrr' | 'max_hr';

export interface HRZonesBPM {
  z1Bottom: number; // Z1 Bottom
  z2Bottom: number; // Z1 Max / Z2 Bottom
  z3Bottom: number; // Z2 Max / Z3 Bottom
  z4Bottom: number; // Z3 Max / Z4 Bottom
  z5Bottom: number; // Z4 Max / Z5 Bottom
}

interface Props {
  minHr: number;
  setMinHr: (v: number) => void;
  maxHr: number;
  setMaxHr: (v: number) => void;
  calcMethod: HRCalcMethod;
  setCalcMethod: (v: HRCalcMethod) => void;
  zones: HRZonesBPM;
  setZones: (v: HRZonesBPM) => void;
  onValidationChange: (isValid: boolean) => void;
}

export default function HeartRateZoneSettings({
  minHr, setMinHr, maxHr, setMaxHr, calcMethod, setCalcMethod, zones, setZones, onValidationChange
}: Props) {
  const [errorLines, setErrorLines] = useState<number[]>([]);

  // Constants for default percentages
  const DEFAULTS_HRR = [59, 74, 84, 88, 95]; // Bottom % for Z1-Z5
  const DEFAULTS_MAXHR = [59, 74, 84, 88, 95];

  // Helper to convert % to BPM
  const pctToBpm = (pct: number, method: HRCalcMethod, min: number, max: number) => {
    if (method === 'hrr') {
      return Math.round(min + (max - min) * (pct / 100));
    }
    return Math.round(max * (pct / 100));
  };

  // Helper to convert BPM to %
  const bpmToPct = (bpm: number, method: HRCalcMethod, min: number, max: number) => {
    let rawPct = 0;
    if (method === 'hrr') {
      const hrr = max - min;
      if (hrr === 0) return 0;
      rawPct = ((bpm - min) / hrr * 100);
    } else {
      if (max === 0) return 0;
      rawPct = (bpm / max * 100);
    }
    
    // Check if rounding to the nearest integer produces the exact same BPM to avoid floating point UI artifacts
    const roundedPct = Math.round(rawPct);
    if (pctToBpm(roundedPct, method, min, max) === bpm) {
      return roundedPct;
    }
    return Number(rawPct.toFixed(1));
  };

  // The 5 zones array representation for easy mapping
  // Index 0: Z1, Index 1: Z2, ..., Index 4: Z5
  const zoneKeys: (keyof HRZonesBPM)[] = ['z1Bottom', 'z2Bottom', 'z3Bottom', 'z4Bottom', 'z5Bottom'];
  const zoneColors = ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const zoneNames = ['Z1 恢復', 'Z2 有氧', 'Z3 節奏', 'Z4 乳酸', 'Z5 無氧'];

  const validateZones = (newZones: HRZonesBPM, max: number) => {
    const vals = [newZones.z1Bottom, newZones.z2Bottom, newZones.z3Bottom, newZones.z4Bottom, newZones.z5Bottom, max];
    const errors: number[] = [];
    for (let i = 0; i < vals.length - 1; i++) {
      if (vals[i] >= vals[i + 1]) {
        errors.push(i);
        if (i + 1 < 5) errors.push(i + 1);
      }
    }
    setErrorLines(errors);
    const isValid = errors.length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  // Run validation on mount and when zones/maxHr change
  useEffect(() => {
    validateZones(zones, maxHr);
  }, [zones, maxHr]);

  const handleBpmChange = (index: number, val: string) => {
    const bpm = parseInt(val, 10);
    if (isNaN(bpm)) return;
    const newZones = { ...zones, [zoneKeys[index]]: bpm };
    setZones(newZones);
  };

  const handlePctChange = (index: number, val: string) => {
    const pct = parseFloat(val);
    if (isNaN(pct)) return;
    const bpm = pctToBpm(pct, calcMethod, minHr, maxHr);
    const newZones = { ...zones, [zoneKeys[index]]: bpm };
    setZones(newZones);
  };

  const handleMethodChange = (method: HRCalcMethod) => {
    setCalcMethod(method);
    applyDefaults(method, minHr, maxHr);
  };

  const applyDefaults = (method: HRCalcMethod, min: number, max: number) => {
    const pcts = method === 'hrr' ? DEFAULTS_HRR : DEFAULTS_MAXHR;
    const newZones = {
      z1Bottom: pctToBpm(pcts[0], method, min, max),
      z2Bottom: pctToBpm(pcts[1], method, min, max),
      z3Bottom: pctToBpm(pcts[2], method, min, max),
      z4Bottom: pctToBpm(pcts[3], method, min, max),
      z5Bottom: pctToBpm(pcts[4], method, min, max),
    };
    setZones(newZones);
  };

  const handleMinHrChange = (val: string) => {
    const newMin = Number(val);
    if (isNaN(newMin)) return;
    
    const pcts = zoneKeys.map(key => bpmToPct(zones[key], calcMethod, minHr, maxHr));
    setMinHr(newMin);
    
    const newZones = { ...zones };
    zoneKeys.forEach((key, i) => {
      newZones[key] = pctToBpm(pcts[i], calcMethod, newMin, maxHr);
    });
    setZones(newZones);
  };

  const handleMaxHrChange = (val: string) => {
    const newMax = Number(val);
    if (isNaN(newMax)) return;
    
    const pcts = zoneKeys.map(key => bpmToPct(zones[key], calcMethod, minHr, maxHr));
    setMaxHr(newMax);
    
    const newZones = { ...zones };
    zoneKeys.forEach((key, i) => {
      newZones[key] = pctToBpm(pcts[i], calcMethod, minHr, newMax);
    });
    setZones(newZones);
  };

  const handleReset = () => {
    applyDefaults(calcMethod, minHr, maxHr);
  };

  return (
    <div className="space-y-6 pt-4 border-t border-slate-800 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>心率區間設定 (Heart Rate Zones)</span>
        </h3>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500/50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重置為預設值
        </button>
      </div>

      {/* Top Basic Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-900/50 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">根據 (Based On)</label>
          <select
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all appearance-none cursor-pointer"
            value={calcMethod}
            onChange={e => handleMethodChange(e.target.value as HRCalcMethod)}
          >
            <option value="hrr">% 儲備心率 (HRR)</option>
            <option value="max_hr">% 最大心率 (Max HR)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">靜止心率 (Resting HR)</label>
          <input
            type="number"
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-lg p-3 text-sm text-slate-100 font-mono transition-all outline-none disabled:opacity-50"
            value={minHr}
            onChange={e => handleMinHrChange(e.target.value)}
            disabled={calcMethod === 'max_hr'} // Resting HR is ignored in Max HR%
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">最大心率 (Max HR)</label>
          <input
            type="number"
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-lg p-3 text-sm text-slate-100 font-mono transition-all outline-none"
            value={maxHr}
            onChange={e => handleMaxHrChange(e.target.value)}
          />
        </div>
      </div>

      {/* Zone List */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs font-bold uppercase text-slate-400 tracking-wider">
          <div className="col-span-1 text-center">區域</div>
          <div className="col-span-3">名稱</div>
          <div className="col-span-4 text-center">%</div>
          <div className="col-span-4 text-center">BPM</div>
        </div>

        <div className="p-4 space-y-2">
          {/* Max HR Row */}
          <div className="grid grid-cols-12 gap-4 items-center px-2 py-1">
            <div className="col-span-1"></div>
            <div className="col-span-3 text-sm font-bold text-slate-300">最大</div>
            <div className="col-span-4 text-center text-sm font-mono text-slate-500">100%</div>
            <div className="col-span-4 text-center text-sm font-mono text-slate-300 bg-slate-900 py-1.5 rounded-md border border-slate-800">{maxHr}</div>
          </div>

          {zoneKeys.map((key, i) => {
            const revIndex = 4 - i; // Render Z5 first, down to Z1
            const currentKey = zoneKeys[revIndex];
            const bpmVal = zones[currentKey];
            const pctVal = bpmToPct(bpmVal, calcMethod, minHr, maxHr);
            
            const isError = errorLines.includes(revIndex);

            return (
              <React.Fragment key={currentKey}>
                <div className="grid grid-cols-12 gap-4 items-center group">
                  <div className="col-span-1 flex justify-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-950" style={{ backgroundColor: zoneColors[revIndex] }}>
                      {revIndex + 1}
                    </div>
                  </div>
                  <div className="col-span-3 text-sm font-bold text-slate-200">
                    {zoneNames[revIndex]}
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="number"
                      step="0.1"
                      className={`w-full bg-slate-900 border ${isError ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/40' : 'border-slate-700 focus:border-emerald-400 focus:ring-emerald-400/40'} rounded-lg p-2 text-center text-sm text-slate-100 font-mono transition-all outline-none focus:ring-1`}
                      value={pctVal}
                      onChange={e => handlePctChange(revIndex, e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="number"
                      className={`w-full bg-slate-900 border ${isError ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/40' : 'border-slate-700 focus:border-emerald-400 focus:ring-emerald-400/40'} rounded-lg p-2 text-center text-sm text-slate-100 font-mono transition-all outline-none focus:ring-1`}
                      value={bpmVal}
                      onChange={e => handleBpmChange(revIndex, e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">bpm</span>
                  </div>
                </div>
                {/* Visual Connector / Bracket */}
                {revIndex > 0 && (
                  <div className="grid grid-cols-12 px-2">
                    <div className="col-span-1"></div>
                    <div className="col-span-11 h-4 border-l-2 border-slate-800 ml-2"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {errorLines.length > 0 && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-4 h-4" />
          心率區間數值必須保持遞增 (Z1 &lt; Z2 &lt; Z3 &lt; Z4 &lt; Z5 &lt; 最大心率)。請修正標示紅框的數值。
        </div>
      )}

    </div>
  );
}
