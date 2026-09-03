'use client';

import React, { useRef, useState, useMemo } from 'react';
import { ArrowLeft, Download, Image as ImageIcon, Route, Timer, Activity, Type } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';

interface ActivityData {
  id: string;
  name: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  avgPaceStr: string | null;
  avgHr: number | null;
  calories: number | null;
  isRun: boolean;
  routeData: string | null;
}

function RouteSvg({ routeStr, className }: { routeStr: string | null; className?: string }) {
  const pathData = useMemo(() => {
    if (!routeStr) return null;
    try {
      const points = JSON.parse(routeStr) as [number, number][];
      if (!points || points.length === 0) return null;

      // 計算中心緯度，用以校正經度 (球體投影在小範圍內的平面近似)
      const lats = points.map(p => p[0]);
      const rawCy = (Math.min(...lats) + Math.max(...lats)) / 2;
      const cosLat = Math.cos((rawCy * Math.PI) / 180);

      // 經度依緯度縮放
      const projLons = points.map(p => p[1] * cosLat);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...projLons);
      const maxLon = Math.max(...projLons);
      
      const dx = maxLon - minLon || 0.0001;
      const dy = maxLat - minLat || 0.0001;
      
      const scale = 100 / Math.max(dx, dy);
      const cx = (minLon + maxLon) / 2;
      const cy = (minLat + maxLat) / 2;
      
      return points.map((p, i) => {
        // x 軸使用校正後的經度
        const x = 50 + ((p[1] * cosLat) - cx) * scale;
        const y = 50 - (p[0] - cy) * scale;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
    } catch {
      return null;
    }
  }, [routeStr]);

  if (!pathData) return null;

  return (
    <svg viewBox="-5 -5 110 110" className={className} preserveAspectRatio="xMidYMid meet" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}>
      <path d={pathData} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ShareEditor({ activity }: { activity: ActivityData }) {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | 'sticker'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fullCaptureRef = useRef<HTMLDivElement>(null);
  const overlayCaptureRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async (transparentOnly: boolean) => {
    const targetRef = transparentOnly ? overlayCaptureRef : fullCaptureRef;
    if (!targetRef.current) return;
    
    setIsGenerating(true);
    setErrorMsg('');

    try {
      await new Promise(res => setTimeout(res, 500));
      
      // Always use PNG to support transparency
      const dataUrl = await htmlToImage.toPng(targetRef.current, {
        quality: 1,
        cacheBust: true,
        pixelRatio: 3, 
        skipAutoScale: true,
      });
      
      const link = document.createElement('a');
      const prefix = transparentOnly ? 'overlay' : 'share';
      link.download = `purerun-${activity.id}-${prefix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image', err);
      setErrorMsg('生成圖片失敗，請再試一次。');
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedDate = new Date(activity.date).toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });

  const formatDuration = (durationMin: number) => {
    const totalSeconds = Math.round(durationMin * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Common text shadow to ensure visibility on any background without a container box
  const textShadowStyle = { textShadow: '0px 2px 8px rgba(0,0,0,0.7)' };
  
  // Dimensions
  const width = aspectRatio === '9:16' ? '360px' : '480px';
  const height = aspectRatio === '9:16' ? '640px' : aspectRatio === 'sticker' ? '400px' : '480px';

  return (
    <div className="min-h-screen bg-background text-[var(--text-primary)] font-sans pb-20">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href={`/activity/${activity.id}`} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">返回紀錄</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-surface border border-border rounded-xl text-sm font-bold hover:bg-surface-hover transition-colors">
              <ImageIcon className="w-4 h-4" />
              <span>照片背景</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              onClick={() => handleDownload(true)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-zinc-800 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? '...' : <><Type className="w-4 h-4" /> 去背浮水印</>}
            </button>
            <button
              onClick={() => handleDownload(false)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isGenerating ? '生成中...' : <><Download className="w-4 h-4" /> 完整圖片</>}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-lg text-sm">{errorMsg}</div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Editor Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">選擇版型</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`py-2 px-4 text-sm font-bold border rounded-lg transition-colors text-left ${aspectRatio === '1:1' ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-accent)]' : 'border-border text-[var(--text-secondary)] hover:bg-surface-hover'}`}
              >
                方型排版 (1:1)
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-4 text-sm font-bold border rounded-lg transition-colors text-left ${aspectRatio === '9:16' ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-accent)]' : 'border-border text-[var(--text-secondary)] hover:bg-surface-hover'}`}
              >
                限時動態 (9:16)
              </button>
              <button
                onClick={() => setAspectRatio('sticker')}
                className={`py-2 px-4 text-sm font-bold border rounded-lg transition-colors text-left flex items-center justify-between ${aspectRatio === 'sticker' ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-accent)]' : 'border-border text-[var(--text-secondary)] hover:bg-surface-hover'}`}
              >
                <span>純軌跡貼紙</span>
              </button>
            </div>
          </div>
          <div className="p-4 bg-surface rounded-xl border border-border text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
            <p><strong>💡 匯出說明：</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
              <li><strong>去背浮水印</strong>：只匯出文字與軌跡，不含背景圖片，可當作 IG 限動的疊加貼圖 (PNG)。</li>
              <li><strong>完整圖片</strong>：包含您上傳的背景照片，一併合成匯出。</li>
            </ul>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex justify-center w-full bg-zinc-900 md:p-8 p-4 rounded-2xl border border-border/50 overflow-hidden relative">
          
          {/* Full Capture Node (Includes Background) */}
          <div
            ref={fullCaptureRef}
            className={`relative overflow-hidden mx-auto ${bgImage ? 'shadow-2xl' : 'shadow-[0_0_40px_rgba(0,0,0,0.3)]'}`}
            style={{ width, height, backgroundColor: aspectRatio === 'sticker' ? 'transparent' : '#18181b' }}
          >
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
              {bgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgImage} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-transparent border-2 border-dashed border-zinc-400/50 flex items-center justify-center text-zinc-500 text-xs">
                  (透明背景)
                </div>
              )}
            </div>

            {/* Overlay Capture Node (Only Text/SVG, Transparent Background) */}
            <div 
              ref={overlayCaptureRef} 
              className="absolute inset-0 z-10 p-6 flex flex-col justify-between overflow-hidden bg-transparent"
              style={{ width, height }}
            >
              
              {/* Layout 1: Square Post (1:1) */}
              {aspectRatio === '1:1' && (
                <>
                  <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
                     <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-tight shadow-sm drop-shadow-md">
                        <Route className="w-5 h-5" />
                        <span className="text-xl italic">PureRun</span>
                     </div>
                     <div className="text-white font-sans font-bold text-sm tracking-wide" style={textShadowStyle}>
                        {formattedDate}
                     </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-24 pb-8 z-10">
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1.5 text-white drop-shadow-md">
                        <span className="text-7xl font-mono font-extrabold leading-none tracking-tighter">{activity.distanceKm}</span>
                        <span className="text-2xl font-bold text-emerald-400">KM</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-4 border-t border-white/20 pt-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                          <Timer className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-white">{formatDuration(activity.durationMin)}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                          <Route className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Pace</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-white">{activity.avgPaceStr || '--'}/km</span>
                      </div>

                      {activity.calories && (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Kcal</span>
                          </div>
                          <span className="text-xl font-mono font-bold text-white">{activity.calories}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Layout 2: Story (9:16) */}
              {aspectRatio === '9:16' && (
                <>
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-tight shadow-sm drop-shadow-md">
                      <Route className="w-5 h-5" />
                      <span className="text-xl italic">PureRun</span>
                    </div>
                    <div className="text-white font-sans font-bold text-sm tracking-wide" style={textShadowStyle}>
                      {formattedDate}
                    </div>
                  </div>

                  <div className="mb-4 w-full px-2 pb-6">
                    <div className="mb-6">
                      <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider block mb-1" style={textShadowStyle}>Distance</span>
                      <div className="flex items-baseline gap-1 text-white">
                        <span className="text-8xl font-mono font-extrabold leading-none tracking-tighter" style={textShadowStyle}>{activity.distanceKm}</span>
                        <span className="text-2xl font-bold" style={textShadowStyle}>km</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1" style={textShadowStyle}><Timer className="w-3.5 h-3.5" /> Time</span>
                        <div className="text-3xl font-mono font-bold text-white" style={textShadowStyle}>{formatDuration(activity.durationMin)}</div>
                      </div>
                      <div>
                        <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1" style={textShadowStyle}><Route className="w-3.5 h-3.5" /> Pace</span>
                        <div className="text-3xl font-mono font-bold text-white" style={textShadowStyle}>{activity.avgPaceStr || '--'}</div>
                      </div>
                      {activity.avgHr && (
                        <div>
                          <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1" style={textShadowStyle}><Activity className="w-3.5 h-3.5" /> HR</span>
                          <div className="text-3xl font-mono font-bold text-white" style={textShadowStyle}>{activity.avgHr}</div>
                        </div>
                      )}
                      {activity.calories && (
                        <div>
                          <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1" style={textShadowStyle}><Activity className="w-3.5 h-3.5" /> Calories</span>
                          <div className="text-3xl font-mono font-bold text-white" style={textShadowStyle}>{activity.calories}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Layout 3: Pure Route Sticker */}
              {aspectRatio === 'sticker' && (
                <div className="w-full h-full flex flex-col justify-center items-center gap-8 py-8">
                  {/* Route Map */}
                  {activity.routeData ? (
                    <div className="w-48 h-48 md:w-56 md:h-56 text-emerald-400 relative">
                       <RouteSvg routeStr={activity.routeData} className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="text-white font-bold text-sm" style={textShadowStyle}>無 GPS 軌跡資料</div>
                  )}
                  
                  {/* Clean Text Stats (No Background Box) */}
                  <div className="flex items-center gap-6 text-white px-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1" style={textShadowStyle}>Dist</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-3xl font-mono font-extrabold" style={textShadowStyle}>{activity.distanceKm}</span>
                      </div>
                    </div>
                    
                    <div className="w-px h-10 bg-white/40 shadow-sm" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}></div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1" style={textShadowStyle}>Pace</span>
                      <span className="text-3xl font-mono font-extrabold" style={textShadowStyle}>{activity.avgPaceStr || '--'}</span>
                    </div>
                    
                    <div className="w-px h-10 bg-white/40 shadow-sm" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}></div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1" style={textShadowStyle}>Time</span>
                      <span className="text-3xl font-mono font-extrabold" style={textShadowStyle}>{formatDuration(activity.durationMin)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
