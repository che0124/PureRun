'use client';

import React, { useMemo } from 'react';
import { loadCredentials } from '@/lib/credentials';
import { ZoneData } from './ZoneDistributionChart';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity: any;
}

export default function ClientActivityHrZones({ activity }: Props) {
  const hrZones = useMemo(() => {
    let zones: ZoneData[] = [];
    
    // Legacy support if Garmin actually provided timeInZones
    if (activity.timeInZones) {
      try {
        const parsed = JSON.parse(activity.timeInZones);
        if (parsed.hrZones) zones = parsed.hrZones;
      } catch {}
    }

    // Calculate dynamically from metrics using user credentials
    if (zones.length === 0) {
      const creds = loadCredentials();
      const z1Max = creds.hrZone1Max || 133;
      const z2Max = creds.hrZone2Max || 154;
      const z3Max = creds.hrZone3Max || 168;
      const z4Max = creds.hrZone4Max || 173;

      let z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0;
      
      if (activity.metricsData) {
        try {
          const metrics = JSON.parse(activity.metricsData);
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
      } else if (activity.avgHr) {
        // Basic fallback using avgHr entirely if no timeseries exists
        if (activity.avgHr < z1Max) z1 = 100;
        else if (activity.avgHr < z2Max) z2 = 100;
        else if (activity.avgHr < z3Max) z3 = 100;
        else if (activity.avgHr < z4Max) z4 = 100;
        else z5 = 100;
      }

      const totalZonePoints = z1 + z2 + z3 + z4 + z5;
      
      if (totalZonePoints > 0) {
        zones = [
          { name: `Z1 恢復 (<${z1Max})`, value: Number(((z1 / totalZonePoints) * 100).toFixed(1)), color: '#94a3b8' },
          { name: `Z2 有氧 (${z1Max}-${z2Max - 1})`, value: Number(((z2 / totalZonePoints) * 100).toFixed(1)), color: '#3b82f6' },
          { name: `Z3 節奏 (${z2Max}-${z3Max - 1})`, value: Number(((z3 / totalZonePoints) * 100).toFixed(1)), color: '#10b981' },
          { name: `Z4 乳酸 (${z3Max}-${z4Max - 1})`, value: Number(((z4 / totalZonePoints) * 100).toFixed(1)), color: '#f59e0b' },
          { name: `Z5 無氧 (>${z4Max - 1})`, value: Number(((z5 / totalZonePoints) * 100).toFixed(1)), color: '#ef4444' },
        ];
      } else {
        zones = [
          { name: `Z1 恢復 (<${z1Max})`, value: 0, color: '#94a3b8' },
          { name: `Z2 有氧 (${z1Max}-${z2Max - 1})`, value: 0, color: '#3b82f6' },
          { name: `Z3 節奏 (${z2Max}-${z3Max - 1})`, value: 0, color: '#10b981' },
          { name: `Z4 乳酸 (${z3Max}-${z4Max - 1})`, value: 0, color: '#f59e0b' },
          { name: `Z5 無氧 (>${z4Max - 1})`, value: 0, color: '#ef4444' },
        ];
      }
    }
    
    return zones;
  }, [activity]);

  if (hrZones.length === 0) return null;

  return (
    <div className="mt-4 flex-grow border-t border-slate-800/50 pt-6 space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">心率區間分佈</h3>
      <div className="space-y-3">
        {hrZones.map(zone => (
          <div key={zone.name} className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 w-24 shrink-0 truncate" title={zone.name}>{zone.name}</span>
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${zone.value}%`, backgroundColor: zone.color }}
              ></div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 w-12 text-right">{zone.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
