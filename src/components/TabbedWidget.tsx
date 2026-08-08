'use client';

import React, { useState } from 'react';

interface Tab {
  name: string;
  content: React.ReactNode;
}

interface Props {
  tabs: Tab[];
}

export default function TabbedWidget({ tabs }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full h-full flex flex-col bg-surface-hover/50 backdrop-blur-3xl rounded-[2rem] border border-border shadow-xl overflow-hidden">
      
      {/* Tab Headers */}
      <div className="flex px-6 pt-5 gap-6 border-b border-border">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`pb-3 text-sm font-bold tracking-widest transition-all relative ${
                isActive ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.name}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tabs[activeTab].content}
      </div>
      
    </div>
  );
}
