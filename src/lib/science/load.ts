export type Gender = 'male' | 'female';

/**
 * Calculates Banister's TRIMP (Training Impulse).
 * This is a heart-rate based metric to quantify training load.
 * 
 * @param durationMinutes Time spent in the activity in minutes
 * @param averageHr The average heart rate during the activity
 * @param maxHr The user's maximum heart rate
 * @param restingHr The user's resting heart rate
 * @param gender The user's gender ('male' or 'female')
 * @returns TRIMP score
 */
export function calculateTRIMP(
  durationMinutes: number,
  averageHr: number,
  maxHr: number,
  restingHr: number,
  gender: Gender = 'male'
): number {
  if (maxHr <= restingHr || averageHr < restingHr) return 0;
  
  // Fractional heart rate reserve (Heart Rate Reserve)
  const deltaHR = (averageHr - restingHr) / (maxHr - restingHr);
  
  // Gender specific coefficients for the exponential weighting
  const y = gender === 'male' ? 1.92 : 1.67;
  const factor = gender === 'male' ? 0.64 : 0.86;
  
  const trimp = durationMinutes * deltaHR * factor * Math.exp(y * deltaHR);
  return Math.round(trimp * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculates a simplified Heart Rate TSS (hrTSS).
 * Based on the ratio of average HR to Lactate Threshold HR (LTHR).
 * 
 * @param durationMinutes Time spent in the activity in minutes
 * @param averageHr The average heart rate during the activity
 * @param thresholdHr The user's Lactate Threshold Heart Rate (LTHR)
 * @returns hrTSS score
 */
export function calculateHrTSS(
  durationMinutes: number,
  averageHr: number,
  thresholdHr: number
): number {
  if (thresholdHr <= 0) return 0;

  // Intensity Factor (IF)
  const intensityFactor = averageHr / thresholdHr;
  
  // hrTSS = (Duration in hours) * (IF^2) * 100
  const durationHours = durationMinutes / 60;
  const hrTSS = durationHours * Math.pow(intensityFactor, 2) * 100;
  
  return Math.round(hrTSS * 10) / 10;
}
