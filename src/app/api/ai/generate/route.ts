import { NextResponse } from 'next/server';
import { generateTrainingPlan, RunnerProfile } from '@/lib/gemini';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { geminiApiKey } = body;

    if (!geminiApiKey) {
      return NextResponse.json(
        { message: '請提供 Gemini API Key。' },
        { status: 400 }
      );
    }

    // 1. Read data from local DB instead of fetching from Garmin
    const stats = await prisma.garminStats.findUnique({ where: { id: 1 } });
    const activities = await prisma.garminActivity.findMany({ 
      orderBy: { date: 'desc' },
      take: 10
    });

    if (!stats || activities.length === 0) {
      return NextResponse.json(
        { message: '尚未同步 Garmin 數據，請先至儀表板進行同步。' },
        { status: 400 }
      );
    }

    // 2. Prepare AI context
    const runnerStats = {
      weeklyKm: stats.weeklyKm,
      avgHr: stats.avgHr,
      avgPaceStr: stats.avgPaceStr,
      estimatedVdot: stats.estimatedVdot,
      totalActivities: stats.totalActivities,
      recentActivities: activities as any[],
    };

    // Query last week's plan for dynamic feedback context
    const lastPlan = await prisma.trainingPlan.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { workouts: true }
    });
    const lastPlanWorkouts = lastPlan ? lastPlan.workouts : [];

    // Query latest Fitness Status (CTL, ATL)
    const latestFitness = await prisma.fitnessStatus.findFirst({
      orderBy: { date: 'desc' }
    });

    // Parse structured runner profile from request body
    const profile: RunnerProfile = {
      targetDistance: body.targetDistance || '42K',
      targetDateType: body.targetDateType || 'weeks',
      targetDate: body.targetDate || '',
      targetWeeks: Number(body.targetWeeks ?? 16),
      targetTime: body.targetTime || '04:00:00',
      trainingGoal: body.trainingGoal || 'finish',
      recentPr: body.recentPr || '',
      currentWeeklyVolume: Number(body.currentWeeklyVolume ?? 30),
      planFrequency: Number(body.planFrequency ?? 1),
      runningDaysPerWeek: Number(body.runningDaysPerWeek ?? 4),
      longRunDay: body.longRunDay || 'Sunday',
      absoluteRestDays: body.absoluteRestDays || [],
      currentCondition: body.currentCondition || 'normal',
      hrCalcMethod: body.hrCalcMethod || 'hrr',
      minHr: Number(body.minHr ?? 50),
      maxHr: Number(body.maxHr ?? 190),
      hrZone1Max: Number(body.hrZone1Max ?? 130),
      hrZone2Max: Number(body.hrZone2Max ?? 150),
      hrZone3Max: Number(body.hrZone3Max ?? 165),
      hrZone4Max: Number(body.hrZone4Max ?? 175)
    };

    // 3. Call Gemini with new structured RunnerProfile
    const result = await generateTrainingPlan(
      geminiApiKey,
      runnerStats,
      profile,
      lastPlanWorkouts,
      latestFitness
    );

    // 4. Save to local DB (clear previous plan for local personalization)
    const savedPlan = await prisma.$transaction(async (tx) => {
      await tx.trainingPlan.deleteMany({});
      
      return await tx.trainingPlan.create({
        data: {
          startDate: result.training_plan[0]?.date || new Date().toISOString().split('T')[0],
          endDate: result.training_plan[result.training_plan.length - 1]?.date || new Date().toISOString().split('T')[0],
          weeklyAnalysis: result.weekly_analysis,
          workouts: {
            create: result.training_plan.map((day: any) => ({
              date: day.date,
              workoutType: day.workout_type,
              title: day.title,
              targetPace: day.target_pace || null,
              targetHrZone: day.target_hr_zone || null,
              description: day.description,
              status: day.workout_type === 'Rest' ? 'Rest' : 'Pending',
            })),
          },
        },
        include: {
          workouts: true,
        },
      });
    });

    // 5. Query matching activities for the newly created workouts immediately (if any exist)
    const workoutsWithSync = await prisma.$transaction(async (tx) => {
      const workouts = await tx.workout.findMany({
        where: { planId: savedPlan.id }
      });
      
      for (const w of workouts) {
        if (w.workoutType === 'Rest') continue;
        
        const startDate = new Date(`${w.date}T00:00:00.000Z`);
        const endDate = new Date(`${w.date}T23:59:59.999Z`);
        
        const match = await tx.garminActivity.findFirst({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            },
            activityTypeKey: { contains: 'running' }
          }
        });
        
        if (match) {
          await tx.workout.update({
            where: { id: w.id },
            data: {
              status: 'Completed',
              actualActivityId: match.activityId,
              actualDistance: match.distanceKm,
              actualDuration: match.durationMin,
              actualAvgHr: match.avgHr,
              actualPaceStr: match.avgPaceStr,
              complianceRate: 100, // simple match for now
            }
          });
        }
      }
      
      return await tx.workout.findMany({
        where: { planId: savedPlan.id },
        orderBy: { date: 'asc' }
      });
    });

    return NextResponse.json({
      weekly_analysis: savedPlan.weeklyAnalysis,
      training_plan: workoutsWithSync.map(w => ({
        date: w.date,
        workout_type: w.workoutType,
        title: w.title,
        target_pace: w.targetPace,
        target_hr_zone: w.targetHrZone,
        description: w.description,
        status: w.status,
        actual_distance: w.actualDistance,
        actual_duration: w.actualDuration,
        actual_avg_hr: w.actualAvgHr,
        actual_pace_str: w.actualPaceStr,
        compliance_rate: w.complianceRate,
      }))
    });

  } catch (err: any) {
    console.error('[/api/ai/generate] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'server_error', message: `計畫生成失敗：${err?.message || '未知伺服器錯誤'}` },
      { status: 500 }
    );
  }
}
