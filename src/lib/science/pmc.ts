/**
 * Performance Management Chart (PMC) Model
 * Calculates CTL (Fitness), ATL (Fatigue), and TSB (Form) using Exponentially Weighted Moving Averages (EWMA).
 */

const CTL_TIME_CONSTANT = 42; // standard is 42 days for fitness
const ATL_TIME_CONSTANT = 7;  // standard is 7 days for fatigue

export interface PMCData {
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
}

/**
 * Calculate today's PMC metrics based on yesterday's metrics and today's Training Stress Score.
 *
 * @param yesterdayCtl Yesterday's Chronic Training Load (CTL)
 * @param yesterdayAtl Yesterday's Acute Training Load (ATL)
 * @param todayTss Today's total Training Stress Score (sum of all activities today, 0 if rest day)
 * @returns Today's updated PMC metrics
 */
export function calculateNextDayPMC(
  yesterdayCtl: number,
  yesterdayAtl: number,
  todayTss: number
): PMCData {
  // EWMA decay factors
  const ctlDecay = Math.exp(-1 / CTL_TIME_CONSTANT);
  const atlDecay = Math.exp(-1 / ATL_TIME_CONSTANT);

  // Calculate today's CTL and ATL
  const todayCtl = yesterdayCtl * ctlDecay + todayTss * (1 - ctlDecay);
  const todayAtl = yesterdayAtl * atlDecay + todayTss * (1 - atlDecay);

  // TSB is usually calculated as yesterday's CTL minus yesterday's ATL.
  // This represents the "Form" you wake up with BEFORE today's workout.
  const tsb = yesterdayCtl - yesterdayAtl;

  // Acute:Chronic Workload Ratio (ACWR) - usually today's ATL / today's CTL
  // A safe "sweet spot" for ACWR is typically between 0.8 and 1.3
  const acwr = todayCtl > 0 ? todayAtl / todayCtl : 0;

  return {
    ctl: Math.round(todayCtl * 10) / 10,
    atl: Math.round(todayAtl * 10) / 10,
    tsb: Math.round(tsb * 10) / 10,
    acwr: Math.round(acwr * 100) / 100, // round to 2 decimal places
  };
}

/**
 * Backfill or recalculate a historical array of PMC metrics.
 * 
 * @param dailyTss Array of daily TSS values (chronological order)
 * @param initialCtl Starting CTL (0 for complete beginner)
 * @param initialAtl Starting ATL (0 for complete beginner)
 * @returns Array of daily PMC data corresponding to the input TSS array
 */
export function generatePMCHistory(
  dailyTss: number[],
  initialCtl: number = 0,
  initialAtl: number = 0
): PMCData[] {
  const history: PMCData[] = [];
  let currentCtl = initialCtl;
  let currentAtl = initialAtl;

  for (const tss of dailyTss) {
    const nextPMC = calculateNextDayPMC(currentCtl, currentAtl, tss);
    history.push(nextPMC);
    
    // Update current state for the next iteration
    // Use precise unrounded values for continuous iteration to avoid rounding errors compounding
    const ctlDecay = Math.exp(-1 / CTL_TIME_CONSTANT);
    const atlDecay = Math.exp(-1 / ATL_TIME_CONSTANT);
    currentCtl = currentCtl * ctlDecay + tss * (1 - ctlDecay);
    currentAtl = currentAtl * atlDecay + tss * (1 - atlDecay);
  }

  return history;
}
