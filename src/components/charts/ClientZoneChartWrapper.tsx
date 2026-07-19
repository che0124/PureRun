"use client";

import React, { useMemo } from 'react';
import ZoneDistributionChart from './ZoneDistributionChart';
import { loadCredentials } from '@/lib/credentials';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activities: any[];
}

export default function ClientZoneChartWrapper({ activities }: Props) {
  const zones = useMemo(() => {
    const creds = loadCredentials();
    const z1Max = creds.hrZone1Max || 130;
    const z2Max = creds.hrZone2Max || 150;
    const z3Max = creds.hrZone3Max || 165;
    const z4Max = creds.hrZone4Max || 175;

    let z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0;
    
    activities.forEach(act => {
      if (act.metricsData) {
        try {
          const metrics = JSON.parse(act.metricsData);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metrics.forEach((m: any) => {
            if (m.hr) {
              if (m.hr < z1Max) z1++;
              else if (m.hr < z2Max) z2++;
              else if (m.hr < z3Max) z3++;
              else if (m.hr < z4Max) z4++;
              else z5++;
            }
          });
        } catch {}
      } else if (act.avgHr) {
          const durationMins = act.durationMin;
          if (act.avgHr < z1Max) z1 += durationMins;
          else if (act.avgHr < z2Max) z2 += durationMins;
          else if (act.avgHr < z3Max) z3 += durationMins;
          else if (act.avgHr < z4Max) z4 += durationMins;
          else z5 += durationMins;
      }
    });

    const totalZonePoints = z1 + z2 + z3 + z4 + z5;
    return totalZonePoints > 0 ? [
      { name: `Z1 恢復 (<${z1Max})`, value: Number(((z1 / totalZonePoints) * 100).toFixed(1)), color: '#94a3b8' },
      { name: `Z2 有氧 (${z1Max}-${z2Max - 1})`, value: Number(((z2 / totalZonePoints) * 100).toFixed(1)), color: '#3b82f6' },
      { name: `Z3 節奏 (${z2Max}-${z3Max - 1})`, value: Number(((z3 / totalZonePoints) * 100).toFixed(1)), color: '#10b981' },
      { name: `Z4 乳酸 (${z3Max}-${z4Max - 1})`, value: Number(((z4 / totalZonePoints) * 100).toFixed(1)), color: '#f59e0b' },
      { name: `Z5 無氧 (>${z4Max - 1})`, value: Number(((z5 / totalZonePoints) * 100).toFixed(1)), color: '#ef4444' },
    ] : [
      { name: `Z1 恢復`, value: 15, color: '#94a3b8' },
      { name: `Z2 有氧`, value: 45, color: '#3b82f6' },
      { name: `Z3 節奏`, value: 25, color: '#10b981' },
      { name: `Z4 乳酸`, value: 10, color: '#f59e0b' },
      { name: `Z5 無氧`, value: 5, color: '#ef4444' },
    ];
  }, [activities]);

  if (zones.length === 0) return null;

  return <ZoneDistributionChart title="近期心率區間分佈" data={zones} type="pie" />;
}
