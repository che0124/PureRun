'use client';

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Share2,
  Route,
  Timer,
  Activity,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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

function project(lat: number, lng: number) {
  const sinY = Math.sin((lat * Math.PI) / 180);
  const clampedSinY = Math.min(Math.max(sinY, -0.9999), 0.9999);
  const x = (lng + 180) / 360;
  const y = 0.5 - Math.log((1 + clampedSinY) / (1 - clampedSinY)) / (4 * Math.PI);
  return { x, y };
}

function MapRouteView({
  routeStr,
  className,
  showMarkers = false,
  showWhiteOutline = false,
  paddingTop = 6,
  paddingBottom = 72,
  paddingX = 6,
}: {
  routeStr: string | null;
  className?: string;
  showMarkers?: boolean;
  showWhiteOutline?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 320, height: 320 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerSize({ width: clientWidth, height: clientHeight });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const mapData = useMemo(() => {
    if (!routeStr) return null;
    try {
      const rawPoints = JSON.parse(routeStr) as [number, number][];
      if (!Array.isArray(rawPoints) || rawPoints.length < 2) return null;

      const validPoints = rawPoints.filter(p => Array.isArray(p) && p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1]));
      if (validPoints.length < 2) return null;

      const normPoints = validPoints.map(([lat, lon]) => project(lat, lon));
      const minX = Math.min(...normPoints.map(p => p.x));
      const maxX = Math.max(...normPoints.map(p => p.x));
      const minY = Math.min(...normPoints.map(p => p.y));
      const maxY = Math.max(...normPoints.map(p => p.y));

      const { width, height } = containerSize;
      const availW = Math.max(width - paddingX * 2, 20);
      const availH = Math.max(height - paddingTop - paddingBottom, 20);

      const spanX = Math.max(maxX - minX, 0.000001);
      const spanY = Math.max(maxY - minY, 0.000001);

      const rawZoomX = Math.log2(availW / (spanX * 256));
      const rawZoomY = Math.log2(availH / (spanY * 256));
      const exactZoom = Math.min(rawZoomX, rawZoomY);
      const baseZoom = Math.max(1, Math.min(18, Math.floor(exactZoom)));
      const scale = 2 ** (exactZoom - baseZoom);

      const worldSize = 256 * (2 ** baseZoom) * scale;
      const centerNormX = (minX + maxX) / 2;
      const centerNormY = (minY + maxY) / 2;

      const screenCenterX = paddingX + availW / 2;
      const screenCenterY = paddingTop + availH / 2;

      const numTilesWorld = 2 ** baseZoom;
      const tileSize = 256 * scale;

      const minTileX = Math.floor(((0 - screenCenterX) / worldSize + centerNormX) * numTilesWorld);
      const maxTileX = Math.floor(((width - screenCenterX) / worldSize + centerNormX) * numTilesWorld);
      const minTileY = Math.floor(((0 - screenCenterY) / worldSize + centerNormY) * numTilesWorld);
      const maxTileY = Math.floor(((height - screenCenterY) / worldSize + centerNormY) * numTilesWorld);

      const tiles: { key: string; x: number; y: number; left: number; top: number; width: number; height: number; url: string }[] = [];

      for (let ty = minTileY; ty <= maxTileY; ty++) {
        if (ty < 0 || ty >= numTilesWorld) continue;
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const wrappedX = ((tx % numTilesWorld) + numTilesWorld) % numTilesWorld;
          const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${baseZoom}/${ty}/${wrappedX}`;
          const left = (tx / numTilesWorld - centerNormX) * worldSize + screenCenterX;
          const top = (ty / numTilesWorld - centerNormY) * worldSize + screenCenterY;
          tiles.push({
            key: `${baseZoom}-${tx}-${ty}`,
            x: tx,
            y: ty,
            left,
            top,
            width: Math.ceil(tileSize) + 1,
            height: Math.ceil(tileSize) + 1,
            url,
          });
        }
      }

      const pixelPoints = normPoints.map(p => ({
        x: (p.x - centerNormX) * worldSize + screenCenterX,
        y: (p.y - centerNormY) * worldSize + screenCenterY,
      }));

      const svgPath = pixelPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

      const startPt = pixelPoints[0];
      const endPt = pixelPoints[pixelPoints.length - 1];

      return {
        tiles,
        svgPath,
        startPt,
        endPt,
        width,
        height,
      };
    } catch {
      return null;
    }
  }, [routeStr, containerSize, paddingTop, paddingBottom, paddingX]);

  if (!routeStr || !mapData) {
    return (
      <div ref={containerRef} className={`w-full h-full min-h-[160px] bg-neutral-900/90 flex flex-col items-center justify-center gap-2 p-4 text-center ${className || ''}`}>
        <img src="/logo-shoe-emerald.png" alt="PureRun Shoe" className="w-12 h-12 object-contain opacity-50" />
        <span className="text-[11px] font-bold text-neutral-400">無 GPS 軌跡資料</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-[#f4f4f5] select-none ${className || ''}`}>
      {/* Map Tiles Layer (ArcGIS World Topo Map) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {mapData.tiles.map(tile => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="absolute max-w-none"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: `${tile.width}px`,
              height: `${tile.height}px`,
            }}
          />
        ))}
      </div>

      {/* SVG Polyline Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox={`0 0 ${mapData.width} ${mapData.height}`}
      >
        {/* Route outer shadow / subtle depth */}
        <path
          d={mapData.svgPath}
          fill="none"
          stroke="#065f46"
          strokeWidth="4"
          strokeOpacity="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Optional High contrast white outline */}
        {showWhiteOutline && (
          <path
            d={mapData.svgPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Main Emerald route line */}
        <path
          d={mapData.svgPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeOpacity="0.98"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start Marker (起) */}
        {showMarkers && mapData.startPt && (
          <g transform={`translate(${mapData.startPt.x}, ${mapData.startPt.y})`}>
            <circle r="11" fill="#3b82f6" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))" />
            <circle r="10" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              起
            </text>
          </g>
        )}

        {/* Finish Marker (終) */}
        {showMarkers && mapData.endPt && (
          <g transform={`translate(${mapData.endPt.x}, ${mapData.endPt.y})`}>
            <circle r="11" fill="#ef4444" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))" />
            <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              終
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function RouteSvg({
  routeStr,
  className,
  strokeWidth = 22,
}: {
  routeStr: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  const routeGeometry = useMemo(() => {
    if (!routeStr) return null;
    try {
      const rawPoints = (typeof routeStr === 'string' ? JSON.parse(routeStr) : routeStr) as [number, number][];
      if (!Array.isArray(rawPoints) || rawPoints.length < 2) return null;

      const validPoints = rawPoints.filter(
        p => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1])
      );
      if (validPoints.length < 2) return null;

      const lats = validPoints.map(p => p[0]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const centerLat = (minLat + maxLat) / 2;
      const cosLat = Math.cos((centerLat * Math.PI) / 180);

      const projPoints = validPoints.map(([lat, lon]) => ({
        x: lon * cosLat,
        y: -lat,
      }));

      const xs = projPoints.map(p => p.x);
      const ys = projPoints.map(p => p.y);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const rawW = maxX - minX || 0.00001;
      const rawH = maxY - minY || 0.00001;

      // Base dimension for standard SVG coordinate system (immune to mobile subpixel / vectorEffect bugs)
      const BASE_SIZE = 800;
      let drawW: number;
      let drawH: number;

      if (rawW >= rawH) {
        drawW = BASE_SIZE;
        drawH = Math.max(20, Math.round(BASE_SIZE * (rawH / rawW)));
      } else {
        drawH = BASE_SIZE;
        drawW = Math.max(20, Math.round(BASE_SIZE * (rawW / rawH)));
      }

      // Generous padding so line caps and joints never clip
      const padding = 45;
      const viewBoxW = drawW + padding * 2;
      const viewBoxH = drawH + padding * 2;

      const scaleX = drawW / rawW;
      const scaleY = drawH / rawH;

      const pixelPoints = projPoints.map(p => ({
        x: (p.x - minX) * scaleX + padding,
        y: (p.y - minY) * scaleY + padding,
      }));

      const pathData = pixelPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');

      return {
        pathData,
        viewBox: `0 0 ${viewBoxW} ${viewBoxH}`,
      };
    } catch {
      return null;
    }
  }, [routeStr]);

  if (!routeGeometry) return null;

  return (
    <svg
      viewBox={routeGeometry.viewBox}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Dark under-shadow stroke for high contrast on any background */}
      <path
        d={routeGeometry.pathData}
        fill="none"
        stroke="#000000"
        strokeWidth={strokeWidth + 8}
        strokeOpacity={0.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Foreground crisp route path */}
      <path
        d={routeGeometry.pathData}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ShareEditor({ activity }: { activity: ActivityData }) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const carouselRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);

  const cardRefs = useMemo(() => [card1Ref, card2Ref, card3Ref, card4Ref], []);

  const templates = useMemo(() => [
    { id: 'story', label: '9:16 限動' },
    { id: 'sticker', label: '軌跡貼紙' },
    { id: 'overlay', label: '疊加貼紙' },
    { id: 'classic', label: '1:1 經典' },
  ], []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const scrollToCard = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(templates.length - 1, index));
    setActiveIndex(clampedIndex);
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const targetChild = container.children[clampedIndex] as HTMLElement;
    if (targetChild) {
      const targetLeft = targetChild.offsetLeft - (container.clientWidth - targetChild.offsetWidth) / 2;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [templates.length]);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const containerCenter = scrollLeft + container.clientWidth / 2;
    const children = Array.from(container.children) as HTMLElement[];
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  // Keyboard navigation (Arrow keys) and Window resize recentering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollToCard(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        scrollToCard(activeIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleResize = () => {
      scrollToCard(activeIndex);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeIndex, scrollToCard]);

  const handleShareOrDownload = async () => {
    const targetRef = cardRefs[activeIndex];
    if (!targetRef?.current) return;

    setIsGenerating(true);
    setErrorMsg('');

    try {
      await new Promise(res => setTimeout(res, 350));

      const blob = await htmlToImage.toBlob(targetRef.current, {
        quality: 1,
        cacheBust: true,
        pixelRatio: 3,
        skipAutoScale: true,
      });

      if (!blob) throw new Error('圖片轉換失敗');

      const currentTemplateId = templates[activeIndex].id;
      const fileName = `purerun-${activity.id}-${currentTemplateId}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `PureRun - ${activity.name}`,
            text: `🏃 總距離 ${activity.distanceKm} km · 平均配速 ${activity.avgPaceStr || '--'}/km`,
          });
          showToast('🎉 分享成功！');
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
      showToast('📥 圖片已下載至裝置相簿/檔案');
    } catch (err) {
      console.error('Error generating image', err);
      setErrorMsg('圖片生成失敗，請再試一次');
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
    return h > 0
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const textShadowStyle = { textShadow: '0px 2px 8px rgba(0,0,0,0.85)' };

  // Authentic PNG checkered background pattern for transparent preview
  const checkerboardStyle: React.CSSProperties = {
    backgroundColor: '#121214',
    backgroundImage: `
      linear-gradient(45deg, #1f1f23 25%, transparent 25%),
      linear-gradient(-45deg, #1f1f23 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #1f1f23 75%),
      linear-gradient(-45deg, transparent 75%, #1f1f23 75%)
    `,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 h-[100dvh] z-[60] bg-neutral-950 text-[var(--text-primary)] font-sans flex flex-col justify-between select-none overflow-hidden">

      {/* Top Header */}
      <header className="bg-neutral-950/90 backdrop-blur-xl border-b border-border/60 shrink-0 z-50 pt-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href={`/activity/${activity.id}`}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Link>

          <div className="text-sm sm:text-base font-bold text-neutral-200">
            分享活動
          </div>

          {/* Spacer to balance the back button on the left for centering */}
          <div className="w-8 sm:w-28" />
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-[calc(4.5rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className="px-4 py-1.5 bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/40 backdrop-blur-md pointer-events-auto">
            <Check className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="fixed top-[calc(4.5rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
          <div className="p-2 bg-rose-500/90 text-white rounded-xl text-xs text-center font-bold shadow-lg pointer-events-auto">{errorMsg}</div>
        </div>
      )}

      {/* Carousel Area */}
      <main className="relative flex-1 min-h-0 flex flex-col justify-center overflow-hidden py-1 sm:py-2">
        {/* Desktop Navigation Arrows */}
        <button
          onClick={() => scrollToCard(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous template"
          className={`hidden sm:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-neutral-900/90 border border-neutral-700/80 items-center justify-center text-neutral-200 hover:bg-neutral-800 hover:text-white transition-all shadow-xl active:scale-95 ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-80 hover:opacity-100'
            }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => scrollToCard(activeIndex + 1)}
          disabled={activeIndex === templates.length - 1}
          aria-label="Next template"
          className={`hidden sm:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-neutral-900/90 border border-neutral-700/80 items-center justify-center text-neutral-200 hover:bg-neutral-800 hover:text-white transition-all shadow-xl active:scale-95 ${activeIndex === templates.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-80 hover:opacity-100'
            }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="w-full flex items-center gap-5 sm:gap-6 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar scrollbar-hide py-1 sm:py-2 px-[calc(50vw-125px)] sm:px-[calc(50vw-115px)] md:px-[calc(50vw-120px)] touch-pan-x overscroll-none"
          style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'none', touchAction: 'pan-x' }}
        >
          {/* Template 0: 9:16 限時動態 (9:16 Full-Bleed Map Story) */}
          <div
            onClick={() => scrollToCard(0)}
            className={`snap-center shrink-0 transition-opacity duration-300 flex items-center justify-center ${activeIndex === 0 ? 'opacity-100' : 'opacity-40 hover:opacity-75 cursor-pointer'
              }`}
          >
            <div className="relative shadow-2xl overflow-hidden ring-1 ring-white/10 rounded-none">
              <div
                ref={card1Ref}
                className="relative overflow-hidden rounded-none w-[250px] h-[444px] sm:w-[230px] sm:h-[408px] md:w-[240px] md:h-[426px] transition-all flex flex-col justify-between shadow-black bg-[#f4f4f5]"
              >
                {/* Full-bleed Map Layer */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <MapRouteView
                    routeStr={activity.routeData}
                    className="w-full h-full"
                    showMarkers={false}
                    showWhiteOutline={false}
                    paddingTop={36}
                    paddingBottom={105}
                    paddingX={12}
                  />
                </div>

                {/* Top Header Overlay with Dark Gradient */}
                <div className="relative z-10 w-full p-3 sm:p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-1.5 select-none">
                      <img src="/logo-shoe-emerald.png" alt="PureRun Shoe" className="h-3.5 sm:h-4 w-auto object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      <img src="/logo-text-two-tone.png" alt="PureRun" className="h-2.5 sm:h-3 w-auto object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                    </div>
                    <div className="text-white font-sans font-bold text-[8.5px] sm:text-[9.5px] tracking-wide" style={textShadowStyle}>
                      {formattedDate}
                    </div>
                  </div>
                </div>

                {/* Center / Spacer */}
                <div className="flex-1" />

                {/* Bottom Stats Overlay with Dark Gradient */}
                <div className="relative z-10 w-full p-3 sm:p-3.5 pt-7 sm:pt-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <div className="mb-1 sm:mb-1.5">
                    <span className="text-emerald-400 text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider block mb-0.5" style={textShadowStyle}>總距離</span>
                    <div className="flex items-baseline gap-1 text-white" style={textShadowStyle}>
                      <span className="text-3xl sm:text-4xl font-mono font-extrabold leading-none tracking-tight">{activity.distanceKm}</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-400">km</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                    <div>
                      <span className="text-emerald-400 text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 mb-0.5" style={textShadowStyle}>
                        <Timer className="w-2.5 h-2.5" /> 配速
                      </span>
                      <div className="text-xs sm:text-sm font-mono font-bold text-white" style={textShadowStyle}>{activity.avgPaceStr || '--'}</div>
                    </div>
                    <div>
                      <span className="text-emerald-400 text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 mb-0.5" style={textShadowStyle}>
                        <Route className="w-2.5 h-2.5" /> 時間
                      </span>
                      <div className="text-xs sm:text-sm font-mono font-bold text-white" style={textShadowStyle}>{formatDuration(activity.durationMin)}</div>
                    </div>
                    {activity.avgHr && (
                      <div>
                        <span className="text-emerald-400 text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 mb-0.5" style={textShadowStyle}>
                          <Activity className="w-2.5 h-2.5" /> 心率
                        </span>
                        <div className="text-xs sm:text-sm font-mono font-bold text-white" style={textShadowStyle}>{activity.avgHr}</div>
                      </div>
                    )}
                    {activity.calories && (
                      <div>
                        <span className="text-emerald-400 text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 mb-0.5" style={textShadowStyle}>
                          <Sparkles className="w-2.5 h-2.5" /> 熱量
                        </span>
                        <div className="text-xs sm:text-sm font-mono font-bold text-white" style={textShadowStyle}>{activity.calories}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template 1: 軌跡貼紙 (Transparent Route Sticker) */}
          <div
            onClick={() => scrollToCard(1)}
            className={`snap-center shrink-0 transition-opacity duration-300 flex items-center justify-center ${activeIndex === 1 ? 'opacity-100' : 'opacity-40 hover:opacity-75 cursor-pointer'
              }`}
          >
            <div
              className="relative shadow-2xl overflow-hidden ring-1 ring-white/10 rounded-none"
              style={checkerboardStyle}
            >
              <div
                ref={card2Ref}
                className="relative overflow-hidden rounded-none w-[250px] h-[444px] sm:w-[230px] sm:h-[408px] md:w-[240px] md:h-[426px] p-4 flex flex-col justify-center items-center gap-3.5 bg-transparent"
                style={{ backgroundColor: 'transparent' }}
              >
                {/* Center Route Trajectory / Shoe Graphic (Auto fallback to shoe if no route) */}
                <div className="w-[170px] h-[175px] sm:w-[155px] sm:h-[160px] md:w-[165px] md:h-[170px] flex items-center justify-center shrink-0">
                  {activity.routeData ? (
                    <RouteSvg routeStr={activity.routeData} className="w-full h-full text-emerald-400" />
                  ) : (
                    <div className="w-full h-full max-h-[135px] sm:max-h-[145px] flex items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-200">
                      <img
                        src="/logo-shoe-emerald.png"
                        alt="PureRun Shoe"
                        className="w-auto h-auto max-w-[130px] max-h-[130px] sm:max-w-[145px] sm:max-h-[145px] object-contain drop-shadow-[0_8px_20px_rgba(16,185,129,0.4)]"
                      />
                    </div>
                  )}
                </div>

                {/* 3 Core Stats (極簡緊湊橫排，收納在軌跡圖寬度內) */}
                <div className="w-full max-w-[170px] sm:max-w-[155px] md:max-w-[165px] flex items-center justify-between text-white px-0.5">
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5" style={textShadowStyle}>距離</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm sm:text-base font-mono font-extrabold" style={textShadowStyle}>{activity.distanceKm}</span>
                      <span className="text-[8px] sm:text-[8.5px] font-bold text-emerald-400">km</span>
                    </div>
                  </div>
                  <div className="w-px h-3.5 bg-white/20"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5" style={textShadowStyle}>配速</span>
                    <span className="text-sm sm:text-base font-mono font-extrabold" style={textShadowStyle}>{activity.avgPaceStr || '--'}</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/20"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5" style={textShadowStyle}>時間</span>
                    <span className="text-sm sm:text-base font-mono font-extrabold" style={textShadowStyle}>{formatDuration(activity.durationMin)}</span>
                  </div>
                </div>

                {/* Two-tone PureRun Logo (數據下方) */}
                <div className="flex items-center justify-center pt-0.5 select-none opacity-90">
                  <img
                    src="/logo-text-two-tone.png"
                    alt="PureRun"
                    className="h-2.5 sm:h-3 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Template 2: 疊加貼紙 (Route + Distance Overlay Sticker) */}
          <div
            onClick={() => scrollToCard(2)}
            className={`snap-center shrink-0 transition-opacity duration-300 flex items-center justify-center ${activeIndex === 2 ? 'opacity-100' : 'opacity-40 hover:opacity-75 cursor-pointer'
              }`}
          >
            <div
              className="relative shadow-2xl overflow-hidden ring-1 ring-white/10 rounded-none"
              style={checkerboardStyle}
            >
              <div
                ref={card3Ref}
                className="relative overflow-hidden rounded-none w-[250px] h-[444px] sm:w-[230px] sm:h-[408px] md:w-[240px] md:h-[426px] p-4 flex flex-col justify-center items-center gap-3.5 bg-transparent select-none"
                style={{ backgroundColor: 'transparent' }}
              >
                {/* Route Graphic with Overlaid Left-Aligned Distance Block (Auto fallback to shoe if no route) */}
                <div className="relative w-[170px] h-[175px] sm:w-[155px] sm:h-[160px] md:w-[165px] md:h-[170px] flex items-center justify-center shrink-0">
                  {/* Subtle Gray Route SVG Layer */}
                  {activity.routeData ? (
                    <RouteSvg routeStr={activity.routeData} className="w-full h-full text-zinc-400/80" />
                  ) : (
                    <div className="w-full h-full max-h-[135px] sm:max-h-[145px] flex items-center justify-center p-2">
                      <img
                        src="/logo-shoe-emerald.png"
                        alt="PureRun Shoe"
                        className="w-auto h-auto max-w-[130px] max-h-[130px] sm:max-w-[145px] sm:max-h-[145px] object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] opacity-40 grayscale"
                      />
                    </div>
                  )}

                  {/* Overlaid Large Distance + DISTANCE label aligned to the LEFT */}
                  <div className="absolute inset-0 flex flex-col items-start justify-center pl-1 pointer-events-none">
                    <span
                      className="text-[8.5px] sm:text-[9.5px] font-mono font-black text-emerald-400 uppercase tracking-widest mb-0.5"
                      style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.95)' }}
                    >
                      DISTANCE
                    </span>
                    <div
                      className="flex items-baseline gap-1"
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.95)' }}
                    >
                      <span className="text-3xl sm:text-4xl font-mono font-black text-white leading-none tracking-tight">
                        {activity.distanceKm}
                      </span>
                      <span className="text-xs sm:text-xs font-black text-emerald-400 font-mono uppercase">
                        km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Two-tone PureRun Logo (數據下方) */}
                <div className="flex items-center justify-center pt-0.5 select-none opacity-90">
                  <img
                    src="/logo-text-two-tone.png"
                    alt="PureRun"
                    className="h-2.5 sm:h-3 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Template 3: 1:1 經典數據 (Classic Strava Hero) */}
          <div
            onClick={() => scrollToCard(3)}
            className={`snap-center shrink-0 transition-opacity duration-300 flex items-center justify-center ${activeIndex === 3 ? 'opacity-100' : 'opacity-40 hover:opacity-75 cursor-pointer'
              }`}
          >
            <div className="relative shadow-2xl overflow-hidden ring-1 ring-white/10 rounded-none">
              <div
                ref={card4Ref}
                className="relative overflow-hidden rounded-none w-[250px] h-[250px] sm:w-[230px] sm:h-[230px] md:w-[240px] md:h-[240px] transition-all flex flex-col justify-between p-3.5 shadow-black bg-gradient-to-b from-neutral-900 via-neutral-950 to-black"
              >
                {/* Background Layer: Ambient Gray Route or Shoe */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  {activity.routeData ? (
                    <div className="w-full h-full flex items-center justify-center p-5 sm:p-6 opacity-45">
                      <RouteSvg routeStr={activity.routeData} className="w-full h-full text-zinc-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-5 sm:p-6 opacity-20 grayscale">
                      <img src="/logo-shoe-emerald.png" alt="PureRun Shoe" className="w-14 h-14 object-contain" />
                    </div>
                  )}
                </div>

                {/* Top Header */}
                <div className="absolute top-0 inset-x-0 p-3 sm:p-3.5 flex justify-between items-start z-20">
                  <div className="flex items-center gap-1.5 select-none">
                    <img src="/logo-shoe-emerald.png" alt="PureRun Shoe" className="h-3.5 sm:h-4 w-auto object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
                    <img src="/logo-text-two-tone.png" alt="PureRun" className="h-2.5 sm:h-3 w-auto object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
                  </div>
                  <div className="text-white font-sans font-bold text-[8.5px] sm:text-[9.5px] tracking-wide" style={textShadowStyle}>
                    {formattedDate}
                  </div>
                </div>

                {/* Bottom Stats Overlay with Gradient */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 pt-7 sm:pt-8 pb-3 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="mb-0.5">
                    <div className="flex items-baseline gap-1 text-white" style={textShadowStyle}>
                      <span className="text-3xl sm:text-3xl font-mono font-extrabold leading-none tracking-tight">{activity.distanceKm}</span>
                      <span className="text-xs sm:text-xs font-bold text-emerald-400">km</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 mt-1 pt-1 border-t border-white/15">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                        <Timer className="w-2.5 h-2.5" />
                        <span className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider">配速</span>
                      </div>
                      <span className="text-xs sm:text-xs font-mono font-bold text-white" style={textShadowStyle}>{activity.avgPaceStr || '--'}</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                        <Route className="w-2.5 h-2.5" />
                        <span className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider">時間</span>
                      </div>
                      <span className="text-xs sm:text-xs font-mono font-bold text-white" style={textShadowStyle}>{formatDuration(activity.durationMin)}</span>
                    </div>
                    {activity.avgHr && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                          <Activity className="w-2.5 h-2.5" />
                          <span className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider">心率</span>
                        </div>
                        <span className="text-xs sm:text-xs font-mono font-bold text-white" style={textShadowStyle}>{activity.avgHr}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Indicator: Circular Pagination Dots Navigation (With breathing room) */}
        <div className="flex items-center justify-center gap-2 pt-2 pb-2 sm:pt-2.5 sm:pb-2.5 shrink-0">
          {templates.map((tpl, i) => (
            <button
              key={tpl.id}
              onClick={() => scrollToCard(i)}
              aria-label={tpl.label}
              className={`transition-all duration-300 rounded-full ${activeIndex === i
                  ? 'w-5 h-1.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
              title={tpl.label}
            />
          ))}
        </div>

        {/* Action & Function Control Area Under The Cards */}
        <div className="w-full max-w-xs sm:max-w-sm mx-auto px-4 pb-3 sm:pb-5 shrink-0 space-y-2 touch-auto">
          {/* Primary Action Button: Share / Download */}
          <button
            onClick={handleShareOrDownload}
            disabled={isGenerating}
            className="w-full h-10 sm:h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>生成卡片中...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>分享 / 下載圖片</span>
              </>
            )}
          </button>
        </div>
      </main>

    </div>
  );
}
