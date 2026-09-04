'use client';

import { useState } from 'react';
import { loadCredentials } from '@/lib/credentials';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'no_creds' | 'timeout' | 'error';

interface SyncGarminButtonProps {
  variant?: 'circular' | 'full' | 'pill';
  className?: string;
}

export default function SyncGarminButton({
  variant = 'circular',
  className = ''
}: SyncGarminButtonProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const router = useRouter();

  const handleSync = async () => {
    if (status === 'syncing') return;

    const creds = loadCredentials();
    const hasGarmin = !!(creds.garminEmail && creds.garminPassword);
    const hasStrava = !!(creds.stravaClientId && creds.stravaClientSecret && creds.stravaRefreshToken);

    if (!hasGarmin && !hasStrava) {
      setStatus('no_creds');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('syncing');

    try {
      const res = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garminEmail: creds.garminEmail,
          garminPassword: creds.garminPassword,
          stravaClientId: creds.stravaClientId,
          stravaClientSecret: creds.stravaClientSecret,
          stravaRefreshToken: creds.stravaRefreshToken
        }),
      });

      if (res.ok) {
        setStatus('success');
        router.refresh();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('timeout');
    } finally {
      // Revert back to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse cursor-wait';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'no_creds':
      case 'timeout':
      case 'error':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/35';
      default:
        return 'bg-surface border-border text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'syncing':
        return '同步中...';
      case 'success':
        return '同步成功！';
      case 'no_creds':
        return '請先於設定填寫憑證';
      case 'timeout':
        return '同步逾時，請重試';
      case 'error':
        return '同步失敗，請檢查憑證';
      default:
        return '同步 Garmin 數據';
    }
  };

  if (variant === 'circular') {
    return (
      <button
        type="button"
        onClick={handleSync}
        disabled={status === 'syncing'}
        className={`relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all active:scale-95 shrink-0 ${getStatusColor()} ${className}`}
        title={getStatusTitle()}
        aria-label={getStatusTitle()}
      >
        {status === 'syncing' && <RefreshCw className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-spin text-amber-400" />}
        {status === 'success' && <CheckCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400" />}
        {(status === 'no_creds' || status === 'error') && <XCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />}
        {status === 'timeout' && <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />}
        {status === 'idle' && (
          <RefreshCw className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:rotate-180 transition-transform duration-500" />
        )}
      </button>
    );
  }

  // Full or Pill variant for sidebar/dashboard
  return (
    <button
      type="button"
      className={`relative group overflow-hidden px-3.5 py-2 font-mono font-bold rounded-xl border transition-all duration-300 disabled:opacity-50 text-xs tracking-wider uppercase select-none w-full flex items-center justify-center gap-2 ${getStatusColor()} ${className}`}
      onClick={handleSync}
      disabled={status === 'syncing'}
      title={getStatusTitle()}
    >
      {status === 'syncing' && (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>SYNCING...</span>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>SUCCESS</span>
        </>
      )}
      {status === 'no_creds' && (
        <>
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>NO CREDS</span>
        </>
      )}
      {status === 'timeout' && (
        <>
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>TIMEOUT</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>SYNC ERR</span>
        </>
      )}
      {status === 'idle' && (
        <>
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>SYNC GARMIN</span>
        </>
      )}
    </button>
  );
}
