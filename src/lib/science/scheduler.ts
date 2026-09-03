import { getPaceZones, formatPace } from './vdot';

export type RaceGoal = '5K' | '10K' | 'HalfMarathon' | 'Marathon' | 'Fitness';
export type WorkoutType = 'Rest' | 'Easy' | 'Long' | 'Threshold' | 'Interval' | 'Marathon';
export type TrainingPhase = 'Base' | 'Build' | 'Peak' | 'Taper' | 'Maintenance';

export interface WorkoutBlock {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  type: WorkoutType;
  durationMinutes: number;
  tssTarget: number;
  description: string;
  paceZoneSeconds?: [number, number]; // [faster, slower]
}

export interface PlanMetadata {
  phase: TrainingPhase;
  targetTss: number;
  complianceAdjustment: 'reduced' | 'maintained' | 'increased';
}

export interface WeeklyPlanResult {
  blocks: WorkoutBlock[];
  metadata: PlanMetadata;
}

/**
 * Generates a rule-based weekly training plan using Periodization and Adaptive Load.
 */
export function generateWeeklyPlan(
  goal: RaceGoal,
  vdot: number,
  currentCtl: number,
  availableDays: number[],
  weeksToRace?: number,
  lastWeekCompliance: number = 100
): WeeklyPlanResult {
  const days = [...new Set(availableDays)].sort();
  
  if (days.length === 0) {
    return {
      blocks: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i, type: 'Rest', durationMinutes: 0, tssTarget: 0, description: '休息日。'
      })),
      metadata: { phase: 'Maintenance', targetTss: 0, complianceAdjustment: 'maintained' }
    };
  }

  // 1. Determine Training Phase (Periodization)
  let phase: TrainingPhase = 'Maintenance';
  if (goal !== 'Fitness' && weeksToRace !== undefined) {
    if (weeksToRace > 12) phase = 'Base';
    else if (weeksToRace > 5) phase = 'Build';
    else if (weeksToRace > 2) phase = 'Peak';
    else phase = 'Taper';
  } else if (goal !== 'Fitness') {
    phase = 'Build'; // Default progressive state if no race date is specified
  }

  // 2. Determine base TSS from current fitness & last week's compliance (Adaptive Load)
  let baseTss = currentCtl * 7;
  let complianceAdjustment: 'reduced' | 'maintained' | 'increased' = 'increased';

  if (lastWeekCompliance < 50) {
    baseTss = baseTss * 0.8; // Heavily reduce load to allow recovery
    complianceAdjustment = 'reduced';
  } else if (lastWeekCompliance < 80) {
    // Maintain load, do not increase, to consolidate fitness
    complianceAdjustment = 'maintained';
  } else {
    baseTss = baseTss + 25; // Safely progressive overload
    complianceAdjustment = 'increased';
  }
  
  baseTss = Math.max(120, baseTss); // Minimum floor for active runners

  // 3. Apply Phase Modifiers to TSS and determine Quality Type
  let targetWeeklyTss = baseTss;
  let qualityType: WorkoutType = 'Threshold';

  switch (phase) {
    case 'Base':
      qualityType = 'Easy';
      break;
    case 'Build':
      if (goal === '5K' || goal === '10K') qualityType = 'Interval';
      else qualityType = 'Threshold';
      break;
    case 'Peak':
      targetWeeklyTss = baseTss * 1.1; // Peak volume overload
      if (goal === 'Marathon' || goal === 'HalfMarathon') qualityType = 'Marathon';
      else qualityType = 'Interval';
      break;
    case 'Taper':
      targetWeeklyTss = baseTss * (weeksToRace === 2 ? 0.7 : 0.5); // Sharp drop in volume
      if (goal === '5K' || goal === '10K') qualityType = 'Interval'; // keep intensity short
      else qualityType = 'Threshold';
      break;
    case 'Maintenance':
      qualityType = 'Easy';
      targetWeeklyTss = currentCtl * 7; // just maintain, no progression
      break;
  }

  // 4. Allocate TSS buckets
  let longRunTss = targetWeeklyTss * 0.30;
  const qualityTss = (phase === 'Base' || phase === 'Maintenance') ? 0 : targetWeeklyTss * 0.20;
  
  if (phase === 'Taper') {
    longRunTss = targetWeeklyTss * 0.20; // Reduce long run heavily during taper
  }

  const remainingTss = targetWeeklyTss - longRunTss - qualityTss;
  const easyDaysCount = Math.max(1, days.length - (qualityTss > 0 ? 2 : 1));
  const easyTssPerRun = remainingTss / easyDaysCount;

  // 5. Assign days
  let longRunDay = days[days.length - 1]; // Fallback to last day
  if (days.includes(0)) longRunDay = 0; // Prefer Sunday
  else if (days.includes(6)) longRunDay = 6; // Else Saturday

  let qualityDay = -1;
  if (qualityTss > 0 && days.length >= 2) {
    const nonLongDays = days.filter(d => d !== longRunDay);
    if (nonLongDays.length > 0) {
      qualityDay = nonLongDays[Math.floor(nonLongDays.length / 2)];
    }
  }

  // 6. Generate Blocks
  const blocks: WorkoutBlock[] = [];
  const paceZones = getPaceZones(vdot);

  for (let i = 0; i <= 6; i++) {
    if (!days.includes(i)) {
      blocks.push({ dayOfWeek: i, type: 'Rest', durationMinutes: 0, tssTarget: 0, description: '休息日。' });
      continue;
    }

    if (i === longRunDay) {
      const durationMins = Math.round((longRunTss / 56) * 60); // Easy pace IF ~0.75 => 0.75^2 * 100 = ~56 TSS/hr
      blocks.push({
        dayOfWeek: i, type: 'Long', durationMinutes: durationMins, tssTarget: Math.round(longRunTss), paceZoneSeconds: paceZones.E,
        description: `長距離慢跑 (Long Run)。配速 ${formatPace(paceZones.E[0])}-${formatPace(paceZones.E[1])}/km。主要目的是增加微血管密度與脂肪代謝能力。`
      });
    } else if (i === qualityDay && qualityTss > 0) {
      let desc = '';
      let zone = paceZones.T;
      let approxIf = 0.90;

      if (qualityType === 'Interval') {
        zone = paceZones.I; approxIf = 0.98;
        desc = `間歇訓練 (Interval)。配速 ${formatPace(zone[0])}-${formatPace(zone[1])}/km。提升最大攝氧量 (VO2Max)。請包含充分的暖身與緩和。`;
      } else if (qualityType === 'Threshold') {
        zone = paceZones.T; approxIf = 0.90;
        desc = `乳酸閾值跑 (Threshold)。配速 ${formatPace(zone[0])}-${formatPace(zone[1])}/km。提升身體清除乳酸的能力。`;
      } else if (qualityType === 'Marathon') {
        zone = paceZones.M; approxIf = 0.82;
        desc = `馬拉松配速跑 (Marathon Pace)。配速 ${formatPace(zone[0])}-${formatPace(zone[1])}/km。模擬比賽強度的專項訓練。`;
      }

      const durationMins = Math.round((qualityTss / (Math.pow(approxIf, 2) * 100)) * 60);
      blocks.push({
        dayOfWeek: i, type: qualityType, durationMinutes: durationMins, tssTarget: Math.round(qualityTss), paceZoneSeconds: zone, description: desc
      });
    } else {
      const durationMins = Math.round((easyTssPerRun / 56) * 60);
      blocks.push({
        dayOfWeek: i, type: 'Easy', durationMinutes: durationMins, tssTarget: Math.round(easyTssPerRun), paceZoneSeconds: paceZones.E,
        description: `輕鬆跑 (Easy Run)。配速 ${formatPace(paceZones.E[0])}-${formatPace(paceZones.E[1])}/km。保持低心率，幫助身體恢復並累積有氧底子。`
      });
    }
  }

  return {
    blocks,
    metadata: { phase, targetTss: targetWeeklyTss, complianceAdjustment }
  };
}
