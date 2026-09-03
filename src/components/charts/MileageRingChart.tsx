'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface MileageRingChartProps {
  current: number;
  target: number;
  label?: string; // '週' | '月'
}

export default function MileageRingChart({ current, target, label = '週' }: MileageRingChartProps) {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  const option = {
    tooltip: {
      show: false
    },
    series: [
      {
        name: '跑量進度',
        type: 'pie',
        radius: ['75%', '90%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 20,
          borderColor: '#171717',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => `{val|${Math.round(current)}}\n{total|/ ${target} km}`,
          rich: {
            val: {
              fontSize: 48,
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'monospace',
              lineHeight: 56
            },
            total: {
              fontSize: 12,
              fontWeight: 'bold',
              color: '#737373',
              fontFamily: 'monospace',
              padding: [0, 0, 10, 0]
            }
          }
        },
        emphasis: {
          scale: false
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: current, 
            name: '已跑',
            itemStyle: { 
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#34d399' }, // emerald-400
                  { offset: 1, color: '#059669' }  // emerald-600
                ]
              },
              shadowBlur: 10,
              shadowColor: 'rgba(16, 185, 129, 0.4)'
            }
          },
          { 
            value: Math.max(0, target - current), 
            name: '剩餘',
            itemStyle: { 
              color: '#262626' // neutral-800
            },
            emphasis: {
              itemStyle: { color: '#262626' }
            }
          }
        ]
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
