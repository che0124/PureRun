import { describe, it, expect } from 'vitest';
import { calculateTRIMP, calculateHrTSS } from './load';

describe('Training Load Quantifiers', () => {
  it('should calculate Banister TRIMP correctly for a male', () => {
    // 60 minutes, Avg HR 150, Max 190, Rest 60
    // deltaHR = (150-60)/(190-60) = 90/130 = 0.6923
    const trimp = calculateTRIMP(60, 150, 190, 60, 'male');
    expect(trimp).toBeGreaterThan(90);
    expect(trimp).toBeLessThan(110);
    console.log(`Male TRIMP (60m, Avg HR 150): ${trimp}`);
  });

  it('should calculate Banister TRIMP correctly for a female', () => {
    const trimpFemale = calculateTRIMP(60, 150, 190, 60, 'female');
    console.log(`Female TRIMP (60m, Avg HR 150): ${trimpFemale}`);
    expect(trimpFemale).toBeGreaterThan(0);
  });

  it('should calculate hrTSS correctly', () => {
    // 60 minutes exactly at Threshold HR (e.g. 170). IF = 1.0. hrTSS should be exactly 100.
    const tssThreshold = calculateHrTSS(60, 170, 170);
    expect(tssThreshold).toBe(100);
    console.log(`hrTSS (60m at Threshold HR): ${tssThreshold}`);

    // 60 minutes at Easy HR (e.g. 136, LTHR 170, IF = 0.8)
    // 1 * 0.8^2 * 100 = 64
    const tssEasy = calculateHrTSS(60, 136, 170);
    expect(tssEasy).toBe(64);
    console.log(`hrTSS (60m at Easy HR): ${tssEasy}`);
  });
});
