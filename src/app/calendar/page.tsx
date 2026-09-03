import React from 'react';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import ActivityCalendar from '@/components/ActivityCalendar';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const deviceId = await getDeviceId();

  let allActivitiesAsc: any[] = [];
  let dbError = false;

  try {
    allActivitiesAsc = await prisma.garminActivity.findMany({
      where: { deviceId },
      select: {
        activityId: true,
        date: true,
        distanceKm: true,
        durationMin: true,
        activityTypeKey: true,
      },
      orderBy: { date: 'asc' }
    });
  } catch (error) {
    console.warn('CalendarPage: Database unreachable, showing empty state.');
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative selection:bg-emerald-500/30 selection:text-emerald-50 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-6">
      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        
        {dbError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-xl text-center mb-6">
            ⚠️ 無法連線至資料庫，目前顯示為空白狀態。請檢查網路連線或資料庫設定。
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-sans text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-emerald-500" />
              跑步月曆
            </h1>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="w-full card-glass overflow-hidden min-h-[600px]">
          <ActivityCalendar activities={allActivitiesAsc} />
        </div>
      </div>
    </div>
  );
}
