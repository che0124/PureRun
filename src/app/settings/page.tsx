'use client';

import React, { useState, useEffect } from 'react';
import { loadCredentials, saveCredentials, StoredCredentials } from '@/lib/credentials';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Activity, 
  Brain, 
  Check, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle
} from 'lucide-react';
import HeartRateZoneSettings, { HRCalcMethod, HRZonesBPM } from '@/components/settings/HeartRateZoneSettings';

type GarminStatus = 'idle' | 'testing' | 'success' | 'error';

export default function SettingsPage() {
  const [garminEmail,    setGarminEmail]    = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [stravaClientId,     setStravaClientId]     = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [stravaRefreshToken, setStravaRefreshToken] = useState('');
  const [geminiApiKey,   setGeminiApiKey]   = useState('');
  const [showPassword,   setShowPassword]   = useState(false);

  const [minHr, setMinHr] = useState(50);
  const [maxHr, setMaxHr] = useState(190);
  const [hrCalcMethod, setHrCalcMethod] = useState<HRCalcMethod>('hrr');
  const [zones, setZones] = useState<HRZonesBPM>({ z1Bottom: 120, z2Bottom: 130, z3Bottom: 150, z4Bottom: 165, z5Bottom: 175 });
  const [isZonesValid, setIsZonesValid] = useState(true);

  const [garminStatus,   setGarminStatus]   = useState<GarminStatus>('idle');
  const [garminMessage,  setGarminMessage]  = useState('');
  
  const [savedStatus, setSavedStatus] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = loadCredentials();
    setGarminEmail(saved.garminEmail);
    setGarminPassword(saved.garminPassword);
    setStravaClientId(saved.stravaClientId || '');
    setStravaClientSecret(saved.stravaClientSecret || '');
    setStravaRefreshToken(saved.stravaRefreshToken || '');
    setGeminiApiKey(saved.geminiApiKey);
    
    setMinHr(saved.minHr || 50);
    setMaxHr(saved.maxHr || 190);
    setHrCalcMethod(saved.hrCalcMethod || 'hrr');
    setZones({
      z1Bottom: saved.hrZone0Max || 120,
      z2Bottom: saved.hrZone1Max || 130,
      z3Bottom: saved.hrZone2Max || 150,
      z4Bottom: saved.hrZone3Max || 165,
      z5Bottom: saved.hrZone4Max || 175
    });

    if (saved.garminEmail) {
      setGarminStatus('success');
      setGarminMessage('已經載入儲存的帳戶');
    }
  }, []);

  const handleTestGarmin = async () => {
    setGarminStatus('testing');
    setGarminMessage('');
    
    // Check for demo mode immediately
    if (garminEmail.toLowerCase() === 'demo' || garminEmail.toLowerCase() === 'demo@example.com') {
      setTimeout(() => {
        setGarminStatus('success');
        setGarminMessage('連接成功！您好 Demo Runner (極速跑者)');
      }, 800);
      return;
    }

    try {
      const res = await fetch('/api/auth/garmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: garminEmail, password: garminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGarminStatus('success');
        setGarminMessage(`連接成功！${data.displayName ? '您好 ' + data.displayName : ''}`);
      } else {
        setGarminStatus('error');
        setGarminMessage(data.error || '認證失敗。');
      }
    } catch (err: any) {
      setGarminStatus('error');
      setGarminMessage('網路錯誤或無法連線。');
    }
  };

  const handleSave = () => {
    const current = loadCredentials();
    const creds: StoredCredentials = { 
      ...current, 
      garminEmail, 
      garminPassword, 
      stravaClientId,
      stravaClientSecret,
      stravaRefreshToken,
      geminiApiKey,
      hrCalcMethod,
      minHr,
      maxHr,
      hrZone0Max: zones.z1Bottom,
      hrZone1Max: zones.z2Bottom,
      hrZone2Max: zones.z3Bottom,
      hrZone3Max: zones.z4Bottom,
      hrZone4Max: zones.z5Bottom
    };
    saveCredentials(creds);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-fade-up">
        
        {/* Header Section */}
        <div className="border-b border-slate-900 pb-6 relative">
          <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-emerald-500/30 to-transparent"></div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-405">
              <Settings className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-slate-50">
              偏好設定
            </h1>
          </div>
          <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-xl">
            請在下方輸入您的憑證。此為本機開源專案，您的帳號密碼僅會儲存於瀏覽器本地 (`localStorage`)，不會保存在任何外部資料庫，確保您的個人資料隱私與安全性。
          </p>
        </div>

        {/* Settings Cards Wrapper */}
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.04)] transition-all duration-300 space-y-8">
          
          {/* Garmin Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-50 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Garmin 帳戶連接</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              連接您的 Garmin Connect 帳號以自動同步跑量、配速、心率與 VDOT 數值。若無帳號或連線失敗，輸入 `demo` 即可體驗完整功能。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider" htmlFor="garmin-email">Garmin 帳號 (Email)</label>
                <input
                  id="garmin-email"
                  type="email"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 transition outline-none"
                  value={garminEmail}
                  onChange={e => setGarminEmail(e.target.value)}
                  placeholder="runner@example.com 或輸入 demo"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider" htmlFor="garmin-password">Garmin 密碼</label>
                <div className="relative">
                  <input
                    id="garmin-password"
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3.5 text-sm text-slate-100 transition outline-none pr-16"
                    value={garminPassword}
                    onChange={e => setGarminPassword(e.target.value)}
                    placeholder="請輸入密碼"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-emerald-400 transition font-bold uppercase tracking-wider"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 inline-block" /> : <Eye className="w-4 h-4 inline-block" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-2">
              <button
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-200 hover:text-emerald-400 text-xs font-bold rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                onClick={handleTestGarmin}
                disabled={!garminEmail || !garminPassword || garminStatus === 'testing'}
              >
                {garminStatus === 'testing' ? '測試中...' : '測試連接'}
              </button>
              {garminStatus === 'success' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{garminMessage || '連接成功'}</span>
                </span>
              )}
              {garminStatus === 'error' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5 text-rose-455" />
                  <span>{garminMessage}</span>
                </span>
              )}
            </div>
          </div>

          {/* Strava Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-bold text-slate-50 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span>Strava 帳戶連接 (選填)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              若您使用非 Garmin 手錶，可透過 Strava API 同步資料。請前往 Strava API 設定頁面取得 Client ID、Client Secret 與 Refresh Token。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Client ID</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 transition outline-none"
                  value={stravaClientId}
                  onChange={e => setStravaClientId(e.target.value)}
                  placeholder="e.g. 123456"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Client Secret</label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 transition outline-none"
                  value={stravaClientSecret}
                  onChange={e => setStravaClientSecret(e.target.value)}
                  placeholder="請輸入 Secret"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Refresh Token</label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 transition outline-none"
                  value={stravaRefreshToken}
                  onChange={e => setStravaRefreshToken(e.target.value)}
                  placeholder="請輸入 Refresh Token"
                />
              </div>
            </div>
          </div>

          {/* AI Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-bold text-slate-50 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              <span>AI 智慧教練金鑰</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              填入您的 Gemini API 金鑰。其餘 AI 教練訓練設定（賽事目標、體能基準、每週天數等限制）已移至 <strong>AI Plan</strong> 頁面進行動態配置，以便與您的週期課表即時同步調整。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider" htmlFor="gemini-key">Gemini API Key</label>
                <input
                  id="gemini-key"
                  type="password"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-650 transition outline-none font-mono"
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
              </div>
            </div>
          </div>

          {/* Heart Rate Zones Component */}
          <HeartRateZoneSettings
            minHr={minHr} setMinHr={setMinHr}
            maxHr={maxHr} setMaxHr={setMaxHr}
            calcMethod={hrCalcMethod} setCalcMethod={setHrCalcMethod}
            zones={zones} setZones={setZones}
            onValidationChange={setIsZonesValid}
          />

          {/* Footer Save Button */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
            <button 
              className="flex-grow py-3.5 bg-emerald-400 hover:bg-emerald-350 active:scale-[0.98] text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleSave}
              disabled={!isZonesValid}
            >
              儲存金鑰與帳號設定
            </button>
            {savedStatus && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>設定已成功儲存</span>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
