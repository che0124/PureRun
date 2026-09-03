'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface TrainingLoadChartProps {
  data: { date: string; load: number }[];
}

export default function TrainingLoadChart({ data }: TrainingLoadChartProps) {
  const dates = data.map(d => d.date);
  const loads = data.map(d => Math.round(d.load));

  const option = {
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: '#171717',
      borderColor: '#333',
      textStyle: { color: '#eee' },
      formatter: (params: any) => {
        const val = params[0];
        return `<div class="font-sans">
                  <div class="text-xs text-neutral-400 mb-1">${val.name}</div>
                  <div class="font-bold text-emerald-400">TRIMP: ${val.value}</div>
                </div>`;
      }
    },
    grid: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 10,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        color: '#666',
        fontSize: 10,
        formatter: (val: string) => {
          const parts = val.split('-');
          if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
          return val;
        }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { color: '#222', type: 'dashed' }
      },
      axisLabel: { color: '#666', fontSize: 10 }
    },
    series: [
      {
        data: loads,
        type: 'bar',
        itemStyle: {
          color: (params: any) => {
            return params.value > 150 ? '#f59e0b' : '#10b981'; // amber-500 for high load, emerald for normal
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#34d399'
          }
        }
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
