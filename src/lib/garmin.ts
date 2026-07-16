/**
 * lib/garmin.ts
 * Server-side Garmin Connect integration using the garmin-connect library.
 * BYOC model: credentials are passed per-request, never stored server-side.
 */

const { GarminConnect } = require('garmin-connect');
import type { IActivity } from 'garmin-connect/dist/garmin/types/activity';

// ── Types ──────────────────────────────────────────────────────────────────

export interface NormalizedActivity {
  activityId: number;
  activityName: string;
  date: string;              // YYYY-MM-DD
  distanceKm: number;
  durationMin: number;
  avgHr: number | null;
  maxHr: number | null;
  avgPaceMinPerKm: number | null;   // decimal minutes, e.g. 5.2 = 5:12/km
  avgPaceStr: string | null;        // formatted e.g. "5:12"
  vO2MaxValue: number | null;
  calories: number;
  activityTypeKey: string;
  elevationGain: number | null;
  cadence: number | null;
  strideLength: number | null;
  trainingEffect: number | null;
  routeData?: string;
}

export interface RunnerStats {
  weeklyKm: number;
  avgHr: number;
  avgPaceStr: string;       // e.g. "5:08"
  estimatedVdot: number;
  totalActivities: number;
  recentActivities: NormalizedActivity[];
}

// ── Helper: convert m/s → pace (min/km) ────────────────────────────────────

