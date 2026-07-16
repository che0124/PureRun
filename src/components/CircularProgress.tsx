import React from 'react';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string; // e.g. "text-emerald-400"
  trackColor?: string; // e.g. "text-slate-800"
}

export default function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = "text-emerald-400",
  trackColor = "text-slate-800"
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center group" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90 transition-all duration-700 ease-out overflow-visible"
        width={size}
        height={size}
      >
        {/* Track */}
        <circle
          className={trackColor}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          className={`${color} drop-shadow-[0_0_8px_currentColor]`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-extrabold font-mono text-slate-50 tracking-tighter">
          {Math.round(percentage)}%
        </span>
        {label && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>}
        {sublabel && <span className="text-[8px] text-slate-500 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}
