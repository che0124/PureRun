import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GarminConnect } = require('garmin-connect');
import { normalizeActivity } from '@/lib/garmin';

import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';


// 延遲輔助函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const { garminEmail, garminPassword } = await req.json();
    const deviceId = await getDeviceId();

    const hasGarmin = !!(garminEmail && garminPassword);

    if (!hasGarmin) {
      return NextResponse.json({ message: '請提供 Garmin 憑證。' }, { status: 400 });
    }

    // 處理 Demo 模式
    const isDemo = hasGarmin && (garminEmail.toLowerCase() === 'demo' || garminEmail.toLowerCase() === 'demo@example.com');
    if (isDemo) {
      return NextResponse.json({ success: true, message: 'Demo 模式：略過實際同步' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let normalized: any[] = [];

    // --- Garmin Sync ---
    if (hasGarmin && !isDemo) {
      const gcClient = new GarminConnect({ username: garminEmail, password: garminPassword });
      const tokenFile = path.join(os.tmpdir(), 'purerun-garmin-token.json');

      try {
        await gcClient.loadTokenByFile(tokenFile);
      } catch {
        await gcClient.login();
        try { await gcClient.exportTokenToFile(tokenFile); } catch {}
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rawActivities: any[] = [];
      try {
        rawActivities = await gcClient.getActivities(0, 10);
      } catch (apiErr: unknown) {
        const err = apiErr as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (err.response?.status === 401 || err.response?.status === 403) {
          await gcClient.login();
          await gcClient.exportTokenToFile(tokenFile);
          rawActivities = await gcClient.getActivities(0, 10);
        } else {
          throw err;
        }
      }

      const runs = rawActivities
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) => a.activityType?.typeKey === 'running' || a.activityType?.typeKey === 'treadmill_running')
        .slice(0, 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const garminNormalized = runs.map((a: any) => {
        const norm = normalizeActivity(a);
        return { ...norm, source: 'Garmin' };
      });
      normalized = [...normalized, ...garminNormalized];
    }


    // Sort combined activities by date descending
    normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // Deduplicate if needed, but for MVP we assume user uses either Garmin or Strava, or they are fine with both.

    // 準備 GPX 儲存目錄
    const gpxDir = process.env.VERCEL ? '/tmp/gpx' : path.join(process.cwd(), 'data', 'gpx');
    await fs.mkdir(gpxDir, { recursive: true });

    // 2. 迴圈比對 Prisma 資料庫
    for (const act of normalized) {
      const activityIdBigInt = BigInt(act.activityId);

      // 檢查是否已存在
      const existing = await prisma.garminActivity.findUnique({
        where: { 
          deviceId_activityId: { deviceId, activityId: activityIdBigInt }
        }
      });

      let routeDataStr: string | null = act.routeData || (existing?.routeData ?? null);
      let metricsDataStr: string | null = existing?.metricsData ?? null;

      // 如果不存在，或是已存在但缺少詳細資料，進一步呼叫 Garmin API 取得詳細資料 (軌跡、Metrics) 與 GPX
      const needsDetails = !existing 
        || (!existing.routeData && act.activityTypeKey !== 'indoor_running' && act.activityTypeKey !== 'treadmill_running') 
        || !existing.metricsData
        || existing.metricsData.includes('"pace":null');

      if (needsDetails && act.source === 'Garmin') {
        try {
          const gcClient = new GarminConnect({ username: garminEmail, password: garminPassword });
          const tokenFile = path.join(os.tmpdir(), 'purerun-garmin-token.json');
          await gcClient.loadTokenByFile(tokenFile);
          
          // 取得詳細資訊 (包含 Metrics 與 Polyline)
          const details = await gcClient.get(`https://connectapi.garmin.com/activity-service/activity/${act.activityId}/details`);
          
          if (details) {
            // 處理軌跡 (Polyline)
            if (details.geoPolylineDTO && details.geoPolylineDTO.polyline) {
               
              const points = details.geoPolylineDTO.polyline
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.lat && p.lon)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => [p.lat, p.lon]);
              if (points.length > 0) {
                routeDataStr = JSON.stringify(points);
              }
            }
            
            // 處理 Metrics (HR, Pace, Cadence)
            if (details.metricDescriptors && details.activityDetailMetrics) {
              const desc = details.metricDescriptors;

              const getIndex = (keys: string[]) => {
                const idx = desc.findIndex((d: any) => keys.includes(d.key));
                if (idx >= 0 && typeof desc[idx].metricsIndex === 'number') {
                  return desc[idx].metricsIndex;
                }
                return idx;
              };

              const idxHr = getIndex(['directHeartRate']);
              const idxSpeed = getIndex(['directSpeed', 'enhancedSpeed', 'speed']);
              const idxElev = getIndex(['directElevation', 'directUncorrectedElevation', 'elevation', 'enhancedAltitude']);
              const idxCadence = getIndex(['directRunCadence', 'directDoubleCadence', 'cadence', 'runCadence']);
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const metrics = details.activityDetailMetrics.map((m: any, i: number) => {
                 const vals = m.metrics;
                 return {
                   time: `${i}`,
                   hr: idxHr >= 0 ? vals[idxHr] : null,
                   pace: idxSpeed >= 0 && vals[idxSpeed] > 0 ? (1000 / 60 / vals[idxSpeed]) : null,
                   elevation: idxElev >= 0 ? vals[idxElev] : null,
                   cadence: idxCadence >= 0 ? vals[idxCadence] : null
                 };
              });
              metricsDataStr = JSON.stringify(metrics);
            }
          }

          if (act.activityTypeKey !== 'indoor_running' && act.activityTypeKey !== 'treadmill_running') {
            // 下載 GPX 檔案之前稍作延遲避免頻繁請求
            await new Promise(r => setTimeout(r, 1000));
            const gpxData = await gcClient.get(`https://connectapi.garmin.com/download-service/export/gpx/activity/${act.activityId}`);
            const gpxPath = path.join(gpxDir, `${act.activityId}.gpx`);
            
            if (typeof gpxData === 'string' || Buffer.isBuffer(gpxData)) {
              await fs.writeFile(gpxPath, gpxData);
            } else if (typeof gpxData === 'object') {
              await fs.writeFile(gpxPath, JSON.stringify(gpxData));
            }
          }
        } catch (error: unknown) {
          console.error(`Failed to fetch details/GPX for activity ${act.activityId}:`, error instanceof Error ? error.message : String(error));
        }
      }

      // 3. 針對每一筆活動，使用 Prisma 的 upsert 方法寫入 SQLite
      await prisma.garminActivity.upsert({
        where: { 
          deviceId_activityId: { deviceId, activityId: activityIdBigInt }
        },
        update: {
          activityName: act.activityName,
          date: new Date(act.date),
          // 如果只需要更新摘要可在此處加入更多欄位，若已存在則不修改原始歷史資料
          routeData: routeDataStr || undefined,
          metricsData: metricsDataStr || undefined,
        },
        create: {
          deviceId,
          activityId:      activityIdBigInt,
          source:          act.source || 'Garmin',
          activityName:    act.activityName,
          date:            new Date(act.date),
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
          routeData:       routeDataStr,
          metricsData:     metricsDataStr,
        }
      });

      // 4. 在迴圈中加入適當的延遲 (Delay) 避免被 Garmin 鎖 IP
      await delay(2000); // 延遲 2 秒
    }

    // --------------------------------------------------------
    // 更新儀表板統計資料 (GarminStats)
    // --------------------------------------------------------
    const allActivities = await prisma.garminActivity.findMany({
      where: { deviceId }
    });
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
        where: { deviceId },
        orderBy: { date: 'desc' }
    });

    await prisma.garminStats.upsert({
      where: { deviceId },
      update: {
        weeklyKm,
        avgHr,
        avgPaceStr: firstRun?.avgPaceStr || '--',
        estimatedVdot: maxVdot,
        totalActivities: allActivities.length,
      },
      create: {
        deviceId,
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
      where: { status: 'Pending', plan: { deviceId } }
    });
    const todayStr = new Date().toISOString().split('T')[0];

    for (const w of activeWorkouts) {
      if (w.workoutType === 'Rest') continue;

      // 在已同步的活動中尋找同一天的跑步記錄
      const match = allActivities.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (act: any) => act.date.toISOString().split('T')[0] === w.date && act.activityTypeKey.includes('running')
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

    return NextResponse.json({ success: true, message: '數據同步成功！' });
  } catch (error: unknown) {
    console.error('Sync Error:', error);
    return NextResponse.json({ message: '同步失敗，請確認憑證是否正確。', details: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
