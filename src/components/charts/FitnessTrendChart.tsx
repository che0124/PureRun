"use client";

import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { getChartTheme } from '@/lib/chartTheme';

export interface FitnessDataPoint {
  date: string;
  ctl: number; // Fitness
  atl: number; // Fatigue
  tsb: number; // Form
}

interface Props {
  data: FitnessDataPoint[];
  todayFitness?: { ctl: number; atl: number; tsb: number } | null;
}

export default function FitnessTrendChart({ data, todayFitness }: Props) {
  const theme = getChartTheme();

  const [visibleSeries, setVisibleSeries] = useState({
    ctl: true,
    atl: true,
    tsb: true,
  });

  const toggleSeries = (key: 'ctl' | 'atl' | 'tsb') => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const latest = useMemo(() => {
    if (todayFitness) return todayFitness;
    if (data && data.length > 0) return data[data.length - 1];
    return null;
  }, [todayFitness, data]);

  const options = useMemo(() => {
    const dates = data.map((d) => d.date);
    const ctlData = data.map((d) => d.ctl);
    const atlData = data.map((d) => d.atl);
    const tsbData = data.map((d) => d.tsb);

    return {
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: theme.tooltipBg,
        borderColor: theme.gridLineColor,
        textStyle: { color: theme.tooltipText },
        axisPointer: { type: 'cross', label: { backgroundColor: theme.tooltipBg } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const rawDate = params[0].axisValue;
          let dateStr = rawDate;
          const parts = rawDate?.split('-');
          if (parts?.length === 3) {
            dateStr = `${parts[0]}/${parts[1]}/${parts[2]}`;
          }
          let res = `<div class="font-sans text-xs">
            <div class="font-bold text-neutral-300 mb-1.5 pb-1 border-b border-neutral-700/60">${dateStr}</div>`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params.forEach((item: any) => {
            const marker = item.marker || '';
            const name = item.seriesName;
            const val = typeof item.value === 'number' ? item.value.toFixed(1) : item.value;
            res += `<div class="flex items-center justify-between gap-3 py-0.5">
              <span class="flex items-center gap-1 text-neutral-400">${marker} ${name}</span>
              <span class="font-mono font-bold text-neutral-200">${val}</span>
            </div>`;
          });
          res += `</div>`;
          return res;
        },
      },
      legend: {
        show: false,
        selected: {
          '長期體能 (CTL)': visibleSeries.ctl,
          '短期疲勞 (ATL)': visibleSeries.atl,
          '訓練狀態 (TSB)': visibleSeries.tsb,
        },
      },
      grid: {
        top: 14,
        right: 12,
        bottom: 12,
        left: 10,
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisTick: { show: false },
          axisLabel: {
            color: theme.subtextColor,
            fontSize: 10,
            formatter: (val: string) => {
              if (!val) return '';
              const parts = val.split('-');
              if (parts.length === 3) {
                return `${parts[1]}/${parts[2]}`;
              }
              return val;
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: theme.gridLineColor, type: 'dashed' } },
          axisLabel: { color: theme.subtextColor, fontSize: 10 },
        },
        {
          type: 'value',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: theme.subtextColor, fontSize: 10 },
        },
      ],
      series: [
        {
          name: '短期疲勞 (ATL)',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 0 },
          areaStyle: {
            opacity: 0.8,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
              ],
            },
          },
          itemStyle: { color: '#ef4444' },
          data: atlData,
        },
        {
          name: '長期體能 (CTL)',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          data: ctlData,
        },
        {
          name: '訓練狀態 (TSB)',
          type: 'bar',
          yAxisIndex: 1,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: (params: any) => (params.value >= 0 ? '#10b981' : '#f59e0b'),
          },
          data: tsbData,
        },
      ],
    };
  }, [data, theme, visibleSeries]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-surface border border-border">
        <p className="text-[var(--text-secondary)]">目前尚無體能數據</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* 重新設計的 3 欄可點擊切換圖例列（置於圖表上方） */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-2 z-10 relative shrink-0">
        {/* CTL 按鈕 */}
        <button
          type="button"
          onClick={() => toggleSeries('ctl')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none border ${
            visibleSeries.ctl
              ? 'bg-blue-500/10 border-blue-500/30 text-neutral-200 hover:bg-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.12)]'
              : 'bg-neutral-900/30 border-neutral-800/40 text-neutral-500 opacity-40 hover:opacity-60'
          }`}
          title={visibleSeries.ctl ? '點擊隱藏長期體能 (CTL)' : '點擊顯示長期體能 (CTL)'}
        >
          <span className={`w-3.5 h-[2.5px] rounded-full transition-colors ${
            visibleSeries.ctl ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-neutral-600'
          }`} />
          <span className="font-semibold">CTL</span>
          <span className="text-[10px] sm:text-[11px] opacity-80">體能</span>
          <span className={`font-mono font-bold ml-0.5 ${visibleSeries.ctl ? 'text-blue-400' : 'text-neutral-500'}`}>
            {latest?.ctl ?? '--'}
          </span>
        </button>

        {/* ATL 按鈕 */}
        <button
          type="button"
          onClick={() => toggleSeries('atl')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none border ${
            visibleSeries.atl
              ? 'bg-rose-500/10 border-rose-500/30 text-neutral-200 hover:bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.12)]'
              : 'bg-neutral-900/30 border-neutral-800/40 text-neutral-500 opacity-40 hover:opacity-60'
          }`}
          title={visibleSeries.atl ? '點擊隱藏短期疲勞 (ATL)' : '點擊顯示短期疲勞 (ATL)'}
        >
          <span className={`w-3 h-2 rounded-[2px] transition-colors ${
            visibleSeries.atl ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]' : 'bg-neutral-600'
          }`} />
          <span className="font-semibold">ATL</span>
          <span className="text-[10px] sm:text-[11px] opacity-80">疲勞</span>
          <span className={`font-mono font-bold ml-0.5 ${visibleSeries.atl ? 'text-rose-400' : 'text-neutral-500'}`}>
            {latest?.atl ?? '--'}
          </span>
        </button>

        {/* TSB 按鈕 */}
        <button
          type="button"
          onClick={() => toggleSeries('tsb')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none border ${
            visibleSeries.tsb
              ? (latest?.tsb ?? 0) >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-neutral-200 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                : 'bg-amber-500/10 border-amber-500/30 text-neutral-200 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
              : 'bg-neutral-900/30 border-neutral-800/40 text-neutral-500 opacity-40 hover:opacity-60'
          }`}
          title={visibleSeries.tsb ? '點擊隱藏訓練狀態 (TSB)' : '點擊顯示訓練狀態 (TSB)'}
        >
          <span className={`w-1.5 h-2.5 rounded-[1px] transition-colors ${
            visibleSeries.tsb
              ? (latest?.tsb ?? 0) >= 0
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
              : 'bg-neutral-600'
          }`} />
          <span className="font-semibold">TSB</span>
          <span className="text-[10px] sm:text-[11px] opacity-80">狀態</span>
          <span className={`font-mono font-bold ml-0.5 ${
            visibleSeries.tsb
              ? (latest?.tsb ?? 0) >= 0 ? 'text-emerald-400' : 'text-amber-400'
              : 'text-neutral-500'
          }`}>
            {latest?.tsb ?? '--'}
          </span>
        </button>
      </div>

      {/* 圖表畫布 */}
      <div className="flex-1 w-full relative min-h-0">
        <div className="absolute inset-0">
          <ReactECharts
            option={options}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        </div>
      </div>
    </div>
  );
}
