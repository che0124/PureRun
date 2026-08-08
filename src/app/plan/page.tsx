import React from 'react';
import ScienceEngine from '@/components/ScienceEngine';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
export const dynamic = 'force-dynamic';

export default async function PlanPage() {
  let realVdot = 45;
  let realCtl = 40;
  let hasRealData = false;

  const deviceId = await getDeviceId();

  try {
    const stats = await prisma.garminStats.findUnique({
      where: { deviceId }
    });
    const fitness = await prisma.fitnessStatus.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    });

    if (stats?.estimatedVdot) realVdot = stats.estimatedVdot;
    if (fitness?.ctl) realCtl = fitness.ctl;
    hasRealData = !!stats || !!fitness;
  } catch (error) {
    console.error("Failed to connect to database in PlanPage:", error);
    // Fallback to defaults and simulation mode if DB is unreachable
  }

  return (
    <div className="min-h-screen bg-background relative text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 selection:text-emerald-50 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 md:pt-4 md:pb-12">
        <ScienceEngine initialVdot={realVdot} initialCtl={realCtl} hasRealData={hasRealData} />
      </div>
    </div>
  );
}
