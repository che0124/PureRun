import React from 'react';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import { notFound } from 'next/navigation';
import ShareEditor from '@/components/ShareEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SharePage({ params }: PageProps) {
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

    // Format data for the client component
    const activityData = {
      id: activity.activityId.toString(),
      name: activity.activityName,
      date: activity.date.toISOString(),
      distanceKm: parseFloat(activity.distanceKm.toString()),
      durationMin: activity.durationMin || 0,
      avgPaceStr: activity.avgPaceStr,
      avgHr: activity.avgHr,
      calories: activity.calories,
      isRun: activity.activityTypeKey === 'running',
      routeData: activity.routeData ? activity.routeData.toString() : null
    };

    return <ShareEditor activity={activityData} />;

  } catch (error) {
    console.error('SharePage Error:', error);
    return notFound();
  }
}
