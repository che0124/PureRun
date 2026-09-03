'use client';

import React, { useState } from 'react';
import { TrendingUp, ArrowLeft, Info, Zap } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface VdotTrendPoint {
  date: string;
  vdot: number;
  activityName: string;
}

interface PaceZone {
  label: string;
  pace: string;
  color: string;
  bg: string;
}

interface VdotInteractiveCardProps {
  currentVdot: number;
  paceZones: PaceZone[];
  trendData: VdotTrendPoint[];
  className?: string;
}

export default function VdotInteractiveCard({ currentVdot, paceZones, trendData, className = "lg:col-span-4" }: VdotInteractiveCardProps) {
  const [showTrend, setShowTrend] = useState(false);

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: '#171717',
      borderColor: '#333',
      textStyle: { color: '#eee' },
      formatter: (params: any) => {
        const p = params[0];
        const dataPoint = trendData[p.dataIndex];
        return `<div class="font-sans">
                  <div class="text-xs text-neutral-400 mb-1">${dataPoint.date}</div>
                  <div class="font-bold text-white text-sm truncate max-w-[200px] mb-1">${dataPoint.activityName}</div>
                  <div class="font-bold text-emerald-400">VDOT: ${p.value}</div>
                </div>`;
      }
    },
    grid: { top: 20, right: 10, bottom: 20, left: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.date),
      axisLabel: {
        color: '#666',
        fontSize: 10,
        formatter: (val: string) => {
          const parts = val.split('-');
          return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
        }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
      axisLabel: { color: '#666', fontSize: 10 }
    },
    series: [
      {
        data: trendData.map(d => d.vdot),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#10b981' }, // emerald-500
        lineStyle: { width: 3, color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.01)' }
            ]
          }
        }
      }
    ]
  };

  return (
    <div className={`${className} card-glass p-6 flex flex-col relative group h-full overflow-hidden min-h-[420px] lg:min-h-0`}>
      
      {/* Front: VDOT & Paces */}
      <div className={`flex flex-col h-full transition-all duration-500 ease-in-out absolute inset-0 p-6 ${showTrend ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
        <div className="flex justify-between items-center h-8 mb-4 shrink-0">
          <div 
            className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 cursor-help"
            title="VDOT 反映的是你的「有效跑力」，結合了最大攝氧量與跑步經濟性。數值越高代表長跑能力越好。"
          >
            <Zap className="w-4 h-4 text-emerald-500" /> 當前跑力 (VDOT) <Info className="w-3.5 h-3.5 text-neutral-500 ml-[-4px]" />
          </div>
          <button 
            onClick={() => setShowTrend(true)}
            className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 cursor-pointer transition-colors"
            title="查看趨勢"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-7xl sm:text-[80px] font-mono font-extrabold text-white mb-2 tracking-tighter shrink-0 cursor-pointer leading-none" onClick={() => setShowTrend(true)}>
            {currentVdot > 0 ? currentVdot.toFixed(1) : '--'}
            <span className="text-3xl text-emerald-400 ml-2 align-top text-shadow-sm font-bold">+</span>
          </div>
          <div className="text-sm text-neutral-400 mb-6 shrink-0 font-medium">基於近 90 天最佳表現</div>
          
          <div className="flex flex-col gap-2 -mx-2 px-2">
            {paceZones.map((zone) => (
              <div key={zone.label} className={`flex items-center justify-between text-sm p-2 rounded-xl transition-colors cursor-default ${zone.bg}`}>
                <span className={`font-bold ${zone.color}`}>{zone.label}</span>
                <span className="font-mono text-neutral-300">{zone.pace} /km</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Back: VDOT Trend Chart */}
      <div className={`flex flex-col h-full transition-all duration-500 ease-in-out absolute inset-0 p-6 bg-surface z-10 ${showTrend ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center h-8 mb-4 shrink-0">
          <button 
            onClick={() => setShowTrend(false)}
            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> 返回跑力配速
          </button>
        </div>
        
        <div className="flex-1 w-full relative min-h-0 -mx-4 -mb-2">
          {trendData.length > 0 ? (
            <ReactECharts
              option={chartOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              尚無近期的有效跑步數據
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
