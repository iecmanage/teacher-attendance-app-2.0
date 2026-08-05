import React from 'react';
import { Teacher, AttendanceRecord, AdminSettings } from '../types';
import { formatTime12Hour, getStatusBadgeInfo } from '../utils/timeUtils';
import { formatDistance } from '../utils/geofence';
import { Printer, X, ShieldCheck } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  monthName: string;
  year: number;
  records: AttendanceRecord[];
  monthDays: string[];
  settings: AdminSettings;
  hideGeofenceColumn?: boolean;
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
  hideGeofenceColumn = false,
}) => {
  if (!isOpen || !teacher) return null;

  const handlePrint = () => {
    window.print();
  };

  // Map teacher attendance records
  const teacherRecordsMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    if (r.teacherId === teacher.id) {
      teacherRecordsMap.set(r.date, r);
    }
  });

  // Calculate stats for full month without omitting off days
  let totalCalendarDays = monthDays.length;
  let presentDays = 0;
  let onTimeDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let offOrLeaveDays = 0;
  let distances: number[] = [];

  monthDays.forEach((dateStr) => {
    const rec = teacherRecordsMap.get(dateStr);
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const defaultStatus = dayOfWeek === 0 ? 'OFF_DAY' : 'ABSENT';
    const status = rec?.status || defaultStatus;

    if (status === 'ON_TIME') {
      presentDays++;
      onTimeDays++;
      if (rec?.checkInDistanceMeters !== undefined) distances.push(rec.checkInDistanceMeters);
    } else if (status === 'LATE') {
      presentDays++;
      lateDays++;
      if (rec?.checkInDistanceMeters !== undefined) distances.push(rec.checkInDistanceMeters);
    } else if (status === 'HALF_DAY') {
      presentDays++;
      if (rec?.checkInDistanceMeters !== undefined) distances.push(rec.checkInDistanceMeters);
    } else if (status === 'EXCUSED_LEAVE' || status === 'OFF_DAY') {
      offOrLeaveDays++;
    } else if (status === 'ABSENT') {
      absentDays++;
    }
  });

  const avgDistance =
    distances.length > 0
      ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Print CSS Styles for Perfect A4 Page Sizing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 8mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, #header, #footer, nav {
            display: none !important;
          }
          .printable-report-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: white !important;
          }
          .printable-document {
            font-size: 10px !important;
          }
          .printable-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-size: 9px !important;
            padding: 4px 6px !important;
            border-bottom: 1.5px solid #cbd5e1 !important;
          }
          .printable-table td {
            font-size: 9px !important;
            padding: 3.5px 6px !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-200 printable-report-container">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Monthly Attendance Report — {monthName} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Full monthly ledger formatted for A4 page printing & PDF export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-report-action-btn"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (A4)</span>
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

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="printable-document space-y-5">
          {/* Header with Logo */}
          <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-950 p-1 flex items-center justify-center border border-amber-500 shrink-0 shadow-sm">
                {settings.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt="Institute Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold font-serif text-emerald-950 uppercase tracking-tight">
                  {settings.instituteName}
                </h1>
                <p className="text-[11px] font-semibold text-amber-700 tracking-wide uppercase">
                  Islamic Education Center — Online Academy Faculty Portal
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {settings.geofence.instituteAddress}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-emerald-950 text-amber-300 font-bold px-3 py-1 rounded-md text-[11px] uppercase tracking-wider">
                Monthly Report
              </span>
              <p className="text-sm font-extrabold text-slate-800 font-serif mt-1">
                {monthName} {year}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Printed: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Teacher Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
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
                Department / Designation
              </span>
              <span className="font-medium text-slate-800">{teacher.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                Target Arrival Time
              </span>
              <span className="font-bold text-emerald-800 font-mono">
                {formatTime12Hour(teacher.targetArrivalTime || settings.defaultTargetArrivalTime)}
              </span>
            </div>
          </div>

          {/* Month Summary Counters */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block font-semibold">Total Month Days</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono">
                {totalCalendarDays} Days
              </span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
              <span className="text-emerald-700 text-[10px] block font-semibold">On Time</span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono">
                {onTimeDays}
              </span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
              <span className="text-amber-700 text-[10px] block font-semibold">Late Arrivals</span>
              <span className="text-sm font-extrabold text-amber-700 font-mono">
                {lateDays}
              </span>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-rose-900">
              <span className="text-rose-700 text-[10px] block font-semibold">Absents</span>
              <span className="text-sm font-extrabold text-rose-700 font-mono">
                {absentDays}
              </span>
            </div>

            {!hideGeofenceColumn ? (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                <span className="text-blue-700 text-[10px] block font-semibold">Avg GPS Dist</span>
                <span className="text-sm font-extrabold text-blue-700 font-mono">
                  {formatDistance(avgDistance)}
                </span>
              </div>
            ) : (
              <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200 text-indigo-900">
                <span className="text-indigo-700 text-[10px] block font-semibold">Off Days / Leaves</span>
                <span className="text-sm font-extrabold text-indigo-700 font-mono">
                  {offOrLeaveDays}
                </span>
              </div>
            )}
          </div>

          {/* Entire Month Day-by-Day Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs printable-table">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3">Date</th>
                  <th className="py-1.5 px-3">Day</th>
                  <th className="py-1.5 px-3">Target</th>
                  <th className="py-1.5 px-3">Check In</th>
                  <th className="py-1.5 px-3">Check Out</th>
                  <th className="py-1.5 px-3">Status</th>
                  {!hideGeofenceColumn && <th className="py-1.5 px-3">Distance</th>}
                  <th className="py-1.5 px-3">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthDays.map((dateStr) => {
                  const rec = teacherRecordsMap.get(dateStr);
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const isSunday = dateObj.getDay() === 0;

                  const status = rec?.status || (isSunday ? 'OFF_DAY' : 'ABSENT');
                  const badge = getStatusBadgeInfo(status);

                  return (
                    <tr
                      key={dateStr}
                      className={`hover:bg-slate-50 ${isSunday ? 'bg-slate-50/60' : ''}`}
                    >
                      <td className="py-1 px-3 font-mono font-medium">{dateStr}</td>
                      <td className="py-1 px-3 font-semibold text-slate-600">{dayName}</td>
                      <td className="py-1 px-3 font-mono text-slate-500">
                        {formatTime12Hour(
                          rec?.targetArrivalTime || teacher.targetArrivalTime || settings.defaultTargetArrivalTime
                        )}
                      </td>
                      <td className="py-1 px-3 font-mono">
                        {rec?.checkInTime
                          ? formatTime12Hour(rec.checkInTime)
                          : status === 'OFF_DAY'
                          ? 'Off Day'
                          : status === 'EXCUSED_LEAVE'
                          ? 'On Leave'
                          : '--:--'}
                      </td>
                      <td className="py-1 px-3 font-mono">
                        {rec?.checkOutTime ? formatTime12Hour(rec.checkOutTime) : '--:--'}
                      </td>
                      <td className="py-1 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'ON_TIME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : status === 'EXCUSED_LEAVE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {status === 'OFF_DAY' ? 'Off Day' : badge.label}
                        </span>
                      </td>

                      {!hideGeofenceColumn && (
                        <td className="py-1 px-3 font-mono text-slate-600">
                          {rec?.checkInDistanceMeters !== undefined
                            ? `${rec.checkInDistanceMeters}m`
                            : '-'}
                        </td>
                      )}

                      <td className="py-1 px-3 text-slate-500 truncate max-w-[150px]">
                        {rec?.notes || (isSunday ? 'Weekly Off' : '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Printable Official Signature Block */}
          <div className="pt-6 grid grid-cols-2 gap-12 text-center text-xs text-slate-600 page-break-avoid">
            <div>
              <div className="border-t-2 border-slate-300 pt-2 font-bold font-serif text-slate-900">
                Teacher Signature
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{teacher.name}</p>
            </div>
            <div>
              <div className="border-t-2 border-slate-300 pt-2 font-bold font-serif text-slate-900">
                Principal / Admin Verification Signature
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
