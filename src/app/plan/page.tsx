import React from 'react';
import { prisma } from '@/lib/db';
import PlanClient from './PlanClient';

export const dynamic = 'force-dynamic';

export default async function PlanPage() {
  const stats = await prisma.garminStats.findUnique({ where: { id: 1 } });
  const activities = await prisma.garminActivity.findMany({ 
    orderBy: { date: 'desc' },
    take: 10
  });

  const activePlan = await prisma.trainingPlan.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { workouts: true }
  });

  const garminStatsPayload = stats ? {
    weeklyKm: stats.weeklyKm,
    avgHr: stats.avgHr,
    avgPaceStr: stats.avgPaceStr,
    estimatedVdot: stats.estimatedVdot,
    totalActivities: stats.totalActivities,
    recentActivities: activities.map((a: any) => ({
      activityId: Number(a.activityId),
      activityName: a.activityName,
      date: a.date,
      distanceKm: a.distanceKm,
      durationMin: a.durationMin,
      avgHr: a.avgHr,
      maxHr: a.maxHr,
      avgPaceMinPerKm: a.avgPaceMinPerKm,
      avgPaceStr: a.avgPaceStr,
      vO2MaxValue: a.vO2MaxValue,
      calories: a.calories,
      activityTypeKey: a.activityTypeKey,
      elevationGain: a.elevationGain,
      cadence: a.cadence,
      strideLength: a.strideLength,
      trainingEffect: a.trainingEffect,
    }))
  } : null;

  const activePlanPayload = activePlan ? {
    weeklyAnalysis: activePlan.weeklyAnalysis,
    workouts: activePlan.workouts.map(w => ({
      date: w.date,
      workout_type: w.workoutType as any,
      title: w.title,
      target_pace: w.targetPace || undefined,
      target_hr_zone: w.targetHrZone || undefined,
      description: w.description || undefined,
      status: w.status,
      actual_distance: w.actualDistance || undefined,
      actual_duration: w.actualDuration || undefined,
      actual_avg_hr: w.actualAvgHr || undefined,
      actual_pace_str: w.actualPaceStr || undefined,
      compliance_rate: w.complianceRate || undefined,
    }))
  } : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-fade-up">
        <PlanClient 
          initialGarminStats={garminStatsPayload as any} 
          initialPlan={activePlanPayload as any}
        />
      </div>
    </div>
  );
}
