import React from 'react';
import { Teacher, AttendanceRecord, AdminSettings } from '../types';
import { formatTime12Hour, getStatusBadgeInfo } from '../utils/timeUtils';
import { formatDistance } from '../utils/geofence';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  monthName: string;
  year: number;
  records: AttendanceRecord[];
  monthDays: string[];
  settings: AdminSettings;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  teacher,
  monthName,
  year,
  records,
  monthDays,
  settings,
}) => {
  if (!isOpen || !teacher) return null;

  const handlePrint = () => {
    window.print();
  };

  // Compute metrics for this teacher in this month
  const teacherRecordsMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    if (r.teacherId === teacher.id) {
      teacherRecordsMap.set(r.date, r);
    }
  });

  let totalDays = 0;
  let presentDays = 0;
  let onTimeDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let distances: number[] = [];

  monthDays.forEach((dateStr) => {
    const rec = teacherRecordsMap.get(dateStr);
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();

    if (dayOfWeek === 0) return; // Skip Sunday for total working days count if off

    totalDays++;
    if (!rec || rec.status === 'ABSENT') {
      absentDays++;
    } else if (rec.status === 'ON_TIME') {
      presentDays++;
      onTimeDays++;
      if (rec.checkInDistanceMeters !== undefined) distances.push(rec.checkInDistanceMeters);
    } else if (rec.status === 'LATE') {
      presentDays++;
      lateDays++;
      if (rec.checkInDistanceMeters !== undefined) distances.push(rec.checkInDistanceMeters);
    } else if (rec.status === 'HALF_DAY' || rec.status === 'EXCUSED_LEAVE') {
      presentDays++;
      if (rec.checkInDistanceMeters !== undefined) distances.push(rec.checkInDistanceMeters);
    }
  });

  const avgDistance =
    distances.length > 0
      ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-200 printable-report-container">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Printable Teacher Attendance Report
            </h3>
            <p className="text-xs text-slate-500">
              Official monthly log formatted with Islamic Education Center branding and logo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-report-action-btn"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              id="print-report-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTENT AREA */}
        <div className="printable-document space-y-6">
          {/* Header with Custom Logo */}
          <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-emerald-900 p-1 flex items-center justify-center border border-amber-500 shrink-0 shadow-sm">
                {settings.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt="Institute Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-amber-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-emerald-950 uppercase tracking-tight">
                  {settings.instituteName}
                </h1>
                <p className="text-xs font-semibold text-amber-700 tracking-wide uppercase">
                  {settings.instituteTagline || 'Faculty Geofenced Attendance System'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {settings.geofence.instituteAddress}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-emerald-900 text-amber-300 font-bold px-3 py-1 rounded-md text-xs uppercase tracking-wider">
                Monthly Report
              </span>
              <p className="text-sm font-extrabold text-slate-800 font-serif mt-1">
                {monthName} {year}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Teacher Profile Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                Teacher Name
              </span>
              <span className="font-bold text-slate-900 font-serif text-sm">
                {teacher.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                Employee ID
              </span>
              <span className="font-bold text-slate-900 font-mono">{teacher.employeeId}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                Designation
              </span>
              <span className="font-medium text-slate-800">{teacher.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                Target Arrival
              </span>
              <span className="font-bold text-emerald-800 font-mono">
                {formatTime12Hour(teacher.targetArrivalTime || settings.defaultTargetArrivalTime)}
              </span>
            </div>
          </div>

          {/* Metric Summary Stat Pills */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Working Days</span>
              <span className="text-base font-extrabold text-slate-800 font-mono">
                {totalDays}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
              <span className="text-emerald-700 text-[10px] block">On Time</span>
              <span className="text-base font-extrabold text-emerald-700 font-mono">
                {onTimeDays}
              </span>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
              <span className="text-amber-700 text-[10px] block">Late Arrivals</span>
              <span className="text-base font-extrabold text-amber-700 font-mono">
                {lateDays}
              </span>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-900">
              <span className="text-rose-700 text-[10px] block">Absents</span>
              <span className="text-base font-extrabold text-rose-700 font-mono">
                {absentDays}
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
              <span className="text-blue-700 text-[10px] block">Avg Geofence Dist</span>
              <span className="text-base font-extrabold text-blue-700 font-mono">
                {formatDistance(avgDistance)}
              </span>
            </div>
          </div>

          {/* Daily Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 px-3">Check In</th>
                  <th className="py-2 px-3">Check Out</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Distance (Meters)</th>
                  <th className="py-2 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthDays.map((dateStr) => {
                  const rec = teacherRecordsMap.get(dateStr);
                  const status = rec?.status || 'ABSENT';
                  const badge = getStatusBadgeInfo(status);

                  return (
                    <tr key={dateStr} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-mono font-medium">{dateStr}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {formatTime12Hour(
                          rec?.targetArrivalTime || teacher.targetArrivalTime || settings.defaultTargetArrivalTime
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {rec?.checkInTime ? formatTime12Hour(rec.checkInTime) : '--:--'}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {rec?.checkOutTime ? formatTime12Hour(rec.checkOutTime) : '--:--'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'ON_TIME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {rec?.checkInDistanceMeters !== undefined
                          ? `${rec.checkInDistanceMeters}m`
                          : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">
                        {rec?.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Official Signatures Footer */}
          <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs text-slate-600 mt-8">
            <div>
              <div className="border-t-2 border-slate-300 pt-2 font-bold font-serif text-slate-900">
                Teacher Signature
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{teacher.name}</p>
            </div>
            <div>
              <div className="border-t-2 border-slate-300 pt-2 font-bold font-serif text-slate-900">
                Principal / Admin Verification
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {settings.instituteName} Administration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
