import React from 'react';
import { HeatmapCell } from '../../types/admin.types';

interface HeatmapGridProps {
  data: HeatmapCell[];
  loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }).map((_, i) => i);

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80 flex flex-col justify-between animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-rows-7 gap-1 flex-1 mt-4">
          {Array.from({ length: 7 }).map((_, r) => (
            <div key={r} className="grid grid-cols-24 gap-1">
              {Array.from({ length: 24 }).map((_, c) => (
                <div key={c} className="bg-gray-100 rounded-sm h-full w-full"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Build a lookup map: day_hour -> count
  // Map dayOfWeek safely (supporting 1-7 or 0-6).
  const lookupMap: Record<string, number> = {};
  let maxCount = 1;

  data.forEach((cell) => {
    // Normalize dayOfWeek to 0-6. Sunday is typically 1 (Java Calendar) or 0 (JS Date)
    // Let's check: if database returns 1-7 (where 1 = Sunday or 1 = Monday). Let's make it 0-based.
    // If we do (cell.dayOfWeek % 7), it works for both 0-6 and 7-indexed values.
    const day = cell.dayOfWeek === 7 ? 0 : cell.dayOfWeek % 7;
    const key = `${day}_${cell.hour}`;
    lookupMap[key] = cell.orderCount;
    if (cell.orderCount > maxCount) {
      maxCount = cell.orderCount;
    }
  });

  // Helper to determine tailwind background color based on intensity
  const getCellColorClass = (val: number) => {
    if (!val || val === 0) return 'bg-slate-50 border border-slate-100';
    const intensity = val / maxCount;
    if (intensity < 0.15) return 'bg-teal-50 hover:ring-2 hover:ring-teal-300';
    if (intensity < 0.35) return 'bg-teal-100 hover:ring-2 hover:ring-teal-300';
    if (intensity < 0.55) return 'bg-teal-300 hover:ring-2 hover:ring-teal-400';
    if (intensity < 0.75) return 'bg-teal-500 hover:ring-2 hover:ring-teal-500';
    return 'bg-teal-700 hover:ring-2 hover:ring-teal-700';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">Order Density Heatmap</h3>
        <p className="text-xs text-gray-500 font-medium">Busiest hours vs days of the week</p>
      </div>

      <div className="overflow-x-auto select-none mt-2">
        <div className="min-w-[700px] flex flex-col gap-1.5 p-1">
          {/* Header Row: Hours */}
          <div className="flex items-center gap-1.5">
            <div className="w-10 shrink-0"></div>
            <div className="flex-1 grid grid-cols-24 gap-1.5 text-center text-[10px] font-semibold text-gray-400">
              {HOURS.map((h) => (
                <div key={h} className="truncate">
                  {h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows: Days */}
          {DAYS.map((dayLabel, dayIndex) => (
            <div key={dayLabel} className="flex items-center gap-1.5">
              {/* Day label */}
              <div className="w-10 shrink-0 text-xs font-bold text-gray-500 text-left">
                {dayLabel}
              </div>

              {/* 24 Cells */}
              <div className="flex-1 grid grid-cols-24 gap-1.5">
                {HOURS.map((hour) => {
                  const val = lookupMap[`${dayIndex}_hour`] || 0;
                  // Actually the key lookup uses lookupMap[`${dayIndex}_${hour}`] which was right, let's keep that!
                  const original_val = lookupMap[`${dayIndex}_${hour}`] || 0;
                  return (
                    <div
                      key={hour}
                      className={`h-7 rounded-md transition-all cursor-pointer relative group ${getCellColorClass(original_val)}`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 bg-slate-900 text-white text-[10px] font-medium py-1 px-2 rounded shadow-md whitespace-nowrap">
                        {dayLabel} {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}: <span className="font-bold">{original_val} orders</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs font-semibold text-gray-400">
        <span>Less</span>
        <div className="h-3.5 w-3.5 bg-slate-50 border border-slate-100 rounded-sm"></div>
        <div className="h-3.5 w-3.5 bg-teal-50 rounded-sm"></div>
        <div className="h-3.5 w-3.5 bg-teal-100 rounded-sm"></div>
        <div className="h-3.5 w-3.5 bg-teal-300 rounded-sm"></div>
        <div className="h-3.5 w-3.5 bg-teal-500 rounded-sm"></div>
        <div className="h-3.5 w-3.5 bg-teal-700 rounded-sm"></div>
        <span>More</span>
      </div>
    </div>
  );
};
