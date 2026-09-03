"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { getChartTheme } from '@/lib/chartTheme';

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
  const theme = getChartTheme();
  const options = useMemo(() => {
    const xAxisData = data.map(d => d.time);
    const hrData = data.map(d => d.hr);
    const paceData = data.map(d => d.pace);
    const elevationData = data.map(d => d.elevation);
    const cadenceData = data.map(d => d.cadence);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.tooltipBg,
        textStyle: { color: theme.tooltipText },
        axisPointer: { type: 'cross', label: { backgroundColor: theme.tooltipBg } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          let tooltipHtml = `<div style="font-weight:bold;margin-bottom:4px">${params[0].axisValue}</div>`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params.forEach((param: any) => {
            const seriesName = param.seriesName;
            let val = param.value;
            if (val === undefined || val === null) {
              tooltipHtml += `<div>${param.marker} ${seriesName}: --</div>`;
              return;
            }
            if (seriesName === 'Pace') {
              const mins = Math.floor(val);
              const secs = Math.floor((val - mins) * 60);
              val = `${mins}:${secs.toString().padStart(2, '0')}`;
            } else if (seriesName === 'Elevation' || seriesName === 'Cadence' || seriesName === 'Heart Rate') {
              val = Math.round(val);
            }
            tooltipHtml += `<div>${param.marker} ${seriesName}: <b>${val}</b></div>`;
          });
          return tooltipHtml;
        }
      },
      legend: {
        data: ['Pace', 'Heart Rate', 'Cadence', 'Elevation'],
        top: 0,
        textStyle: { color: theme.subtextColor },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: [
        { left: 50, right: 20, top: '6%', height: '18%', containLabel: false },
        { left: 50, right: 20, top: '29%', height: '18%', containLabel: false },
        { left: 50, right: 20, top: '52%', height: '18%', containLabel: false },
        { left: 50, right: 20, top: '75%', height: '18%', containLabel: false }
      ],
      xAxis: [
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 0,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 1,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 2,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 3,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { color: theme.subtextColor },
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
          splitLine: { lineStyle: { color: theme.gridLineColor, type: 'dashed' } },
          axisLabel: {
            color: theme.subtextColor,
            formatter: (val: number) => {
              const mins = Math.floor(val);
              const secs = Math.floor((val - mins) * 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            },
          },
          axisPointer: {
            label: {
              formatter: (params: any) => {
                const val = params.value;
                const mins = Math.floor(val);
                const secs = Math.floor((val - mins) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
              }
            }
          }
        },
        {
          type: 'value',
          name: 'BPM',
          gridIndex: 1,
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#ef4444' } },
          splitLine: { lineStyle: { color: theme.gridLineColor, type: 'dashed' } },
          axisLabel: { color: theme.subtextColor },
          axisPointer: {
            label: {
              formatter: (params: any) => `${Math.round(params.value)}`
            }
          },
          min: 'dataMin',
        },
        {
          type: 'value',
          name: 'SPM',
          gridIndex: 2,
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#8b5cf6' } }, // purple for cadence
          splitLine: { lineStyle: { color: theme.gridLineColor, type: 'dashed' } },
          axisLabel: { color: theme.subtextColor },
          axisPointer: {
            label: {
              formatter: (params: any) => `${Math.round(params.value)}`
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          min: (val: any) => Math.max(0, Math.floor(val.min - 15)),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          max: (val: any) => Math.ceil(val.max + 15),
        },
        {
          type: 'value',
          name: 'Elev',
          gridIndex: 3,
          position: 'left', // Keep all axes on the left for uniform alignment
          axisLine: { show: true, lineStyle: { color: '#10b981' } },
          splitLine: { lineStyle: { color: theme.gridLineColor, type: 'dashed' } },
          axisLabel: { color: theme.subtextColor, formatter: '{value}m' },
          axisPointer: {
            label: {
              formatter: (params: any) => `${Math.round(params.value)}m`
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          min: (val: any) => Math.max(0, Math.floor(val.min - 30)),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          showSymbol: false,
          itemStyle: { color: '#3b82f6' },
          data: paceData,
        },
        {
          name: 'Heart Rate',
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#ef4444' },
          data: hrData,
        },
        {
          name: 'Cadence',
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#8b5cf6' },
          data: cadenceData,
        },
        {
          name: 'Elevation',
          type: 'line',
          xAxisIndex: 3,
          yAxisIndex: 3,
          smooth: true,
          showSymbol: false,
          areaStyle: { opacity: 0.15, color: '#10b981' },
          lineStyle: { width: 1, color: '#10b981' },
          itemStyle: { color: '#10b981' },
          data: elevationData,
        },
      ],
    };
  }, [data, theme]);

  if (!data || data.length === 0) return null;

    return (
      <div className="group card-glass p-4 md:p-6 w-full overflow-hidden h-[800px] md:h-[1000px] lg:h-[1200px] transition-all duration-300 ease-out">
        <ReactECharts 
          option={options} 
          className="w-full h-full" 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
    );
}
