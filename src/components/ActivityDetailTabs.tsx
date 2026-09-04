'use client';

import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, Footprints, Map } from 'lucide-react';

interface Props {
  headerContent?: React.ReactNode;
  overviewContent: React.ReactNode;
  chartsContent: React.ReactNode;
  dynamicsContent: React.ReactNode;
}

export default function ActivityDetailTabs({
  headerContent,
  overviewContent,
  chartsContent,
  dynamicsContent
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'dynamics'>('overview');

  const tabs = [
    { id: 'overview', label: '總覽', icon: LayoutDashboard },
    { id: 'charts', label: '圖表分析', icon: BarChart3 },
    { id: 'dynamics', label: '跑步動態', icon: Footprints },
  ] as const;

  return (
    <div className="w-full">
      {/* Sticky Tab Navigation Bar */}
      <div className="sticky top-16 z-[90] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 bg-background/95 backdrop-blur-xl border-b border-border/80 mb-2 sm:mb-4 transition-all">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-0.5 max-w-6xl mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap border-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 shadow-sm'
                    : 'border-transparent text-[var(--text-secondary)] hover:bg-surface-hover hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header / Title Info Section */}
      {headerContent}

      {/* Tab Content */}
      <div className="w-full animate-in fade-in duration-300">
        {activeTab === 'overview' && overviewContent}
        {activeTab === 'charts' && (
           <div className="space-y-6 sm:space-y-8">{chartsContent}</div>
        )}
        {activeTab === 'dynamics' && (
           <div className="space-y-6 sm:space-y-8">{dynamicsContent}</div>
        )}
      </div>
    </div>
  );
}
