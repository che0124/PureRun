'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import RecentActivitiesList from '@/components/RecentActivitiesList';
import { Loader2 } from 'lucide-react';
import { formatDurationHHMMSS } from '@/lib/formatters';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ActivityHistoryList({ initialActivities = [] }: { initialActivities?: any[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>(initialActivities);
  const [page, setPage] = useState(initialActivities.length > 0 ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities?page=${currentPage}&limit=10`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      // 確保日期格式與原本相容
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newActivities = data.data.map((act: any) => ({
        ...act,
        date: act.date ? new Date(act.date).toLocaleDateString('en-CA') : 'N/A' // en-CA 產出 YYYY-MM-DD
      }));

      setActivities((prev) => {
        // 過濾掉可能重複的 ID，避免 React key 錯誤
        const existingIds = new Set(prev.map(p => p.activityId.toString()));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueNew = newActivities.filter((n: any) => !existingIds.has(n.activityId.toString()));
        return [...prev, ...uniqueNew];
      });

      setHasMore(data.hasMore);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 用來綁定在最後一個元素上的 ref，觸發載入更多
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchActivities(page);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, page, fetchActivities]
  );

  useEffect(() => {
    if (initialActivities.length === 0 && activities.length === 0 && hasMore && !loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchActivities(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedActivities = React.useMemo(() => {
    const groups: { [monthStr: string]: any[] } = {};
    activities.forEach(act => {
      const d = new Date(act.date);
      if (isNaN(d.getTime())) return;
      const monthStr = d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(act);
    });
    return groups;
  }, [activities]);

  return (
    <div className="flex flex-col gap-10 w-full">

      {Object.entries(groupedActivities).map(([monthStr, monthActs]) => {
        const totalDistance = monthActs.reduce((sum, a) => sum + (a.distanceKm || 0), 0).toFixed(1);
        const totalDuration = monthActs.reduce((sum, a) => sum + (a.durationMin || 0), 0);

        return (
          <div key={monthStr} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between border-b border-border/50 pb-2 gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-wide flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                {monthStr}
              </h2>
              <div className="flex items-center gap-4 text-sm font-mono text-[var(--text-secondary)] bg-surface/30 px-3 py-1 rounded-lg border border-border/50">
                <span><strong className="text-[var(--text-primary)]">{monthActs.length}</strong> 筆</span>
                <span><strong className="text-[var(--text-primary)]">{totalDistance}</strong> km</span>
                <span><strong className="text-[var(--text-primary)]">{formatDurationHHMMSS(totalDuration)}</strong></span>
              </div>
            </div>
            <RecentActivitiesList activities={monthActs} />
          </div>
        );
      })}

      {activities.length === 0 && !loading && (
        <RecentActivitiesList activities={[]} />
      )}

      {/* 底部載入觸發區 */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="w-full flex justify-center py-8 text-emerald-500/50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-mono text-sm tracking-wider">載入中...</span>
            </div>
          ) : (
            <div className="h-5"></div> // 佔位高度確保觀察者能觸發
          )}
        </div>
      )}

      {!hasMore && activities.length > 0 && (
        <div className="w-full text-center border-t border-border/30">
          <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase">
            已載入全部活動紀錄
          </span>
        </div>
      )}
    </div>
  );
}
