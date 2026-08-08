import { describe, it, expect } from 'vitest';
import { calculateVDOT, getPaceZones, formatPace } from './vdot';

describe('VDOT Calculator', () => {
  it('should calculate correct VDOT for a 20:00 5K', () => {
    // 5K = 5000 meters, 20:00 = 20 minutes
    const vdot = calculateVDOT(5000, 20);
    expect(vdot).toBeCloseTo(49.8, 1);
  });

  it('should calculate correct pace zones for VDOT 49.8', () => {
    const vdot = 49.8;
    const zones = getPaceZones(vdot);
    
    console.log('--- Pace Zones for VDOT 49.8 (20:00 5K) ---');
    console.log(`E Pace: ${formatPace(zones.E[0])} - ${formatPace(zones.E[1])}/km`);
    console.log(`M Pace: ${formatPace(zones.M[0])} - ${formatPace(zones.M[1])}/km`);
    console.log(`T Pace: ${formatPace(zones.T[0])} - ${formatPace(zones.T[1])}/km`);
    console.log(`I Pace: ${formatPace(zones.I[0])} - ${formatPace(zones.I[1])}/km`);
    console.log(`R Pace: ${formatPace(zones.R[0])} - ${formatPace(zones.R[1])}/km`);
    
    // T pace for VDOT 49.8 should be around 4:08/km (248 seconds).
    // Let's assert that the T pace range includes this value.
    expect(zones.T[0]).toBeLessThanOrEqual(248);
    expect(zones.T[1]).toBeGreaterThanOrEqual(248);
  });
});
