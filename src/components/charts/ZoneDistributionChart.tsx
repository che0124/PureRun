"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface ZoneData {
  name: string; // e.g. "Z1 Recovery", "Z2 Aerobic"
  value: number; // Duration in minutes or percentage
  color: string;
}

interface Props {
  title: string;
  data: ZoneData[];
  type?: 'pie' | 'bar';
}

export default function ZoneDistributionChart({ title, data, type = 'bar' }: Props) {
  const options = useMemo(() => {
    if (type === 'pie') {
      return {
        tooltip: { trigger: 'item', backgroundColor: 'rgba(15, 23, 42, 0.9)', textStyle: { color: '#fff' } },
        legend: { 
          bottom: '0%', 
          left: 'center', 
          itemWidth: 10, 
          itemHeight: 10, 
          textStyle: { color: '#94a3b8', fontSize: 10 } 
        },
        series: [
          {
            name: title,
            type: 'pie',
            center: ['50%', '42%'],
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#0f172a',
              borderWidth: 2,
            },
            label: { show: false, position: 'center' },
            emphasis: {
              label: { show: true, fontSize: '18', fontWeight: 'bold', color: '#fff' },
            },
            labelLine: { show: false },
            data: data.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })),
          },
        ],
      };
    }

    // Bar chart (Stacked horizontal)
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        textStyle: { color: '#fff' },
      },
      legend: { show: false },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['Zones'], show: false },
      series: data.map(d => ({
        name: d.name,
        type: 'bar',
        stack: 'total',
        label: { show: true, formatter: '{a}', color: '#fff', fontSize: 10 },
        emphasis: { focus: 'series' },
        itemStyle: { color: d.color, borderRadius: 4 },
        data: [d.value],
      })),
    };
  }, [data, title, type]);

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800 shadow-xl w-full">
      <h3 className="mb-4 text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
      <ReactECharts option={options} style={{ height: type === 'pie' ? '300px' : '80px', width: '100%' }} />
    </div>
  );
}
