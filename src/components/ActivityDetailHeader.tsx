'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2 } from 'lucide-react';

interface ActivityDetailHeaderProps {
  activityId: string;
  activityName: string;
}

export default function ActivityDetailHeader({
  activityId,
  activityName
}: ActivityDetailHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/activity');
    }
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-background/95 backdrop-blur-xl border-b border-border/80 shadow-sm transition-all pt-safe">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-border text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer active:scale-95 shrink-0"
          title="返回上一頁"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="flex-1 min-w-0 text-center px-2">
          <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate block">
            跑步
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href={`/activity/${activityId}/share`}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-border text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer active:scale-95 shrink-0"
            title="分享活動圖卡"
          >
            <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
