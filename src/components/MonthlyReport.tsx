import React, { useState } from 'react';
import { Teacher, AttendanceRecord, AdminSettings } from '../types';
import {
  getMonthDaysList,
  getMonthName,
  getDayOfWeekName,
  formatTime12Hour,
  getStatusBadgeInfo,
} from '../utils/timeUtils';
import { formatDistance } from '../utils/geofence';
import { EditRecordModal } from './EditRecordModal';
import { PrintReportModal } from './PrintReportModal';
import {
  Calendar,
  Filter,
  Edit2,
  Printer,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface MonthlyReportProps {
  teachers: Teacher[];
  attendanceRecords: AttendanceRecord[];
  settings: AdminSettings;
  onSaveRecord: (record: AttendanceRecord) => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  teachers,
  attendanceRecords,
  settings,
  onSaveRecord,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-based
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('ALL');

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<{
    record: AttendanceRecord | null;
    teacher: Teacher;
    dateStr: string;
  } | null>(null);

  // Print Modal State
  const [printTeacher, setPrintTeacher] = useState<Teacher | null>(null);

  const monthDays = getMonthDaysList(selectedYear, selectedMonth);
  const monthName = getMonthName(selectedMonth);

  // Filter teachers
  const targetTeachers =
    selectedTeacherId === 'ALL'
      ? teachers
      : teachers.filter((t) => t.id === selectedTeacherId);

  // Calculate high-level summary counters across current filtered month
  let totalOnTimeCount = 0;
  let totalLateCount = 0;
  let totalAbsentCount = 0;
  let totalHalfDayCount = 0;
  let allDistances: number[] = [];

  targetTeachers.forEach((t) => {
    monthDays.forEach((dateStr) => {
      const rec = attendanceRecords.find(
        (r) => r.teacherId === t.id && r.date === dateStr
      );
      if (!rec || rec.status === 'ABSENT') {
        totalAbsentCount++;
      } else if (rec.status === 'ON_TIME') {
        totalOnTimeCount++;
        if (rec.checkInDistanceMeters !== undefined) allDistances.push(rec.checkInDistanceMeters);
      } else if (rec.status === 'LATE') {
        totalLateCount++;
        if (rec.checkInDistanceMeters !== undefined) allDistances.push(rec.checkInDistanceMeters);
      } else if (rec.status === 'HALF_DAY') {
        totalHalfDayCount++;
      }
    });
  });

  const avgGeofenceDistance =
    allDistances.length > 0
      ? Math.round(allDistances.reduce((a, b) => a + b, 0) / allDistances.length)
      : 0;

  return (
    <>
      <div className="space-y-6 print:hidden">
        {/* Top Header & Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span>Monthly Faculty Attendance Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete monthly logs for entire month with no days off. Unmarked days are automatically recorded as absent.
            </p>
          </div>

          {/* Quick Print Report Action */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedTeacherId !== 'ALL' ? (
              <button
                id="print-single-teacher-report-btn"
                onClick={() => {
                  const t = teachers.find((x) => x.id === selectedTeacherId);
                  if (t) setPrintTeacher(t);
                }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Print 1-Page Report ({teachers.find((x) => x.id === selectedTeacherId)?.name})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  id="print-teacher-picker-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      const t = teachers.find((x) => x.id === e.target.value);
                      if (t) setPrintTeacher(t);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  defaultValue=""
                >
                  <option value="" disabled>🖨️ Select Teacher to Print Report...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Select Month
            </label>
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Select Year
            </label>
            <select
              id="report-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filter Teacher / Employee
            </label>
            <select
              id="report-teacher-select"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Faculty Members ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Filtered Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              On Time Arrivals
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalOnTimeCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Late Arrivals
            </span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {totalLateCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Absents Recorded
            </span>
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {totalAbsentCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Avg Geofence Distance
            </span>
            <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatDistance(avgGeofenceDistance)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Detailed Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white font-serif text-sm">
            Detailed Daily Ledger ({monthName} {selectedYear})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click <Edit2 className="w-3.5 h-3.5 inline text-emerald-500" /> on any row to edit or convert absent records.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Date & Day</th>
                <th className="py-3 px-4">Teacher Name</th>
                <th className="py-3 px-4">Target Arrival</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Geofence Distance</th>
                <th className="py-3 px-4">Remarks / Notes</th>
                <th className="py-3 px-4 text-right">Edit Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {targetTeachers.map((teacher) =>
                monthDays.map((dateStr) => {
                  const dayName = getDayOfWeekName(dateStr);
                  const record = attendanceRecords.find(
                    (r) => r.teacherId === teacher.id && r.date === dateStr
                  );
                  const status = record?.status || 'ABSENT';
                  const badge = getStatusBadgeInfo(status);

                  return (
                    <tr
                      key={`${teacher.id}-${dateStr}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {dateStr} <span className="text-slate-400 text-[10px]">({dayName})</span>
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white font-serif">
                        {teacher.name}
                        <span className="text-[10px] font-mono text-slate-400 font-normal block">
                          {teacher.employeeId}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {formatTime12Hour(
                          record?.targetArrivalTime || teacher.targetArrivalTime || settings.defaultTargetArrivalTime
                        )}
                      </td>

                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {record?.checkInTime ? formatTime12Hour(record.checkInTime) : '--:--'}
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {record?.checkOutTime ? formatTime12Hour(record.checkOutTime) : '--:--'}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {record?.checkInDistanceMeters !== undefined ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {formatDistance(record.checkInDistanceMeters)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {record?.notes || (status === 'ABSENT' ? 'No Check-In Recorded' : '-')}
                        {record?.editedByAdmin && (
                          <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded ml-1">
                            Admin Modified
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`print-report-row-${teacher.id}-${dateStr}`}
                            onClick={() => setPrintTeacher(teacher)}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 font-semibold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800"
                            title="Print 1-Page Monthly Report for this Teacher"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print Report</span>
                          </button>
                          <button
                            id={`edit-report-row-${teacher.id}-${dateStr}`}
                            onClick={() =>
                              setEditingRecord({
                                record: record || null,
                                teacher,
                                dateStr,
                              })
                            }
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          record={editingRecord.record}
          teacher={editingRecord.teacher}
          dateStr={editingRecord.dateStr}
          onSave={onSaveRecord}
        />
      )}

      </div>

      {/* Print Modal */}
      {printTeacher && (
        <PrintReportModal
          isOpen={!!printTeacher}
          onClose={() => setPrintTeacher(null)}
          teacher={printTeacher}
          monthName={monthName}
          year={selectedYear}
          records={attendanceRecords}
          monthDays={monthDays}
          settings={settings}
        />
      )}
    </>
  );
};
