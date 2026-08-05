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
    const status = rec?.status || 'ABSENT';

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
    <div
      id="printable-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:block"
    >
      {/* Print CSS Styles for Perfect Single-Page A4 Sizing and Complete UI Isolation */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 3mm 3mm 3mm 3mm;
          }

          /* Ensure html, body, and app root containers are pure white with zero margins */
          html, body, #root, main {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all default UI elements marked with print:hidden */
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
          }

          /* Position printable modal container statically with white background */
          #printable-modal-overlay {
            position: static !important;
            inset: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            display: block !important;
            width: 100% !important;
            backdrop-filter: none !important;
          }

          .printable-report-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border-radius: 0 !important;
          }

          .printable-document {
            font-size: 7.5pt !important;
            line-height: 1.1 !important;
            color: #0f172a !important;
          }

          .printable-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 7pt !important;
          }

          .printable-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-size: 6.5pt !important;
            padding: 1.5px 3px !important;
            border: 1px solid #94a3b8 !important;
            text-transform: uppercase !important;
            line-height: 1 !important;
          }

          .printable-table td {
            font-size: 7pt !important;
            padding: 1px 2.5px !important;
            border: 1px solid #cbd5e1 !important;
            line-height: 1.05 !important;
          }

          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-200 printable-report-container">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 print:hidden">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Monthly Attendance Report — {monthName} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Full monthly ledger formatted for clean 1-page A4 printing & PDF export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-report-action-btn"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (A4 Single Page)</span>
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
        <div className="printable-document space-y-2">
          {/* Header with Logo */}
          <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-950 p-1 flex items-center justify-center border border-amber-500 shrink-0 shadow-sm">
                {settings.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt="Institute Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <h1 className="text-base font-extrabold font-serif text-emerald-950 uppercase tracking-tight">
                  {settings.instituteName}
                </h1>
                <p className="text-[9px] font-semibold text-amber-700 tracking-wide uppercase">
                  Islamic Education Center — Online Academy Faculty Portal
                </p>
                <p className="text-[8.5px] text-slate-500">
                  {settings.geofence.instituteAddress}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-emerald-950 text-amber-300 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                Monthly Report
              </span>
              <p className="text-xs font-extrabold text-slate-800 font-serif mt-0.5">
                {monthName} {year}
              </p>
              <p className="text-[8.5px] text-slate-400 font-mono">
                Printed: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Teacher Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[8.5px] block">
                Teacher Name
              </span>
              <span className="font-bold text-slate-900 font-serif text-xs">
                {teacher.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[8.5px] block">
                Employee ID
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs">{teacher.employeeId}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[8.5px] block">
                Department / Designation
              </span>
              <span className="font-medium text-slate-800 text-xs">{teacher.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[8.5px] block">
                Target Arrival Time
              </span>
              <span className="font-bold text-emerald-800 font-mono text-xs">
                {formatTime12Hour(teacher.targetArrivalTime || settings.defaultTargetArrivalTime)}
              </span>
            </div>
          </div>

          {/* Month Summary Counters */}
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            <div className="p-1 bg-slate-100 rounded border border-slate-200">
              <span className="text-slate-500 text-[8.5px] block font-semibold">Total Month Days</span>
              <span className="text-xs font-extrabold text-slate-800 font-mono">
                {totalCalendarDays} Days
              </span>
            </div>
            <div className="p-1 bg-emerald-50 rounded border border-emerald-200 text-emerald-900">
              <span className="text-emerald-700 text-[8.5px] block font-semibold">On Time</span>
              <span className="text-xs font-extrabold text-emerald-700 font-mono">
                {onTimeDays}
              </span>
            </div>
            <div className="p-1 bg-amber-50 rounded border border-amber-200 text-amber-900">
              <span className="text-amber-700 text-[8.5px] block font-semibold">Late Arrivals</span>
              <span className="text-xs font-extrabold text-amber-700 font-mono">
                {lateDays}
              </span>
            </div>
            <div className="p-1 bg-rose-50 rounded border border-rose-200 text-rose-900">
              <span className="text-rose-700 text-[8.5px] block font-semibold">Absents</span>
              <span className="text-xs font-extrabold text-rose-700 font-mono">
                {absentDays}
              </span>
            </div>

            {!hideGeofenceColumn ? (
              <div className="p-1 bg-blue-50 rounded border border-blue-200 text-blue-900">
                <span className="text-blue-700 text-[8.5px] block font-semibold">Avg GPS Dist</span>
                <span className="text-xs font-extrabold text-blue-700 font-mono">
                  {formatDistance(avgDistance)}
                </span>
              </div>
            ) : (
              <div className="p-1 bg-indigo-50 rounded border border-indigo-200 text-indigo-900">
                <span className="text-indigo-700 text-[8.5px] block font-semibold">Leaves / Offs</span>
                <span className="text-xs font-extrabold text-indigo-700 font-mono">
                  {offOrLeaveDays}
                </span>
              </div>
            )}
          </div>

          {/* Entire Month Day-by-Day Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs printable-table">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-0.5 px-1.5">Date</th>
                  <th className="py-0.5 px-1.5">Day</th>
                  <th className="py-0.5 px-1.5">Target</th>
                  <th className="py-0.5 px-1.5">Check In</th>
                  <th className="py-0.5 px-1.5">Check Out</th>
                  <th className="py-0.5 px-1.5">Status</th>
                  {!hideGeofenceColumn && <th className="py-0.5 px-1.5">Distance</th>}
                  <th className="py-0.5 px-1.5">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthDays.map((dateStr) => {
                  const rec = teacherRecordsMap.get(dateStr);
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  const status = rec?.status || 'ABSENT';
                  const badge = getStatusBadgeInfo(status);

                  return (
                    <tr
                      key={dateStr}
                      className="hover:bg-slate-50"
                    >
                      <td className="py-0.5 px-1.5 font-mono font-medium">{dateStr}</td>
                      <td className="py-0.5 px-1.5 font-semibold text-slate-600">{dayName}</td>
                      <td className="py-0.5 px-1.5 font-mono text-slate-500">
                        {formatTime12Hour(
                          rec?.targetArrivalTime || teacher.targetArrivalTime || settings.defaultTargetArrivalTime
                        )}
                      </td>
                      <td className="py-0.5 px-1.5 font-mono">
                        {rec?.checkInTime
                          ? formatTime12Hour(rec.checkInTime)
                          : status === 'EXCUSED_LEAVE'
                          ? 'On Leave'
                          : status === 'OFF_DAY'
                          ? 'Off Day'
                          : '--:--'}
                      </td>
                      <td className="py-0.5 px-1.5 font-mono">
                        {rec?.checkOutTime ? formatTime12Hour(rec.checkOutTime) : '--:--'}
                      </td>
                      <td className="py-0.5 px-1.5">
                        <span
                          className={`px-1 py-0.25 rounded text-[8px] font-bold ${
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
                          {badge.label}
                        </span>
                      </td>

                      {!hideGeofenceColumn && (
                        <td className="py-0.5 px-1.5 font-mono text-slate-600">
                          {rec?.checkInDistanceMeters !== undefined
                            ? `${rec.checkInDistanceMeters}m`
                            : '-'}
                        </td>
                      )}

                      <td className="py-0.5 px-1.5 text-slate-500 truncate max-w-[140px]">
                        {rec?.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Printable Official Signature Block */}
          <div className="pt-2 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 page-break-avoid">
            <div>
              <div className="border-t border-slate-400 pt-1 font-bold font-serif text-slate-900">
                Teacher Signature
              </div>
              <p className="text-[8.5px] text-slate-400 mt-0.5">{teacher.name}</p>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-bold font-serif text-slate-900">
                Principal / Admin Verification Signature
              </div>
              <p className="text-[8.5px] text-slate-400 mt-0.5">
                {settings.instituteName} Administration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
