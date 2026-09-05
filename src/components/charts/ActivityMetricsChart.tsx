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
        appendToBody: true,
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
            if (seriesName === '配速' || seriesName === 'Pace') {
              const mins = Math.floor(val);
              const secs = Math.floor((val - mins) * 60);
              val = `${mins}:${secs.toString().padStart(2, '0')}`;
            } else if (
              seriesName === '海拔' || seriesName === 'Elevation' ||
              seriesName === '步頻' || seriesName === 'Cadence' ||
              seriesName === '心率' || seriesName === 'Heart Rate'
            ) {
              val = Math.round(val);
            }
            tooltipHtml += `<div>${param.marker} ${seriesName}: <b>${val}</b></div>`;
          });
          return tooltipHtml;
        }
      },
      title: [
        {
          text: '配速 (min/km)',
          left: 50,
          top: '1.2%',
          textStyle: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' }
        },
        {
          text: '心率 (BPM)',
          left: 50,
          top: '26.2%',
          textStyle: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' }
        },
        {
          text: '步頻 (SPM)',
          left: 50,
          top: '51.2%',
          textStyle: { color: '#8b5cf6', fontSize: 12, fontWeight: 'bold' }
        },
        {
          text: '海拔 (m)',
          left: 50,
          top: '76.2%',
          textStyle: { color: '#10b981', fontSize: 12, fontWeight: 'bold' }
        }
      ],
      legend: {
        show: false,
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: [
        { left: 50, right: 32, top: '5.5%', height: '17%', containLabel: false },
        { left: 50, right: 32, top: '30.5%', height: '17%', containLabel: false },
        { left: 50, right: 32, top: '55.5%', height: '17%', containLabel: false },
        { left: 50, right: 32, top: '80.5%', height: '15%', containLabel: false }
      ],
      xAxis: [
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 0,
          boundaryGap: false,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 1,
          boundaryGap: false,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 2,
          boundaryGap: false,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          data: xAxisData,
          gridIndex: 3,
          boundaryGap: false,
          axisLine: { lineStyle: { color: theme.axisLineColor } },
          axisLabel: {
            color: theme.subtextColor,
            fontSize: 10,
            showMaxLabel: true,
            showMinLabel: true,
          },
        }
      ],
      yAxis: [
        {
          type: 'value',
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
          name: '配速',
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#3b82f6' },
          data: paceData,
        },
        {
          name: '心率',
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#ef4444' },
          data: hrData,
        },
        {
          name: '步頻',
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#8b5cf6' },
          data: cadenceData,
        },
        {
          name: '海拔',
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
    <div className="w-full overflow-hidden h-[700px] sm:h-[850px] md:h-[1000px]">
      <ReactECharts 
        option={options} 
        className="w-full h-full" 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
}
