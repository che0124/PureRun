"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

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
  const options = useMemo(() => {
    const dates = data.map((d) => d.date);
    const ctlData = data.map((d) => d.ctl);
    const atlData = data.map((d) => d.atl);
    const tsbData = data.map((d) => d.tsb);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
        axisPointer: { type: 'cross', label: { backgroundColor: '#334155' } },
      },
      legend: {
        data: ['長期體能 (CTL)', '短期疲勞 (ATL)', '訓練狀態 (TSB)'],
        textStyle: { color: '#94a3b8' },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8' },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '訓練負荷 (Load)',
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#475569' } },
          splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
          axisLabel: { color: '#94a3b8' },
        },
        {
          type: 'value',
          name: '訓練狀態 (Form)',
          position: 'right',
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#94a3b8' },
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
            color: (params: any) => (params.value >= 0 ? '#10b981' : '#f59e0b'),
          },
          data: tsbData,
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
        <p className="text-slate-400">目前尚無體能數據</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800 shadow-xl w-full">
      <h3 className="mb-4 text-lg font-semibold text-white">訓練負荷與體能趨勢</h3>
      <ReactECharts option={options} style={{ height: '350px', width: '100%' }} />
    </div>
  );
}
