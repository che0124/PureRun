const LS_KEY = 'purerun_creds_v2';

export interface StoredCredentials {
  garminEmail:        string;
  garminPassword:     string;
  stravaClientId:     string;
  stravaClientSecret: string;
  stravaRefreshToken: string;
  geminiApiKey:       string;
  
  // New structured fields for marathon periodization
  targetDistance:      string;    // '5K' | '10K' | '21K' | '42K'
  targetDateType:      string;    // 'date' | 'weeks'
  targetDate:          string;    // YYYY-MM-DD
  targetWeeks:         number;    // 12 | 16 | 20
  targetTime:          string;    // HH:MM:SS
  trainingGoal:        string;    // 'finish' | 'pb' | 'maintain'
  recentPr:            string;    // HH:MM:SS (optional)
  currentWeeklyVolume: number;    // km
  planFrequency:       number;    // 1 | 2 (weeks)
  runningDaysPerWeek:  number;    // 3 - 6
  longRunDay:          string;    // 'Saturday' | 'Sunday'
  absoluteRestDays:    string[];  // e.g. ['Monday', 'Friday']
  
  // Custom HR Zones
  hrCalcMethod:        'hrr' | 'max_hr';
  minHr:               number;
  maxHr:               number;
  hrZone0Max:          number; // Z1 Bottom
  hrZone1Max:          number; // Z1 Max / Z2 Bottom
  hrZone2Max:          number; // Z2 Max / Z3 Bottom
  hrZone3Max:          number; // Z3 Max / Z4 Bottom
  hrZone4Max:          number; // Z4 Max / Z5 Bottom
}

export function loadCredentials(): StoredCredentials {
  const defaults: StoredCredentials = { 
    garminEmail: '', 
    garminPassword: '', 
    stravaClientId: '',
    stravaClientSecret: '',
    stravaRefreshToken: '',
    geminiApiKey: '', 
    runningDaysPerWeek: 4,
    targetDistance: '42K',
    targetDateType: 'weeks',
    targetDate: '',
    targetWeeks: 16,
    targetTime: '04:00:00',
    trainingGoal: 'finish',
    recentPr: '',
    currentWeeklyVolume: 30,
    planFrequency: 1,
    longRunDay: 'Sunday',
    absoluteRestDays: [],
    hrCalcMethod: 'hrr',
    minHr: 50,
    maxHr: 190,
    hrZone0Max: 133, // 59% HRR (140) + 50
    hrZone1Max: 154, // 74% HRR
    hrZone2Max: 168, // 84% HRR
    hrZone3Max: 173, // 88% HRR
    hrZone4Max: 183  // 95% HRR
  };
  
  if (typeof window === 'undefined') {
    return defaults;
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveCredentials(creds: StoredCredentials) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_KEY, JSON.stringify(creds));
  }
}
