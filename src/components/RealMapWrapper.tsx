'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import type { RealMapProps } from './RealMapVisualizer';

const DynamicMap = dynamic<RealMapProps>(
  () => import('./RealMapVisualizer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-background/80 border border-border flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-[var(--text-muted)]">Loading Map Core...</span>
        </div>
      </div>
    )
  }
);

export default function RealMapWrapper(props: RealMapProps) {
  return <DynamicMap {...props} />;
}

