import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';

import { WorkoutBlock } from '@/lib/science/scheduler';
import { formatPace } from '@/lib/science/vdot';

export async function POST(req: Request) {
  try {
    const deviceId = await getDeviceId();
    const { blocks, startDate, goal, vdot } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json({ message: 'Invalid blocks payload.' }, { status: 400 });
    }

    // 1. Prepare rule-based descriptions
    const enrichedBlocks = blocks.map((b: WorkoutBlock) => {
      // Append the system pace to the description just to be explicit
      const paceInfo = b.paceZoneSeconds ? `${formatPace(b.paceZoneSeconds[0])}-${formatPace(b.paceZoneSeconds[1])}/km` : '無';
      return {
        ...b,
        description: b.description + `\n\n(系統配速設定：${paceInfo}，時間 ${b.durationMinutes} 分鐘，TSS: ${b.tssTarget})`
      };
    });
    const formattedVdot = Number(vdot).toFixed(1);
    const weeklyAnalysis = `以 ${goal} 為目標，基於當前跑力 (VDOT ${formattedVdot}) 所量身打造的週期化訓練。`;

    // 2. Clear old pending workouts for this week? Or just create a new plan and delete old pending?
    // Let's delete all Pending workouts to avoid overlap, or maybe just create.
    const activePlans = await prisma.trainingPlan.findMany({
      where: { deviceId },
      select: { id: true }
    });
    const planIds = activePlans.map(p => p.id);

    await prisma.workout.deleteMany({
      where: { 
        planId: { in: planIds },
        status: 'Pending' 
      }
    });

    // 3. Create TrainingPlan
    // startDate is in YYYY-MM-DD
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const startObj = new Date(sYear, sMonth - 1, sDay);
    const endObj = new Date(sYear, sMonth - 1, sDay + 6);

    const startStr = `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, '0')}-${String(startObj.getDate()).padStart(2, '0')}`;
    const endStr = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`;

    const plan = await prisma.trainingPlan.create({
      data: {
        deviceId,
        startDate: startStr,
        endDate: endStr,
        weeklyAnalysis
      }
    });

    // 4. Create Workouts
    const workoutData = enrichedBlocks.map((b: WorkoutBlock) => {
      const dObj = new Date(sYear, sMonth - 1, sDay);
      // Ensure dayOfWeek maps correctly from start date (assuming startDate is the start of the week)
      // Actually, dayOfWeek in scheduler is 0=Sun, 1=Mon... 6=Sat
      const startDay = startObj.getDay();
      let diff = b.dayOfWeek - startDay;
      if (diff < 0) diff += 7; // next occurrence
      
      dObj.setDate(dObj.getDate() + diff);
      const dateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

      let wType = 'Rest';
      if (b.type === 'Easy') wType = 'Recovery';
      else if (b.type === 'Long') wType = 'LongRun';
      else if (b.type === 'Threshold' || b.type === 'Marathon') wType = 'Tempo';
      else if (b.type === 'Interval') wType = 'Interval';

      return {
        planId: plan.id,
        date: dateStr,
        workoutType: wType,
        title: `${b.type} Run`,
        targetPace: b.paceZoneSeconds ? `${formatPace(b.paceZoneSeconds[0])}-${formatPace(b.paceZoneSeconds[1])}` : null,
        targetHrZone: wType === 'Recovery' ? 2 : (wType === 'Tempo' ? 4 : (wType === 'Interval' ? 5 : (wType === 'Rest' ? null : 3))),
        description: b.description,
        status: 'Pending'
      };
    });

    for (const w of workoutData) {
      await prisma.workout.create({
        data: w
      });
    }

    return NextResponse.json({ success: true, message: 'Plan created successfully' });
  } catch (error: any) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 });
  }
}
