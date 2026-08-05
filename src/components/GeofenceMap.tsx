import React from 'react';
import { GeofenceConfig, AttendanceRecord, Teacher } from '../types';
import { formatDistance } from '../utils/geofence';
import { MapPin, Navigation, ShieldCheck, Compass, Radio } from 'lucide-react';

interface GeofenceMapProps {
  config: GeofenceConfig;
  todayRecords: AttendanceRecord[];
  teachers: Teacher[];
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  config,
  todayRecords,
  teachers,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>Campus Geofence Radar Simulator</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time GPS proximity monitoring centered at Islamic Education Center campus.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-950 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-800/80 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Radius: {config.radiusMeters}m Enforced</span>
        </div>
      </div>

      {/* Visual Radar Container */}
      <div className="relative w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
        {/* Radar concentric circles */}
        <div className="absolute w-[280px] h-[280px] rounded-full border border-emerald-500/20 animate-ping opacity-25 pointer-events-none" />
        <div className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-emerald-500/40 bg-emerald-950/20" />
        <div className="absolute w-[160px] h-[160px] rounded-full border border-emerald-500/30" />
        <div className="absolute w-[80px] h-[80px] rounded-full border border-emerald-500/40" />

        {/* Crosshair axes */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-emerald-500/20" />
          <div className="h-full w-[1px] bg-emerald-500/20 absolute" />
        </div>

        {/* Center Campus Marker */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold font-serif text-amber-300 bg-slate-900/90 px-2 py-0.5 rounded-md border border-amber-500/40 mt-1">
            IEC Campus Center
          </span>
        </div>

        {/* Teacher Check-in Pins scattered around center */}
        {todayRecords.map((rec, idx) => {
          if (rec.checkInDistanceMeters === undefined) return null;
          const teacher = teachers.find((t) => t.id === rec.teacherId);
          if (!teacher) return null;

          // Scale distance to pixels (e.g. 100m = 60px)
          const scale = 120 / (config.radiusMeters || 200);
          const pxDist = Math.min(rec.checkInDistanceMeters * scale, 130);

          // Angle based on index
          const angle = ((idx * 73 + 45) % 360) * (Math.PI / 180);
          const x = Math.cos(angle) * pxDist;
          const y = Math.sin(angle) * pxDist;

          const isInside = rec.checkInDistanceMeters <= config.radiusMeters;

          return (
            <div
              key={rec.id}
              className="absolute z-20 transition-all duration-500 group"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md cursor-pointer ${
                  isInside ? 'bg-emerald-500 border border-white' : 'bg-amber-500 border border-white'
                }`}
              >
                {teacher.name.charAt(0)}
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap z-30">
                <span className="font-bold block">{teacher.name}</span>
                <span className="text-slate-300 block">
                  Distance: {formatDistance(rec.checkInDistanceMeters)}
                </span>
                <span className="text-emerald-400 block font-mono">
                  Checked in: {rec.checkInTime}
                </span>
              </div>
            </div>
          );
        })}

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Checked-In Inside Boundary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Checked-In Outside Radius</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
          Center GPS: {config.latitude.toFixed(4)}, {config.longitude.toFixed(4)}
        </div>
      </div>
    </div>
  );
};
