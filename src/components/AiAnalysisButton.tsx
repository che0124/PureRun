'use client';

import React, { useState } from 'react';
import { loadCredentials } from '@/lib/credentials';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  activityId: string;
}

export default function AiAnalysisButton({ activityId }: Props) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    const creds = loadCredentials();
    if (!creds.geminiApiKey) {
      setError('請先至 Settings 設定 Gemini API Key');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/ai/analyze-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          geminiApiKey: creds.geminiApiKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '分析失敗');
      }

      setAnalysis(data.analysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Brain className="w-6 h-6 text-emerald-400" />
          AI 賽後深度覆盤
        </h2>
        
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            生成分析報告
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3 text-rose-400 relative z-10">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading && (
        <div className="mt-6 flex flex-col items-center justify-center py-10 space-y-4 relative z-10">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            <Brain className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-emerald-400 font-mono text-sm tracking-widest animate-pulse">
            ANALYZING TELEMETRY...
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="mt-6 prose prose-invert prose-emerald max-w-none relative z-10 
          prose-headings:font-bold prose-headings:text-slate-100
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-emerald-400
          prose-li:text-slate-300
          bg-slate-950/50 p-6 rounded-xl border border-slate-800">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
      
      {!analysis && !loading && !error && (
        <p className="text-sm text-slate-500 mt-2 relative z-10">
          讓 PureRun_AI 的專業虛擬教練為您解析本次跑步的配速策略、心率區間，並給予未來訓練建議。
        </p>
      )}
    </div>
  );
}
