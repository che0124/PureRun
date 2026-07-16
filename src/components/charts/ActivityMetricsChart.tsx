"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface TimeSeriesDataPoint {
  time: string; // or distance
  hr: number;
  pace: number; // in seconds/km to plot on Y axis inverted, or directly as pace float
  elevation: number;
  cadence: number;
}

interface Props {
  data: TimeSeriesDataPoint[];
}

export default function ActivityMetricsChart({ data }: Props) {
  const options = useMemo(() => {
    const xAxisData = data.map(d => d.time);
    const hrData = data.map(d => d.hr);
    const paceData = data.map(d => d.pace);
    const elevationData = data.map(d => d.elevation);
    const cadenceData = data.map(d => d.cadence);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'cross', label: { backgroundColor: '#334155' } },
      },
      legend: {
        data: ['Pace', 'Heart Rate', 'Cadence', 'Elevation'],
        top: 0,
        textStyle: { color: '#94a3b8' },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: [
        { left: 60, right: 30, top: '4%', height: '18%', containLabel: false },
        { left: 60, right: 30, top: '28%', height: '18%', containLabel: false },
        { left: 60, right: 30, top: '52%', height: '18%', containLabel: false },
        { left: 60, right: 30, top: '76%', height: '18%', containLabel: false }
      ],
      xAxis: [
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 0,
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8' },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 1,
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8' },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 2,
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8' },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 3,
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8' },
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Pace',
          nameLocation: 'start',
          gridIndex: 0,
          position: 'left',
          inverse: true,
          axisLine: { show: true, lineStyle: { color: '#3b82f6' } },
          splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
          axisLabel: {
            color: '#94a3b8',
            formatter: (val: number) => {
              const mins = Math.floor(val);
              const secs = Math.floor((val - mins) * 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            },
          },
        },
        {
          type: 'value',
          name: 'BPM',
          gridIndex: 1,
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#ef4444' } },
          splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
          axisLabel: { color: '#94a3b8' },
          min: 'dataMin',
        },
        {
          type: 'value',
          name: 'SPM',
          gridIndex: 2,
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#8b5cf6' } }, // purple for cadence
          splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
          axisLabel: { color: '#94a3b8' },
          min: (val: any) => Math.max(0, Math.floor(val.min - 15)),
          max: (val: any) => Math.ceil(val.max + 15),
        },
        {
          type: 'value',
          name: 'Elev',
          gridIndex: 3,
          position: 'left', // Keep all axes on the left for uniform alignment
          axisLine: { show: true, lineStyle: { color: '#10b981' } },
          splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
          axisLabel: { color: '#94a3b8', formatter: '{value}m' },
          min: (val: any) => Math.max(0, Math.floor(val.min - 30)),
          max: (val: any) => Math.ceil(val.max + 30),
        }
      ],
      series: [
        {
          name: 'Pace',
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          symbol: 'none',
          itemStyle: { color: '#3b82f6' },
          data: paceData,
        },
        {
          name: 'Heart Rate',
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          symbol: 'none',
          itemStyle: { color: '#ef4444' },
          data: hrData,
        },
        {
          name: 'Cadence',
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          smooth: true,
          symbol: 'none',
          itemStyle: { color: '#8b5cf6' },
          data: cadenceData,
        },
        {
          name: 'Elevation',
          type: 'line',
          xAxisIndex: 3,
          yAxisIndex: 3,
          smooth: true,
          symbol: 'none',
          areaStyle: { opacity: 0.15, color: '#10b981' },
          lineStyle: { width: 1, color: '#10b981' },
          itemStyle: { color: '#10b981' },
          data: elevationData,
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) return null;

    return (
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800 shadow-xl w-full">
        <ReactECharts option={options} style={{ height: '1000px', width: '100%' }} />
      </div>
    );
}
