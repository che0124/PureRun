import React from 'react';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import { notFound } from 'next/navigation';
import ActivityMapViewer from '@/components/ActivityMapViewer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityMapPage({ params }: PageProps) {
  const { id } = await params;
  const deviceId = await getDeviceId();

  try {
    const activity = await prisma.garminActivity.findUnique({
      where: {
        deviceId_activityId: {
          deviceId,
          activityId: BigInt(id)
        }
      }
    });

    if (!activity) {
      return notFound();
    }

    const activityData = {
      id: activity.activityId.toString(),
      name: activity.activityName,
      date: activity.date.toISOString(),
      distanceKm: parseFloat(activity.distanceKm.toString()),
      durationMin: activity.durationMin || 0,
      avgPaceStr: activity.avgPaceStr,
      avgHr: activity.avgHr,
      maxHr: activity.maxHr,
      elevationGain: activity.elevationGain,
      calories: activity.calories,
      cadence: activity.cadence,
      strideLength: activity.strideLength,
      isRun: activity.activityTypeKey === 'running',
      routeData: activity.routeData ? activity.routeData.toString() : null
    };

    return <ActivityMapViewer activity={activityData} />;
  } catch (error) {
    console.error('ActivityMapPage Error:', error);
    return notFound();
  }
}