function speedToPaceStr(metersPerSec: number): string | null {
  if (!metersPerSec || metersPerSec <= 0) return null;
  const minPerKm = 1000 / 60 / metersPerSec;
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function speedToPaceDecimal(metersPerSec: number): number | null {
  if (!metersPerSec || metersPerSec <= 0) return null;
  return 1000 / 60 / metersPerSec;
}

// ── Helper: estimate VDOT from recent race-effort pace ────────────────────
// Simple approximation based on Jack Daniels' VDOT table.
// Uses avg pace of highest-effort run (assumed tempo/interval).

function estimateVdot(activities: NormalizedActivity[]): number {
  // Use vO2MaxValue if Garmin reports it
  const withVO2 = activities.filter(a => a.vO2MaxValue && a.vO2MaxValue > 0);
  if (withVO2.length > 0) {
    const avg = withVO2.reduce((sum, a) => sum + (a.vO2MaxValue ?? 0), 0) / withVO2.length;
    return Math.round(avg);
  }

  // Fallback: estimate from best pace across recent activities
  // (Very rough approximation for demo purposes)
  const runActivities = activities.filter(
    a => a.avgPaceMinPerKm && a.distanceKm > 3
  );
  if (runActivities.length === 0) return 0;

  const bestPace = Math.min(...runActivities.map(a => a.avgPaceMinPerKm!));
  // Jack Daniels approximation at 5km effort:
  // VDOT ≈ 66 - (pace_min_per_km - 4.0) * 10
  return Math.max(20, Math.min(85, Math.round(66 - (bestPace - 4.0) * 10)));
}

// ── Normalize a single IActivity → NormalizedActivity ─────────────────────

export function normalizeActivity(raw: IActivity): NormalizedActivity {
  const distKm = (raw.distance ?? 0) / 1000;
  const durMin  = (raw.duration  ?? 0) / 60;
  const paceStr = raw.averageSpeed ? speedToPaceStr(raw.averageSpeed) : null;
  const paceDecimal = raw.averageSpeed ? speedToPaceDecimal(raw.averageSpeed) : null;

  return {
    activityId:       raw.activityId,
    activityName:     raw.activityName ?? 'Unknown Activity',
    date:             raw.startTimeLocal?.split(' ')[0] ?? raw.startTimeGMT?.split('T')[0] ?? '',
    distanceKm:       Math.round(distKm * 100) / 100,
    durationMin:      Math.round(durMin * 10) / 10,
    avgHr:            raw.averageHR ?? null,
    maxHr:            raw.maxHR ?? null,
    avgPaceMinPerKm:  paceDecimal,
    avgPaceStr:       paceStr,
    vO2MaxValue:      raw.vO2MaxValue ?? null,
    calories:         raw.calories ?? 0,
    activityTypeKey:  raw.activityType?.typeKey ?? 'unknown',
    elevationGain:    raw.elevationGain ?? null,
    cadence:          raw.averageRunningCadenceInStepsPerMinute ?? null,
    strideLength:     raw.avgStrideLength ?? null,
    trainingEffect:   (raw.aerobicTrainingEffect as number) ?? null,
  };
}

// ── Main: fetch recent activities + compute stats ─────────────────────────

export async function fetchGarminData(
  email: string,
  password: string,
  count: number = 14
): Promise<RunnerStats> {
  const gc = new GarminConnect({ username: email, password });
  const os = require('os');
  const path = require('path');
  const tokenFile = path.join(os.tmpdir(), 'purerun-garmin-token.json');

  try {
    await gc.loadTokenByFile(tokenFile);
  } catch (err) {
    await gc.login();
    try { await gc.exportTokenToFile(tokenFile); } catch (e) {}
  }

  // Fetch recent activities (all types)
  let rawActivities;
  try {
    rawActivities = await gc.getActivities(0, count);
  } catch (apiErr: any) {
    if (apiErr.response?.status === 401 || apiErr.response?.status === 403) {
      await gc.login();
      await gc.exportTokenToFile(tokenFile);
      rawActivities = await gc.getActivities(0, count);
    } else {
      throw apiErr;
    }
  }

  // Filter to running activities only
  const RUNNING_KEYS = ['running', 'street_running', 'trail_running', 'indoor_running', 'track_running'];
  const runningRaw = rawActivities.filter((a: any) =>
    RUNNING_KEYS.some(k => (a.activityType?.typeKey ?? '').includes(k))
  );

  // Fallback: if no running found, take all activities
  let toProcess = runningRaw.length > 0 ? runningRaw : rawActivities;
  
  // Optionally cap the number of details fetched to avoid hitting rate limits too hard
  const fetchLimit = 5; 
  const activities: NormalizedActivity[] = toProcess.map((a: any) => normalizeActivity(a));

  // Now, fetch route polyline for the top N recent outdoor activities
  for (let i = 0; i < Math.min(activities.length, fetchLimit); i++) {
    const act = activities[i];
    // Skip if clearly an indoor activity
    if (act.activityTypeKey === 'indoor_running' || act.activityTypeKey === 'treadmill_running') {
       continue;
    }
    
    try {
      const details = await gc.get(`/activity-service/activity/${act.activityId}/details`);
      if (details && details.geoPolylineDTO && details.geoPolylineDTO.polyline) {
        const points = details.geoPolylineDTO.polyline
          .filter((p: any) => p.lat && p.lon)
          .map((p: any) => [p.lat, p.lon]);
        
        if (points.length > 0) {
          act.routeData = JSON.stringify(points);
        }
      }
      // Brief pause to respect rate limits
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.log(`Failed to fetch polyline for ${act.activityId}`);
    }
  }


  // Compute weekly volume (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thisWeek = activities.filter(a => {
    if (!a.date) return false;
    return new Date(a.date) >= sevenDaysAgo;
  });

  const weeklyKm = thisWeek.reduce((s, a) => s + a.distanceKm, 0);

  // Average HR across all recent runs
  const withHr = activities.filter(a => a.avgHr && a.avgHr > 0);
  const avgHr = withHr.length > 0
    ? Math.round(withHr.reduce((s, a) => s + (a.avgHr ?? 0), 0) / withHr.length)
    : 0;

  // Average pace
  const withPace = activities.filter(a => a.avgPaceMinPerKm && a.avgPaceMinPerKm > 0);
  const avgPaceDecimal = withPace.length > 0
    ? withPace.reduce((s, a) => s + (a.avgPaceMinPerKm ?? 0), 0) / withPace.length
    : 0;
  const avgPaceMins = Math.floor(avgPaceDecimal);
  const avgPaceSecs = Math.round((avgPaceDecimal - avgPaceMins) * 60);
  const avgPaceStr  = avgPaceDecimal > 0
    ? `${avgPaceMins}:${avgPaceSecs.toString().padStart(2, '0')}`
    : '--';

  const estimatedVdot = estimateVdot(activities);

  return {
    weeklyKm:         Math.round(weeklyKm * 10) / 10,
    avgHr,
    avgPaceStr,
    estimatedVdot,
    totalActivities:  activities.length,
    recentActivities: activities.slice(0, 5),
  };
}

// ── Test connection only (lightweight login check) ─────────────────────────

export async function testGarminConnection(
  email: string,
  password: string
): Promise<{ success: boolean; displayName?: string; error?: string }> {
  try {
    const gc = new GarminConnect({ username: email, password });
    await gc.login();
    const profile = await gc.getUserProfile();
    return {
      success: true,
      displayName: (profile as any)?.displayName ?? email,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message ?? 'Connection failed. Check your credentials.',
    };
  }
}
