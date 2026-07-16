'use client';
import dynamic from 'next/dynamic';

const RealMapWrapper = dynamic(
  () => import('./RealMapVisualizer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] md:h-[400px] rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-500">Loading Map Core...</span>
        </div>
      </div>
    )
  }
);

export default RealMapWrapper;
