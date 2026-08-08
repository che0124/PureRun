"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { getChartTheme } from '@/lib/chartTheme';

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
  const theme = getChartTheme();
  const options = useMemo(() => {
    if (type === 'pie') {
      return {
        tooltip: { trigger: 'item', backgroundColor: theme.tooltipBg, textStyle: { color: theme.tooltipText } },
        legend: { 
          bottom: '0%', 
          left: 'center', 
          itemWidth: 10, 
          itemHeight: 10, 
          textStyle: { color: theme.subtextColor, fontSize: 10 } 
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
              borderColor: theme.backgroundColor,
              borderWidth: 2,
            },
            label: { show: false, position: 'center' },
            emphasis: {
              label: { show: true, fontSize: '18', fontWeight: 'bold', color: theme.tooltipText },
            },
            labelLine: { show: false },
            data: data.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })),
          },
        ],
      };
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: theme.tooltipBg,
        textStyle: { color: theme.tooltipText },
      },
      legend: { show: false },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['Zones'], show: false },
      series: data.map(d => ({
        name: d.name,
        type: 'bar',
        stack: 'total',
        label: { show: true, formatter: '{a}', color: theme.tooltipText, fontSize: 10 },
        emphasis: { focus: 'series' },
        itemStyle: { color: d.color, borderRadius: 4 },
        data: [d.value],
      })),
    };
  }, [data, title, type, theme]);

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-[1.5rem] p-4 md:p-6 w-full h-full flex flex-col justify-center">
      <ReactECharts option={options} style={{ height: '100%', width: '100%', minHeight: '200px' }} />
    </div>
  );
}
