import React from 'react';
import ScienceEngine from '@/components/ScienceEngine';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
export const dynamic = 'force-dynamic';

export default async function PlanPage() {
  let realVdot = 45;
  let realVo2Max = 50;
  let realCtl = 40;
  let hasRealData = false;

  const deviceId = await getDeviceId();

  try {
    const allActivitiesAsc = await prisma.garminActivity.findMany({
      where: { deviceId },
      select: {
        date: true,
        distanceKm: true,
        durationMin: true,
        avgHr: true,
        activityTypeKey: true,
        vO2MaxValue: true,
      },
      orderBy: { date: 'asc' }
    });

    if (allActivitiesAsc.length > 0) {
      hasRealData = true;

      // Find the most recent non-null VO2Max
      const actsWithVo2 = [...allActivitiesAsc].reverse().find(a => a.vO2MaxValue != null);
      if (actsWithVo2 && actsWithVo2.vO2MaxValue) {
        realVo2Max = actsWithVo2.vO2MaxValue;
      }

      // 1. Calculate CTL
      let currentCtl = 0;
      const today = new Date();
      const firstActDate = new Date(allActivitiesAsc[0].date);
      const maxWarmupDate = new Date();
      maxWarmupDate.setDate(today.getDate() - 180);

      const startDate = firstActDate < maxWarmupDate ? maxWarmupDate : firstActDate;
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

      const actsByDate = new Map<string, typeof allActivitiesAsc>();
      allActivitiesAsc.forEach((a: any) => {
        const dObj = typeof a.date === 'string' ? new Date(a.date) : a.date;
        if (!dObj || isNaN(dObj.getTime())) return;
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;
        if (!actsByDate.has(dStr)) actsByDate.set(dStr, []);
        actsByDate.get(dStr)!.push(a);
      });

      for (let i = 0; i <= daysDiff; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const dayActs = actsByDate.get(dateStr) || [];
        let dailyTss = 0;
        dayActs.forEach((act: any) => {
          const hrFactor = act.avgHr ? (act.avgHr / 150) : 1;
          dailyTss += (act.durationMin || 0) * Math.pow(hrFactor, 2) * 1.5;
        });
        currentCtl = currentCtl + 0.0465 * (dailyTss - currentCtl);
      }
      realCtl = Number(currentCtl.toFixed(1));

      // 2. Calculate dynamic VDOT (best in last 90 days)
      const { calculateVDOT } = await import('@/lib/science/vdot');
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      let bestRecentVdot = 0;

      allActivitiesAsc.forEach(act => {
        const d = typeof act.date === 'string' ? new Date(act.date) : act.date;
        if (d >= ninetyDaysAgo && act.activityTypeKey === 'running' && act.distanceKm >= 3 && act.durationMin > 0) {
          const vdot = calculateVDOT(act.distanceKm * 1000, act.durationMin);
          if (vdot > bestRecentVdot) {
            bestRecentVdot = vdot;
          }
        }
      });
      if (bestRecentVdot > 0) realVdot = bestRecentVdot;
    }
  } catch (error) {
    console.error("Failed to connect to database in PlanPage:", error);
    // Fallback to defaults and simulation mode if DB is unreachable
  }

  return (
    <div className="min-h-screen bg-background relative text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 selection:text-emerald-50">
      <div className="relative z-10 w-full sm:max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-6 pb-8 md:pt-8 md:pb-12">
        <ScienceEngine initialVdot={realVdot} initialVo2Max={realVo2Max} initialCtl={realCtl} hasRealData={hasRealData} />
      </div>
    </div>
  );
}
