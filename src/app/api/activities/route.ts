import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;
    const take = limit;

    const deviceId = await getDeviceId();
    const activities = await prisma.garminActivity.findMany({
      where: { deviceId },
      skip,
      take,
      orderBy: { date: 'desc' },
    });

    const totalCount = await prisma.garminActivity.count({
      where: { deviceId }
    });

    // 處理 BigInt 問題
    const serializedActivities = activities.map((a: any) => ({
      ...a,
      activityId: a.activityId.toString(), // 轉為字串避免 JSON error
    }));

    const hasMore = skip + take < totalCount;

    return NextResponse.json({
      data: serializedActivities,
      page,
      limit,
      totalCount,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
