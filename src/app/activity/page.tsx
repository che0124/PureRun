import React from 'react';
import { prisma } from '@/lib/db';
import ActivityHistoryList from '@/components/ActivityHistoryList';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  // 為了效能，Server Component 初始只載入前 10 筆資料
  const initialActivities = await prisma.garminActivity.findMany({
    take: 10,
    orderBy: { date: 'desc' }
  });

  const totalCount = await prisma.garminActivity.count();

  const activitiesPayload = initialActivities.map(a => ({
    ...a,
    activityId: a.activityId.toString(),
    date: typeof a.date === 'string' ? a.date : new Date(a.date).toLocaleDateString('en-CA')
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-900 pb-6 relative">
          <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-emerald-500/30 to-transparent"></div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-slate-50">
                所有活動紀錄
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-xl">
                這裡列出了您同步的所有跑步與活動紀錄，向下滾動即可自動載入更多歷史紀錄。
              </p>
            </div>
          </div>
          <div className="font-mono text-[10px] text-slate-500 tracking-wider bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            總筆數：{totalCount}
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
