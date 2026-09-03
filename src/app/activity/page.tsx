import React from 'react';
import { prisma } from '@/lib/db';
import { getDeviceId } from '@/lib/device';
import ActivityHistoryList from '@/components/ActivityHistoryList';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  // 為了效能，Server Component 初始只載入前 10 筆資料
  const deviceId = await getDeviceId();

  let activitiesPayload: any[] = [];
  let totalCount = 0;
  let dbError = false;

  try {
    const initialActivities = await prisma.garminActivity.findMany({
      where: { deviceId },
      take: 10,
      orderBy: { date: 'desc' }
    });

    totalCount = await prisma.garminActivity.count({
      where: { deviceId }
    });

    activitiesPayload = initialActivities.map((a: any) => ({
      ...a,
      activityId: a.activityId.toString(),
      date: typeof a.date === 'string' ? a.date : new Date(a.date).toLocaleDateString('en-CA')
    }));
  } catch (error) {
    console.warn('ActivityPage: Database unreachable, showing empty state.');
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-emerald-500/30 selection:text-emerald-50">
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">

        {dbError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-xl text-center">
            ⚠️ 無法連線至資料庫，目前顯示為空白狀態。請檢查網路連線或資料庫設定。
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6 relative">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent text-emerald-500 text-[11px] font-medium border border-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <Activity className="w-3.5 h-3.5" />
                運動數據庫
              </div>
              歷史活動紀錄
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              自動同步來自 Garmin Connect 的活動數據，隨時回顧您的訓練歷程
            </p>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-muted)] tracking-wider bg-surface-hover/20 px-3 py-1.5 rounded-md border border-border flex items-center shrink-0">
            共 <span className="text-emerald-500 font-bold mx-1 text-xs">{totalCount}</span> 筆活動
          </div>
        </div>

        {/* List - 無限滾動元件 */}
        <div className="w-full">
          <ActivityHistoryList initialActivities={activitiesPayload} />
        </div>
      </div>
    </div>
  );
}
