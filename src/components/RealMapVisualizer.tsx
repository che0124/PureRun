'use client';

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple } from 'leaflet';
import { AlertCircle } from 'lucide-react';

export type TileLayerType = 'topo' | 'satellite' | 'dark' | 'street';

export interface RealMapProps {
  routeData?: string | null;
  interactive?: boolean;
  className?: string;
  tileLayerType?: TileLayerType;
  showZoomControl?: boolean;
  onMapInstance?: (map: L.Map) => void;
  resetTrigger?: number;
}

const TILE_URLS: Record<TileLayerType, { url: string; maxZoom: number }> = {
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19
  }
};

const createMarkerIcon = (type: 'start' | 'finish') => {
  const isStart = type === 'start';
  const bg = isStart ? '#3b82f6' : '#ef4444';
  const label = isStart ? '起' : '終';
  return L.divIcon({
    className: 'bg-transparent',
    html: `<div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${bg}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 14px ${bg}, 0 2px 8px rgba(0,0,0,0.8); color: #ffffff; font-size: 12px; font-weight: 900; line-height: 1;">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -15]
  });
};

function MapController({
  bounds,
  resetTrigger,
  onMapInstance
}: {
  bounds?: L.LatLngBounds;
  resetTrigger?: number;
  onMapInstance?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (onMapInstance) {
      onMapInstance(map);
    }
  }, [map, onMapInstance]);

  useEffect(() => {
    if (!map) return;

    const fit = () => {
      map.invalidateSize();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, {
          paddingTopLeft: [28, 20],
          paddingBottomRight: [20, 20],
          maxZoom: 16
        });
      }
    };

    fit();
    const t1 = setTimeout(fit, 80);
    const t2 = setTimeout(fit, 250);
    const t3 = setTimeout(fit, 600);

    const handleResize = () => {
      fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, bounds, resetTrigger]);

  return null;
}

export default function RealMapVisualizer({
  routeData,
  interactive = true,
  className = '',
  tileLayerType = 'topo',
  showZoomControl = false,
  onMapInstance,
  resetTrigger
}: RealMapProps) {
  const points = useMemo<LatLngTuple[] | null>(() => {
    if (routeData) {
      try {
        const parsed = JSON.parse(routeData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        console.error('Failed to parse routeData');
      }
    }
    return null;
  }, [routeData]);

  if (!points || points.length === 0) {
    return (
      <div className={`w-full h-full bg-surface/40 border border-border flex items-center justify-center relative overflow-hidden group ${className}`}>
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.1
          }}
        />
        <div className="flex flex-col items-center gap-4 relative z-10 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center border border-border text-[var(--text-muted)]">
            <AlertCircle className="w-8 h-8 opacity-50" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">
              無法載入真實 GPS 資料
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-sans max-w-xs leading-relaxed mb-4">
              此紀錄目前不包含 GPS 軌跡資料，或是資料尚未同步。請確保此為戶外活動紀錄，並至首頁重新點擊「同步 Garmin 數據」。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bounds = useMemo(() => {
    if (!points || points.length === 0) return undefined;
    return L.latLngBounds(points);
  }, [points]);

  const tileConfig = TILE_URLS[tileLayerType] || TILE_URLS.topo;

  return (
    <div
      className={`relative w-full h-full overflow-hidden isolate z-0 ${
        interactive ? '' : 'pointer-events-none select-none'
      } ${className}`}
    >
      <MapContainer
        bounds={bounds}
        boundsOptions={{
          paddingTopLeft: [28, 20],
          paddingBottomRight: [20, 20]
        }}
        zoomSnap={0.1}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        zoomControl={interactive && showZoomControl}
        attributionControl={false}
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
      >
        <MapController
          bounds={bounds}
          resetTrigger={resetTrigger}
          onMapInstance={onMapInstance}
        />
        <TileLayer
          key={tileLayerType}
          url={tileConfig.url}
          maxZoom={tileConfig.maxZoom}
        />

        {/* Main Route Line */}
        <Polyline
          positions={points}
          pathOptions={{
            color: '#10b981',
            weight: 5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />

        <Marker position={points[0]} icon={createMarkerIcon('start')}>
          <Popup className="font-sans text-xs font-bold">起點 (Start)</Popup>
        </Marker>

        {points.length > 1 && (
          <Marker position={points[points.length - 1]} icon={createMarkerIcon('finish')}>
            <Popup className="font-sans text-xs font-bold">終點 (Finish)</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
