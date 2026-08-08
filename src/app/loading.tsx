import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background text-[var(--text-primary)]">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
        <Loader2 className="w-12 h-12 text-[var(--text-accent)] animate-spin relative z-10" />
      </div>
      <p className="mt-4 text-[var(--text-secondary)] font-mono text-sm tracking-widest animate-pulse">
        LOADING<span className="text-[var(--text-accent)]">_</span>
      </p>
    </div>
  );
}
