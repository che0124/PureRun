'use client';

import React, { useMemo } from 'react';
import { loadCredentials } from '@/lib/credentials';

export interface DetailedZoneData {
  code: string;
  label: string;
  range: string;
  value: number;
  color: string;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity: any;
}

const emptySubscribe = () => () => {};

export default function ClientActivityHrZones({ activity }: Props) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const hrZones = useMemo<DetailedZoneData[]>(() => {
    // Use defaults during SSR to prevent hydration mismatch, switch to local storage after mount
    const creds = mounted ? loadCredentials() : { hrZone1Max: 133, hrZone2Max: 154, hrZone3Max: 168, hrZone4Max: 173 } as ReturnType<typeof loadCredentials>;
    const z1Max = creds.hrZone1Max || 133;
    const z2Max = creds.hrZone2Max || 154;
    const z3Max = creds.hrZone3Max || 168;
    const z4Max = creds.hrZone4Max || 173;

    let z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0;

    // Legacy support if Garmin actually provided timeInZones
    if (activity.timeInZones) {
      try {
        const parsed = JSON.parse(activity.timeInZones);
        if (Array.isArray(parsed.hrZones) && parsed.hrZones.length > 0) {
          const fallbackCodes = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
          const fallbackLabels = ['恢復', '有氧', '節奏', '乳酸', '無氧'];
          const fallbackRanges = [`<${z1Max}`, `${z1Max}-${z2Max - 1}`, `${z2Max}-${z3Max - 1}`, `${z3Max}-${z4Max - 1}`, `>${z4Max - 1}`];
          const fallbackColors = ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return parsed.hrZones.map((z: any, idx: number) => {
            const rawName = String(z.name || '');
            const match = rawName.match(/^(Z\d)\s*([^(]+)(?:\((.*)\))?/i);
            return {
              code: match ? match[1].toUpperCase() : (fallbackCodes[idx] || `Z${idx + 1}`),
              label: match ? match[2].trim() : (fallbackLabels[idx] || rawName),
              range: match && match[3] ? match[3].trim() : (fallbackRanges[idx] || ''),
              value: typeof z.value === 'number' ? z.value : 0,
              color: z.color || fallbackColors[idx] || '#10b981',
            };
          });
        }
      } catch {}
    }

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
      if (activity.avgHr < z1Max) z1 = 100;
      else if (activity.avgHr < z2Max) z2 = 100;
      else if (activity.avgHr < z3Max) z3 = 100;
      else if (activity.avgHr < z4Max) z4 = 100;
      else z5 = 100;
    }

    const totalZonePoints = z1 + z2 + z3 + z4 + z5;

    return [
      {
        code: 'Z1',
        label: '恢復',
        range: `<${z1Max}`,
        value: totalZonePoints > 0 ? Number(((z1 / totalZonePoints) * 100).toFixed(1)) : 0,
        color: '#94a3b8',
      },
      {
        code: 'Z2',
        label: '有氧',
        range: `${z1Max}-${z2Max - 1}`,
        value: totalZonePoints > 0 ? Number(((z2 / totalZonePoints) * 100).toFixed(1)) : 0,
        color: '#3b82f6',
      },
      {
        code: 'Z3',
        label: '節奏',
        range: `${z2Max}-${z3Max - 1}`,
        value: totalZonePoints > 0 ? Number(((z3 / totalZonePoints) * 100).toFixed(1)) : 0,
        color: '#10b981',
      },
      {
        code: 'Z4',
        label: '乳酸',
        range: `${z3Max}-${z4Max - 1}`,
        value: totalZonePoints > 0 ? Number(((z4 / totalZonePoints) * 100).toFixed(1)) : 0,
        color: '#f59e0b',
      },
      {
        code: 'Z5',
        label: '無氧',
        range: `>${z4Max - 1}`,
        value: totalZonePoints > 0 ? Number(((z5 / totalZonePoints) * 100).toFixed(1)) : 0,
        color: '#ef4444',
      },
    ];
  }, [activity, mounted]);

  if (hrZones.length === 0) return null;

  return (
    <div className="flex-grow space-y-4">
      <div className="space-y-3.5">
        {hrZones.map((zone) => (
          <div key={zone.code} className="space-y-1.5 group">
            {/* Top line: Zone badge, Name, BPM Range, and Percentage */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold text-white shrink-0"
                  style={{ backgroundColor: zone.color }}
                >
                  {zone.code}
                </span>
                <span className="font-bold text-[var(--text-primary)] shrink-0">
                  {zone.label}
                </span>
                {zone.range && (
                  <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                    ({zone.range} bpm)
                  </span>
                )}
              </div>
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] shrink-0 ml-2">
                {zone.value}%
              </span>
            </div>

            {/* Bottom line: Full-width progress bar with 100% uniform start and end alignment */}
            <div className="w-full h-2 sm:h-2.5 bg-background rounded-full overflow-hidden border border-border">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${zone.value}%`, backgroundColor: zone.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
