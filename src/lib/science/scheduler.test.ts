import { describe, it, expect } from 'vitest';
import { generateWeeklyPlan } from './scheduler';

describe('Training Block Scheduler', () => {
  it('should generate a half marathon plan for a mid-level runner', () => {
    // VDOT 45 (approx 22:15 5K), CTL 40, Available: Tue(2), Thu(4), Sat(6), Sun(0)
    const { blocks: plan } = generateWeeklyPlan('HalfMarathon', 45, 40, [0, 2, 4, 6]);
    
    expect(plan.length).toBe(7);
    
    // Sunday (0) should be Long Run
    const sunday = plan.find(p => p.dayOfWeek === 0);
    expect(sunday?.type).toBe('Long');
    
    // Should have a Threshold session (quality for Half Marathon)
    const quality = plan.find(p => p.type === 'Threshold');
    expect(quality).toBeDefined();
    
    console.log('\n--- Half Marathon Plan (CTL 40, VDOT 45, 4 Days/Wk) ---');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    plan.filter(p => p.type !== 'Rest').forEach(p => {
      console.log(`${dayNames[p.dayOfWeek]} [${p.type}]: ${p.durationMinutes} mins (TSS: ${p.tssTarget}) -> ${p.description}`);
    });
  });

  it('should generate a 5K plan for a beginner', () => {
    // VDOT 35, CTL 10 (Beginner), Available: Mon(1), Wed(3), Fri(5)
    const { blocks: plan } = generateWeeklyPlan('5K', 35, 10, [1, 3, 5]);
    
    console.log('\n--- 5K Plan (CTL 10, VDOT 35, 3 Days/Wk) ---');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    plan.filter(p => p.type !== 'Rest').forEach(p => {
      console.log(`${dayNames[p.dayOfWeek]} [${p.type}]: ${p.durationMinutes} mins (TSS: ${p.tssTarget}) -> ${p.description}`);
    });
  });
});
