import React from 'react';
import { cookies } from 'next/headers';
import StravaLoginButton from '@/components/StravaLoginButton';
import { CheckCircle2, AlertCircle, Activity, User } from 'lucide-react';

// 定義 Strava 運動員資料的型別
interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
}

export default async function StravaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('strava_access_token');
  const isAuthenticated = !!accessToken?.value;

  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;

  let athleteProfile: StravaAthlete | null = null;

  // 如果已經登入（拿到 token），我們實際去 Strava API 抓取「當前登入者」的個人資料
  if (isAuthenticated && accessToken?.value) {
    try {
      const res = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
        // 快取策略依需求設定，這裡設為不快取以確保取得最新資料
        cache: 'no-store',
      });
      
      if (res.ok) {
        athleteProfile = await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch Strava athlete:', err);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-400">授權失敗</h3>
              <p className="text-xs text-red-300 mt-1">錯誤原因：{error}。請重新嘗試。</p>
            </div>
          </div>
        )}

        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-8 border border-white/[0.05] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FC4C02]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Strava 帳號連結
            </h1>
            
            {isAuthenticated ? (
              <div className="flex flex-col items-center space-y-5 animate-fade-up w-full">
                {/* 顯示登入者的個人資料 */}
                {athleteProfile ? (
                  <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={athleteProfile.profile} 
                      alt={`${athleteProfile.firstname} avatar`}
                      className="w-20 h-20 rounded-full border-2 border-[#FC4C02] shadow-[0_0_15px_rgba(252,76,2,0.3)] mb-3"
                    />
                    <h2 className="text-lg font-bold text-slate-100">
                      {athleteProfile.firstname} {athleteProfile.lastname}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" /> Strava ID: {athleteProfile.id}
                    </p>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-bold text-emerald-400">授權成功！</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    我們已經取得您的專屬 Access Token。<br/>
                    這代表任何一位使用者，都可以透過這個流程登入自己的 Strava 帳號，讓系統獲取「他自己」的運動數據。
                  </p>
                </div>

                <a 
                  href="/"
                  className="mt-4 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" /> 回首頁查看數據
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 animate-fade-up">
                <p className="text-sm text-slate-400">
                  請點擊下方按鈕，每位使用者都能登入自己的 Strava 帳號，並授權應用程式讀取「自己」的訓練數據。
                </p>
                <div className="mt-4">
                  <StravaLoginButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
