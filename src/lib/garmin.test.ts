import { describe, it, expect } from 'vitest';
import { speedToPaceStr } from './garmin';

describe('garmin utilities', () => {
  describe('speedToPaceStr', () => {
    it('should convert speed correctly (3.33 m/s is roughly 5:00/km)', () => {
      // 1000 / 60 / 3.3333333333 = 5.0 min/km => "5:00"
      expect(speedToPaceStr(1000 / 300)).toBe('5:00');
    });

    it('should pad seconds with zero when less than 10', () => {
      // 1000 / 60 / 3.25 = 5.128 min/km = 5 min 8 sec => "5:08"
      expect(speedToPaceStr(1000 / 308)).toBe('5:08');
    });

    it('should return null for zero or negative speeds', () => {
      expect(speedToPaceStr(0)).toBe(null);
      expect(speedToPaceStr(-2.5)).toBe(null);
    });
  });
});
