/**
 * lib/gemini.ts
 * Server-side Gemini AI integration for generating structured training plans.
 * Uses @google/generative-ai SDK with forced JSON output mode.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { RunnerStats } from './garmin';

// ── Types ──────────────────────────────────────────────────────────────────

export interface WorkoutDay {
  date: string;
  workout_type: 'Recovery' | 'Interval' | 'Tempo' | 'LongRun' | 'Rest';
  title: string;
  target_pace?: string;
  target_hr_zone?: number;
  description: string;
}

export interface TrainingPlanResponse {
  weekly_analysis: string;
  training_plan: WorkoutDay[];
}

export interface RunnerProfile {
  targetDistance: string;       // '5K' | '10K' | '21K' | '42K'
  targetDateType: string;       // 'date' | 'weeks'
  targetDate: string;           // YYYY-MM-DD
  targetWeeks: number;          // 12 | 16 | 20
  targetTime: string;           // HH:MM:SS
  trainingGoal: string;         // 'finish' | 'pb' | 'maintain'
  recentPr?: string;            // HH:MM:SS
  currentWeeklyVolume: number;  // km
  planFrequency: number;        // 1 | 2 (weeks)
  runningDaysPerWeek: number;   // 3 - 6
  longRunDay: string;           // 'Saturday' | 'Sunday'
  absoluteRestDays: string[];   // e.g. ['Monday', 'Friday']
  currentCondition?: string;    // 'great' | 'normal' | 'fatigued' | 'injured' | 'sick'
  hrCalcMethod: 'hrr' | 'max_hr';
  minHr: number;
  maxHr: number;
  hrZone1Max: number;
  hrZone2Max: number;
  hrZone3Max: number;
  hrZone4Max: number;
}

// ── JSON Schema for structured output ─────────────────────────────────────

const TRAINING_PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    weekly_analysis: {
      type: SchemaType.STRING,
      description: 'Comprehensive assessment based on recent Garmin data, runner targets, and key reminders for this week',
    },
    training_plan: {
      type: SchemaType.ARRAY,
      description: 'The day-by-day training workouts for the week(s)',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: {
            type: SchemaType.STRING,
            description: 'Date in YYYY-MM-DD format',
          },
          workout_type: {
            type: SchemaType.STRING,
            enum: ['Recovery', 'Interval', 'Tempo', 'LongRun', 'Rest'],
          },
          title: {
            type: SchemaType.STRING,
            description: 'Short workout name (max 4 words) in Traditional Chinese',
          },
          target_pace: {
            type: SchemaType.STRING,
            description: 'Target pace range e.g. "5:00–5:15/km", omit for Rest days',
          },
          target_hr_zone: {
            type: SchemaType.NUMBER,
            description: 'Heart rate zone 1–5, omit for Rest days',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Detailed step-by-step instructions in Traditional Chinese including warm-up, main set, cool-down',
          },
        },
        required: ['date', 'workout_type', 'title', 'description'],
      },
    },
  },
  required: ['weekly_analysis', 'training_plan'],
};

// ── Helper: Map English Keys to Chinese Labels ──────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  finish: '無傷完賽',
  pb: '突破 PB (個人最佳)',
  maintain: '維持體能',
};

const CONDITION_LABELS: Record<string, string> = {
  great: '狀態極佳，體能充沛',
  normal: '感覺一般，正常訓練',
  fatigued: '肌肉痠痛或累積疲勞，需要適度恢復',
  injured: '有輕微傷痛，避免高強度或長距離',
  sick: '生病或身體不適，強烈建議減量或休息',
};

const DAY_MAP_ZH: Record<string, string> = {
  Monday: '星期一',
  Tuesday: '星期二',
  Wednesday: '星期三',
  Thursday: '星期四',
  Friday: '星期五',
  Saturday: '星期六',
  Sunday: '星期日',
};

// ── System prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(profile: RunnerProfile): string {
  const planDaysCount = profile.planFrequency * 7;
  const restDaysCount = 7 - profile.runningDaysPerWeek;

  const restDaysZh = profile.absoluteRestDays.length > 0
    ? profile.absoluteRestDays.map(d => DAY_MAP_ZH[d] || d).join('、')
    : '無指定';

  const longRunDayZh = DAY_MAP_ZH[profile.longRunDay] || '星期日';

  // The zones are already calculated and saved as explicit BPM max values in credentials.
  const z1Max = profile.hrZone1Max;
  const z2Max = profile.hrZone2Max;
  const z3Max = profile.hrZone3Max;
  const z4Max = profile.hrZone4Max;

  return `You are an expert running coach specializing in marathon periodization training plans.
Your role is to analyze a runner's Garmin Connect telemetry and custom training preferences, and generate a personalized training schedule.

Guidelines:
- Base your plan strictly on the provided runner baseline (weekly volume, average pace, HR, VDOT).
- Apply Jack Daniels' VDOT training principles (Easy/Recovery, Threshold/Tempo, Interval, Long Run, Rest).
- Weekly training volume must be progressive. Do not increase weekly mileage by more than 10% compared to the runner's current baseline (${profile.currentWeeklyVolume} km).
- Never schedule two hard high-intensity workouts (Interval, Tempo, or Long Run) on consecutive days.
- Use the following Heart Rate Zones: Z1 (<${z1Max} bpm), Z2 (${z1Max}–${z2Max - 1} bpm), Z3 (${z2Max}–${z3Max - 1} bpm), Z4 (${z3Max}–${z4Max - 1} bpm), Z5 (>=${z4Max} bpm).
- The output 'training_plan' must contain EXACTLY ${planDaysCount} items (one per day for ${profile.planFrequency} week(s)).
- Schedule exactly ${profile.runningDaysPerWeek} running days per week. The remaining ${restDaysCount} days must be scheduled as 'Rest' days.
- CRITICAL SCHEDULE CONSTRAINTS:
  1. Long Run Day: The weekly Long Run MUST be scheduled on ${longRunDayZh}.
  2. Absolute Rest Days: The days [${restDaysZh}] MUST be scheduled as 'Rest' days. Under no circumstances should running workouts be planned on these days. Adjust other training days accordingly.
- CRITICAL: ALL text output (weekly_analysis, workout titles, descriptions) MUST be written in fluent, professional Traditional Chinese (繁體中文).`;
}

// ── Build user context prompt from Garmin data ────────────────────────────

function buildContextPrompt(
  stats: RunnerStats,
  profile: RunnerProfile,
  startDate: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastPlanWorkouts?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestFitness?: any
): string {
  const { weeklyKm, avgHr, avgPaceStr, estimatedVdot, recentActivities } = stats;

  const activitiesSummary = recentActivities
    .map((a, i) =>
      `  ${i + 1}. ${a.date} — ${a.activityName}: ${a.distanceKm}km, ` +
      `pace ${a.avgPaceStr ?? 'N/A'}/km, avg HR ${a.avgHr ?? 'N/A'} bpm`
    )
    .join('\n');

  const targetPeriodText = profile.targetDateType === 'date'
    ? `賽事日期: ${profile.targetDate}`
    : `訓練週期長度: ${profile.targetWeeks} 週`;

  let lastPlanSection = '';
  if (lastPlanWorkouts && lastPlanWorkouts.length > 0) {
    const workoutsStr = lastPlanWorkouts
      .map(w =>
        `  - ${w.date} | ${w.title} (${w.workoutType}) | 狀態: ${w.status} | ` +
        `實際: ${w.actualDistance != null ? w.actualDistance + 'km' : '無'} | ` +
        `目標配速/心率: ${w.targetPace ?? '無'} (Z${w.targetHrZone ?? '無'}) | 實際配速/心率: ${w.actualPaceStr ?? '無'} (${w.actualAvgHr ?? '無'} bpm) | ` +
        `達成率: ${w.complianceRate != null ? w.complianceRate + '%' : '0%'}`
      )
      .join('\n');

    lastPlanSection = `
## 上週訓練計畫與執行成效 (Previous Week's Plan & Compliance)
${workoutsStr}

## AI 教練動態調整指示 (Dynamic Adjustment Instructions)
- 請評估上週課表的執行率與心率表現。
- 如果上週執行率良好（完成率 > 80%）且平均心率適中，請在本週計畫中以不超過 10% 的幅度循序漸進增加訓練量。
- 如果上週執行率不佳（完成率 < 70%）或心率過高、有缺課情形，請在本週適度進行減載 (Deload) 或降速，確保跑者安全，並在 \`weekly_analysis\` 中具體說明動態調整的理由。
`;
  }

  const fitnessText = latestFitness
    ? `- 長期體能 (CTL/Fitness): ${latestFitness.ctl.toFixed(1)}\n- 短期疲勞 (ATL/Fatigue): ${latestFitness.atl.toFixed(1)}\n- 狀態 (TSB/Form): ${latestFitness.tsb.toFixed(1)}\n- 受傷風險 (ACWR): ${latestFitness.acwr.toFixed(2)} (大於1.5屬高風險，需減量)`
    : '- 專業疲勞指標 (CTL/ATL): 尚未累積足夠數據';

  return `## 跑者目標與限制 (Runner Goals & Constraints)
- 目標賽事距離 (Target Distance): ${profile.targetDistance}
- ${targetPeriodText}
- 目標完賽成績 (Target Time): ${profile.targetTime}
- 訓練主軸 (Focus): ${GOAL_LABELS[profile.trainingGoal] || profile.trainingGoal}
- 近期最佳成績 (Recent PR): ${profile.recentPr || '無提供'}
- 自訂長距離日 (Long Run Day): ${DAY_MAP_ZH[profile.longRunDay] || profile.longRunDay}
- 絕對休息日 (Absolute Rest Days): ${profile.absoluteRestDays.map(d => DAY_MAP_ZH[d] || d).join(', ') || '無限制'}
- 跑者自評近期狀況 (Subjective Condition): ${profile.currentCondition ? (CONDITION_LABELS[profile.currentCondition] || profile.currentCondition) : '未提供'}

## 當前體能基準與疲勞狀態 (Garmin Baseline & Fatigue Telemetry)
- 預估跑力 (Estimated VDOT): ${estimatedVdot > 0 ? estimatedVdot : '未知 (無足夠數據)'}
- Garmin 近期週跑量 (Garmin weekly volume): ${weeklyKm} km (跑者設定基準週跑量: ${profile.currentWeeklyVolume} km)
- 平均心率 (Average HR): ${avgHr > 0 ? avgHr + ' bpm' : '未知'}
- 平均配速 (Average pace): ${avgPaceStr}/km
${fitnessText}
${lastPlanSection}

## 近期活動紀錄 (Recent Garmin Activities)
${activitiesSummary || '  查無近期活動。'}

## 訓練計畫生成要求 (Training Plan Generation)
- 開始日期 (Start date): ${startDate}
- 請生成剛好 ${profile.planFrequency * 7} 天的計畫（共 ${profile.planFrequency} 週）
- 請根據跑者當前的體能狀況與設定目標，安排循序漸進的馬拉松訓練。
- 所有內容必須使用繁體中文 (Traditional Chinese)。`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0); // avoid timezone shifts
  return monday;
}

// ── Main: generate training plan ───────────────────────────────────────────

export async function generateTrainingPlan(
  apiKey: string,
  stats: RunnerStats,
  profile: RunnerProfile,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastPlanWorkouts?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestFitness?: any
): Promise<TrainingPlanResponse> {
  if (apiKey.toLowerCase() === 'demo') {
    return generateMockPlan(profile);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: buildSystemPrompt(profile),
    generationConfig: {
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: TRAINING_PLAN_SCHEMA as any,
      temperature: 0.4,
    },
  });

  // Start date = Monday of the current week to align strictly with calendar weeks
  const baseDate = getMondayOfCurrentWeek();
  const startDateStr = baseDate.toISOString().split('T')[0];

  const prompt = buildContextPrompt(stats, profile, startDateStr, lastPlanWorkouts, latestFitness);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed: TrainingPlanResponse = JSON.parse(text);

  // Ensure dates are set correctly starting from Monday
  parsed.training_plan = parsed.training_plan.map((day, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return { ...day, date: d.toISOString().split('T')[0] };
  });

  return parsed;
}

export function generateMockPlan(profile: RunnerProfile): TrainingPlanResponse {
  const plan: WorkoutDay[] = [];
  const baseDate = getMondayOfCurrentWeek();

  const WEEKDAYS_ENG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let week = 0; week < profile.planFrequency; week++) {
    const weekWorkouts: string[] = new Array(7).fill('');

    // 1. Assign absolute rest days
    profile.absoluteRestDays.forEach(day => {
      const idx = WEEKDAYS_ENG.indexOf(day);
      if (idx !== -1) weekWorkouts[idx] = 'Rest';
    });

    // 2. Assign Long Run day
    const longRunIdx = WEEKDAYS_ENG.indexOf(profile.longRunDay);
    if (longRunIdx !== -1) weekWorkouts[longRunIdx] = 'LongRun';

    // 3. Fill runningDaysPerWeek
    // Let's count how many rest days we need in total: 7 - runningDaysPerWeek
    const targetRestCount = 7 - profile.runningDaysPerWeek;
    let currentRestCount = weekWorkouts.filter(w => w === 'Rest').length;

    const runningTypes = ['Recovery', 'Tempo', 'Interval', 'Recovery', 'Tempo'];
    let runIdx = 0;

    for (let d = 0; d < 7; d++) {
      if (weekWorkouts[d] !== '') continue;

      // If we still need rest days, fill them first
      if (currentRestCount < targetRestCount) {
        weekWorkouts[d] = 'Rest';
        currentRestCount++;
      } else {
        weekWorkouts[d] = runningTypes[runIdx % runningTypes.length];
        runIdx++;
      }
    }

    // Build the workout objects for this week
    for (let d = 0; d < 7; d++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + (week * 7) + d);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Get the actual weekday index of this date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const type = weekWorkouts[dayOfWeek] as any;
      
      let title = '輕鬆跑';
      let desc = '以輕鬆配配速跑 40 分鐘，維持有氧體能。';
      let pace = '6:00-6:30/km';
      let hr = 2;

      if (type === 'Rest') {
        title = '靜態休息';
        desc = '完全休息，可進行輕度拉伸與泡沫軸滾動以放鬆肌肉。';
        pace = '';
        hr = 0;
      } else if (type === 'LongRun') {
        title = '週末長距離';
        desc = `有氧耐力累積。以輕鬆有氧配速跑完大約 12 至 16 公里，注意補水。`;
        pace = '6:15-6:45/km';
        hr = 2;
      } else if (type === 'Tempo') {
        title = '門檻配速跑';
        desc = '熱身 2 公里，接著以馬拉松目標配速（M配速）穩定跑 6 公里，最後緩和 1 公里。';
        pace = '5:30-5:45/km';
        hr = 3;
      } else if (type === 'Interval') {
        title = '最大攝氧量間歇';
        desc = '充分熱身，進行 5 組 800 公尺間歇跑（I配速），每組間歇以等時間的慢跑進行恢復。';
        pace = '4:45-5:00/km';
        hr = 4;
      } else if (type === 'Recovery') {
        title = '活性恢復跑';
        desc = '以極輕鬆配速慢跑 30 分鐘，主要目的在於加速排乳酸並緩解肌肉緊繃。';
        pace = '6:30-7:00/km';
        hr = 1;
      }

      plan.push({
        date: dateStr,
        workout_type: type,
        title,
        target_pace: pace || undefined,
        target_hr_zone: hr || undefined,
        description: desc
      });
    }
  }

  return {
    weekly_analysis: `[Demo 模式預覽] 本週計畫目標為 ${profile.targetDistance}，主軸為【${profile.trainingGoal === 'finish' ? '無傷完賽' : profile.trainingGoal === 'pb' ? '突破 PB' : '維持體能'}】。\n已經避開您設定的絕對休息日，並將 Long Run 安排在${profile.longRunDay === 'Saturday' ? '週六' : '週日'}。\n\n目前檢測到您的 API Key 為 "demo"，系統已自動啟動本地 Demo 課表引擎為您生成訓練計畫。`,
    training_plan: plan
  };
}

// ── Activity Post-Run Analysis ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzePostRun(apiKey: string, activity: any): Promise<string> {
  if (apiKey.toLowerCase() === 'demo') {
    return '【Demo 模式】\n\n這是一場非常棒的訓練！從數據來看，您的配速十分穩定，心率控制得宜。這顯示您的有氧基礎正在穩步提升，請繼續保持這樣的訓練節奏，並記得在賽後補充足夠的水分與蛋白質！';
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: `You are an expert elite running coach. Your task is to provide a concise, highly professional, and encouraging post-run analysis for a runner based on their single activity telemetry.
- Focus on pacing strategy, heart rate drift, and overall cardiovascular effort.
- Point out 1 positive aspect of their run.
- Point out 1 potential area for improvement (e.g., started too fast, cadence too low, HR drift at the end).
- Output must be purely formatted in Markdown.
- Output MUST be in fluent Traditional Chinese (繁體中文).
- Keep it concise, around 150-250 words.`,
    generationConfig: {
      temperature: 0.5,
    }
  });

  // Extract a few key metrics for the prompt
  const durationStr = activity.durationMin ? `${activity.durationMin} 分鐘` : '未知';
  const metricsInfo = activity.timeInZones ? `心率區間分佈 (若有): ${activity.timeInZones}` : '';

  const prompt = `
請分析以下跑步活動數據：
- 活動名稱：${activity.activityName}
- 日期：${activity.date}
- 距離：${activity.distanceKm} km
- 時間：${durationStr}
- 平均配速：${activity.avgPaceStr || '無'}/km
- 平均心率：${activity.avgHr || '無'} bpm
- 最高心率：${activity.maxHr || '無'} bpm
- 平均步頻：${activity.cadence || '無'} spm
- 總爬升：${activity.elevationGain ? Math.round(activity.elevationGain) : '0'} m
${metricsInfo}

請給予專業教練視角的賽後覆盤與具體建議。
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
