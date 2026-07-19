'use client';

import { useState } from 'react';
import { loadCredentials } from '@/lib/credentials';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'no_creds' | 'timeout' | 'error';

export default function SyncGarminButton() {
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

  const getButtonStyle = () => {
    switch (status) {
      case 'syncing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse cursor-wait';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'no_creds':
      case 'timeout':
      case 'error':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/35';
      default:
        return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer';
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">SYNCING...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-450" />
            <span className="hidden sm:inline">SUCCESS</span>
          </div>
        );
      case 'no_creds':
        return (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">NO CREDS</span>
          </div>
        );
      case 'timeout':
        return (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-405" />
            <span className="hidden sm:inline">TIMEOUT</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-455" />
            <span className="hidden sm:inline">SYNC ERR</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">SYNC</span>
          </div>
        );
    }
  };

  return (
    <button
      className={`relative group overflow-hidden px-3.5 py-1.5 font-mono font-bold rounded-xl border transition-all duration-300 disabled:opacity-50 text-[10px] tracking-wider uppercase select-none ${getButtonStyle()}`}
      onClick={handleSync}
      disabled={status === 'syncing'}
      title="同步 Garmin 數據"
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-450/10 to-transparent -translate-x-full group-hover:animate-glow-sweep pointer-events-none" />
      {getButtonContent()}
    </button>
  );
}
