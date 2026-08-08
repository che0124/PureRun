import { describe, it, expect } from 'vitest';
import { calculateNextDayPMC, generatePMCHistory } from './pmc';

describe('Performance Management Chart (PMC)', () => {
  it('should calculate next day PMC correctly', () => {
    // Starting from a base of CTL=50, ATL=50, and doing a 100 TSS workout today.
    const result = calculateNextDayPMC(50, 50, 100);
    
    // CTL = 50 * exp(-1/42) + 100 * (1 - exp(-1/42))
    // exp(-1/42) = 0.97647
    // CTL = 50 * 0.976 + 100 * 0.0235 = 48.82 + 2.35 = ~51.17 => ~51.2
    expect(result.ctl).toBeGreaterThan(50);
    expect(result.ctl).toBeLessThan(52);
    
    // ATL responds much faster to the 100 TSS day
    // ATL = 50 * exp(-1/7) + 100 * (1 - exp(-1/7))
    // exp(-1/7) = 0.8668
    // ATL = 50 * 0.8668 + 100 * 0.133 = 43.34 + 13.3 = ~56.6
    expect(result.atl).toBeGreaterThan(55);
    expect(result.atl).toBeLessThan(58);

    // TSB today is yesterday's CTL - yesterday's ATL = 50 - 50 = 0
    expect(result.tsb).toBe(0);
  });

  it('should generate a correct historical trend (Cold Start)', () => {
    // Simulate a beginner who runs 50 TSS every day for 7 days
    const dailyTss = [50, 50, 50, 50, 50, 50, 50];
    const history = generatePMCHistory(dailyTss);
    
    expect(history.length).toBe(7);
    
    const day1 = history[0];
    const day7 = history[6];

    // Day 1 TSB should be 0 - 0 = 0
    expect(day1.tsb).toBe(0);
    
    // By day 7, ATL should be much higher than CTL because ATL catches up faster
    expect(day7.atl).toBeGreaterThan(day7.ctl);
    
    // TSB on day 7 will be negative because the body is absorbing the initial shock
    expect(day7.tsb).toBeLessThan(0);
    
    console.log('--- 7 Day Beginner Trend (50 TSS/day) ---');
    history.forEach((data, index) => {
      console.log(`Day ${index + 1}: CTL ${data.ctl}, ATL ${data.atl}, TSB ${data.tsb}, ACWR ${data.acwr}`);
    });
  });
});
