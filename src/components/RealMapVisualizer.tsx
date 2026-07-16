'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple } from 'leaflet';
import { AlertCircle } from 'lucide-react';

const createDotIcon = (color: string) => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #020617; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
  });
};

export default function RealMapVisualizer({ routeData }: { routeData?: string }) {
  const [points, setPoints] = useState<LatLngTuple[] | null>(null);

  useEffect(() => {
    if (routeData) {
      try {
        const parsed = JSON.parse(routeData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPoints(parsed);
        }
      } catch (e) {
        console.error("Failed to parse routeData", e);
      }
    }
  }, [routeData]);

  if (!points || points.length === 0) {
    return (
      <div className="w-full h-[300px] md:h-[400px] rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.1 }}></div>
        <div className="flex flex-col items-center gap-4 relative z-10 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-950/50 flex items-center justify-center border border-slate-800 text-slate-500">
             <AlertCircle className="w-8 h-8 opacity-50" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">無法載入真實 GPS 資料</h3>
            <p className="text-[11px] text-slate-500 font-sans max-w-xs leading-relaxed mb-4">
              此紀錄目前不包含 GPS 軌跡資料，或是資料尚未同步。請確保此為戶外活動紀錄，並至首頁重新點擊「同步 Garmin 數據」。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const center = points[0];

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl z-0 group">
      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <Polyline 
          positions={points} 
          pathOptions={{ color: '#10b981', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} 
        />
        
        <Marker position={points[0]} icon={createDotIcon('#10b981')}>
          <Popup className="font-mono text-xs">Start</Popup>
        </Marker>
        
        {points.length > 1 && (
          <Marker position={points[points.length - 1]} icon={createDotIcon('#f43f5e')}>
            <Popup className="font-mono text-xs">Finish</Popup>
          </Marker>
        )}
      </MapContainer>
      
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-400 font-sans tracking-widest uppercase flex flex-col gap-1 shadow-xl z-[400] pointer-events-none">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> 啟程</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div> 終點</div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2 shadow-xl z-[400] pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        LIVE Garmin GPS 軌跡
      </div>
    </div>
  );
}
