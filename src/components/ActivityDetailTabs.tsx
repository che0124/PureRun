'use client';

import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, Footprints, Map } from 'lucide-react';

interface Props {
  overviewContent: React.ReactNode;
  chartsContent: React.ReactNode;
  dynamicsContent: React.ReactNode;
}

export default function ActivityDetailTabs({
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
    <div className="space-y-6 md:space-y-8 w-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide border-b border-border/50 sticky top-16 md:top-0 z-30 bg-background/80 backdrop-blur-md pt-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl md:rounded-xl font-bold text-sm transition-all whitespace-nowrap border-b-2 md:border-2 ${
                isActive
                  ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                  : 'border-transparent text-[var(--text-secondary)] hover:bg-surface-hover hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px] w-full animate-in fade-in duration-500">
        {activeTab === 'overview' && (
           <div className="space-y-8">{overviewContent}</div>
        )}
        {activeTab === 'charts' && (
           <div className="space-y-8">{chartsContent}</div>
        )}
        {activeTab === 'dynamics' && (
           <div className="space-y-8">{dynamicsContent}</div>
        )}
      </div>
    </div>
  );
}
