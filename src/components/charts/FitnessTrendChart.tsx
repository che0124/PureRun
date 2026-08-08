"use client";

import React, { useMemo } from 'react';
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
}

export default function FitnessTrendChart({ data }: Props) {
  const theme = getChartTheme();
  const options = useMemo(() => {
    const dates = data.map((d) => d.date);
    const ctlData = data.map((d) => d.ctl);
    const atlData = data.map((d) => d.atl);
    const tsbData = data.map((d) => d.tsb);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.gridLineColor,
        textStyle: { color: theme.tooltipText },
        axisPointer: { type: 'cross', label: { backgroundColor: theme.tooltipBg } },
      },
      legend: {
        data: ['長期體能 (CTL)', '短期疲勞 (ATL)', '訓練狀態 (TSB)'],
        textStyle: { color: theme.subtextColor },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { color: theme.subtextColor },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '訓練負荷 (Load)',
          position: 'left',
          axisLine: { show: true, lineStyle: { color: theme.axisLineColor } },
          splitLine: { lineStyle: { color: theme.gridLineColor, type: 'dashed' } },
          axisLabel: { color: theme.subtextColor },
        },
        {
          type: 'value',
          name: '訓練狀態 (Form)',
          position: 'right',
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: theme.subtextColor },
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
              x: 0, y: 0, x2: 0, y2: 1,
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
  }, [data, theme]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-surface border border-border">
        <p className="text-[var(--text-secondary)]">目前尚無體能數據</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] p-6 w-full h-full flex flex-col justify-center min-h-[200px]">
      <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)] tracking-wide">訓練負荷與體能趨勢</h3>
      <ReactECharts option={options} style={{ height: '100%', width: '100%', minHeight: '200px' }} />
    </div>
  );
}
