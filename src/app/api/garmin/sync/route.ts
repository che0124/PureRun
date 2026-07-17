import { NextResponse } from 'next/server';
const { GarminConnect } = require('garmin-connect');
import { normalizeActivity } from '@/lib/garmin';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// 延遲輔助函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const { garminEmail, garminPassword } = await req.json();

    if (!garminEmail || !garminPassword) {
      return NextResponse.json({ message: '請提供 Garmin 帳號密碼。' }, { status: 400 });
    }

    // 處理 Demo 模式
    const isDemo = garminEmail.toLowerCase() === 'demo' || garminEmail.toLowerCase() === 'demo@example.com';
    if (isDemo) {
      return NextResponse.json({ success: true, message: 'Demo 模式：略過實際同步' });
    }

    const gcClient = new GarminConnect({ username: garminEmail, password: garminPassword });
    const tokenFile = path.join(os.tmpdir(), 'purerun-garmin-token.json');

    // 嘗試使用 Token 登入，失敗則重新登入
    try {
      await gcClient.loadTokenByFile(tokenFile);
    } catch (err) {
      await gcClient.login();
      try { await gcClient.exportTokenToFile(tokenFile); } catch (e) {}
    }

    // 1. 呼叫 Garmin API 取得最近 10 筆活動列表
    let rawActivities: any[] = [];
    try {
      rawActivities = await gcClient.getActivities(0, 10);
    } catch (apiErr: any) {
      if (apiErr.response?.status === 401 || apiErr.response?.status === 403) {
        await gcClient.login();
        await gcClient.exportTokenToFile(tokenFile);
        rawActivities = await gcClient.getActivities(0, 10);
      } else {
        throw apiErr;
      }
    }

    // 篩選跑步活動並轉換為共用格式
    const runs = rawActivities
      .filter((a: any) => a.activityType?.typeKey === 'running' || a.activityType?.typeKey === 'treadmill_running')
      .slice(0, 10);
    const normalized = runs.map((a: any) => normalizeActivity(a));

    // 準備 GPX 儲存目錄
    const gpxDir = process.env.VERCEL ? '/tmp/gpx' : path.join(process.cwd(), 'data', 'gpx');
    await fs.mkdir(gpxDir, { recursive: true });

    // 2. 迴圈比對 Prisma 資料庫
    for (const act of normalized) {
      const activityIdBigInt = BigInt(act.activityId);

      // 檢查是否已存在
      const existing = await prisma.garminActivity.findUnique({
        where: { activityId: activityIdBigInt }
      });

      // 如果不存在，進一步呼叫 Garmin API 下載 GPX 檔案並存入本地資料夾
      if (!existing) {
        if (act.activityTypeKey !== 'indoor_running' && act.activityTypeKey !== 'treadmill_running') {
          try {
            // 下載 GPX 檔案
            const gpxData = await gcClient.get(`https://connectapi.garmin.com/download-service/export/gpx/activity/${act.activityId}`);
            const gpxPath = path.join(gpxDir, `${act.activityId}.gpx`);
            
            if (typeof gpxData === 'string' || Buffer.isBuffer(gpxData)) {
              await fs.writeFile(gpxPath, gpxData);
            } else if (typeof gpxData === 'object') {
              await fs.writeFile(gpxPath, JSON.stringify(gpxData));
            }
          } catch (error: any) {
            console.error(`Failed to download GPX for activity ${act.activityId}:`, error.message);
          }
        }
      }

      // 3. 針對每一筆活動，使用 Prisma 的 upsert 方法寫入 SQLite
      await prisma.garminActivity.upsert({
        where: { activityId: activityIdBigInt },
        update: {
          activityName: act.activityName,
          // 如果只需要更新摘要可在此處加入更多欄位，若已存在則不修改原始歷史資料
        },
        create: {
          activityId:      activityIdBigInt,
          activityName:    act.activityName,
          date:            act.date,
          distanceKm:      act.distanceKm,
          durationMin:     act.durationMin,
          avgHr:           act.avgHr,
          maxHr:           act.maxHr,
          avgPaceMinPerKm: act.avgPaceMinPerKm,
          avgPaceStr:      act.avgPaceStr,
          vO2MaxValue:     act.vO2MaxValue,
          calories:        act.calories,
          activityTypeKey: act.activityTypeKey,
          elevationGain:   act.elevationGain,
          cadence:         act.cadence,
          strideLength:    act.strideLength,
          trainingEffect:  act.trainingEffect,
        }
      });

      // 4. 在迴圈中加入適當的延遲 (Delay) 避免被 Garmin 鎖 IP
      await delay(2000); // 延遲 2 秒
    }

    // --------------------------------------------------------
    // 更新儀表板統計資料 (GarminStats)
    // --------------------------------------------------------
    const allActivities = await prisma.garminActivity.findMany();
    let weeklyKm = 0;
    let totalHr = 0;
    let hrCount = 0;
    let maxVdot = 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const run of allActivities) {
      const runDate = new Date(run.date);
      if (runDate >= oneWeekAgo) {
        weeklyKm += run.distanceKm;
      }
      if (run.avgHr && run.avgHr > 0) {
        totalHr += run.avgHr;
        hrCount++;
      }
      if (run.vO2MaxValue && run.vO2MaxValue > maxVdot) {
        maxVdot = run.vO2MaxValue;
      }
    }

    weeklyKm = Math.round(weeklyKm * 10) / 10;
    const avgHr = hrCount > 0 ? Math.round(totalHr / hrCount) : 0;
    const firstRun = await prisma.garminActivity.findFirst({
        orderBy: { date: 'desc' }
    });

    await prisma.garminStats.upsert({
      where: { id: 1 },
      update: {
        weeklyKm,
        avgHr,
        avgPaceStr: firstRun?.avgPaceStr || '--',
        estimatedVdot: maxVdot,
        totalActivities: allActivities.length,
      },
      create: {
        id: 1,
        weeklyKm,
        avgHr,
        avgPaceStr: firstRun?.avgPaceStr || '--',
        estimatedVdot: maxVdot,
        totalActivities: allActivities.length,
      },
    });

    // --------------------------------------------------------
    // 自動更新已完成的訓練計畫 (Workouts)
    // --------------------------------------------------------
    const activeWorkouts = await prisma.workout.findMany({
      where: { status: 'Pending' }
    });
    const todayStr = new Date().toISOString().split('T')[0];

    for (const w of activeWorkouts) {
      if (w.workoutType === 'Rest') continue;

      // 在已同步的活動中尋找同一天的跑步記錄
      const match = allActivities.find(
        (act: any) => act.date === w.date && act.activityTypeKey.includes('running')
      );

      if (match) {
        let compRate = 100;
        let targetDist = 0;
        const numMatch = w.description.match(/(\d+(\.\d+)?)\s*(公里|km|KM|k|K)/);
        if (numMatch) {
          targetDist = parseFloat(numMatch[1]);
        }
        if (targetDist > 0) {
          compRate = Math.min(100, Math.round((match.distanceKm / targetDist) * 100));
        }

        await prisma.workout.update({
          where: { id: w.id },
          data: {
            status: 'Completed',
            actualActivityId: match.activityId,
            actualDistance: match.distanceKm,
            actualDuration: Math.round(match.durationMin),
            actualAvgHr: match.avgHr,
            actualPaceStr: match.avgPaceStr,
            complianceRate: compRate,
          }
        });
      } else if (w.date < todayStr && w.status === 'Pending') {
        // 如果日期已過且無活動則標記為 Missed
        await prisma.workout.update({
          where: { id: w.id },
          data: { status: 'Missed' }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Garmin 數據同步成功！' });
  } catch (error: any) {
    console.error('Garmin Sync Error:', error);
    return NextResponse.json({ message: 'Garmin 同步失敗，請確認帳號密碼。', details: error.message }, { status: 502 });
  }
}
