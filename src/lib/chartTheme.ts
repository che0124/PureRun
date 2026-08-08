/**
 * ECharts theme utility — provides consistent chart styling
 * that automatically adapts to the system's light/dark theme.
 *
 * Usage: import { getChartTheme } from '@/lib/chartTheme'
 *        const theme = getChartTheme()
 */

export function getChartTheme() {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return {
    textColor: isDark ? '#f1f5f9' : '#334155',
    subtextColor: isDark ? '#94a3b8' : '#64748b',
    gridLineColor: isDark ? '#1e293b' : '#e2e8f0',
    tooltipBg: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)',
    tooltipText: isDark ? '#f1f5f9' : '#0f172a',
    tooltipBorder: isDark ? '#334155' : '#e2e8f0',
    axisLineColor: isDark ? '#334155' : '#cbd5e1',
    backgroundColor: 'transparent',
    isDark,
  };
}
