import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, Teacher, AdminSettings } from '../types';
import { formatTime12Hour, evaluateCheckInTime } from '../utils/timeUtils';
import { X, Save, Clock, MapPin, Calendar, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export type StatusCategoryOption = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'EXCUSED_LEAVE' | 'OFF_DAY';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  teacher: Teacher | null;
  dateStr: string;
  onSave: (updatedRecord: AttendanceRecord) => void;
  settings?: AdminSettings;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  teacher,
  dateStr,
  onSave,
  settings,
}) => {
  const [statusCategory, setStatusCategory] = useState<StatusCategoryOption>('PRESENT');
  const [checkInTime, setCheckInTime] = useState<string>('08:00');
  const [checkOutTime, setCheckOutTime] = useState<string>('15:30');
  const [distanceMeters, setDistanceMeters] = useState<string>('20');
  const [notes, setNotes] = useState<string>('');

  const targetTime =
    record?.targetArrivalTime ||
    teacher?.targetArrivalTime ||
    settings?.defaultTargetArrivalTime ||
    '08:00';

  useEffect(() => {
    const defaultTime = teacher?.targetArrivalTime || settings?.defaultTargetArrivalTime || '08:00';

    if (record) {
      setCheckInTime(record.checkInTime || defaultTime);
      setCheckOutTime(record.checkOutTime || '15:30');
      if (record.status === 'ABSENT') {
        setStatusCategory('ABSENT');
      } else if (record.status === 'HALF_DAY') {
        setStatusCategory('HALF_DAY');
      } else if (record.status === 'EXCUSED_LEAVE') {
        setStatusCategory('EXCUSED_LEAVE');
      } else if (record.status === 'OFF_DAY') {
        setStatusCategory('OFF_DAY');
      } else {
        setStatusCategory('PRESENT');
      }
      setDistanceMeters(
        record.checkInDistanceMeters !== undefined ? String(record.checkInDistanceMeters) : '20'
      );
      setNotes(record.notes || '');
    } else {
      setCheckInTime(defaultTime);
      setCheckOutTime('15:30');
      setStatusCategory('PRESENT');
      setDistanceMeters('20');
      setNotes('');
    }
  }, [record, dateStr, teacher, settings]);

  if (!isOpen || !teacher) return null;

  // Live calculation of On Time vs Late Arrival based on check-in time vs target arrival time
  const evaluation = evaluateCheckInTime(
    checkInTime,
    targetTime,
    settings?.gracePeriodMinutes || 0,
    settings?.shiftType === 'NIGHT_SHIFT'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordId = record ? record.id : `att-${teacher.id}-${dateStr}`;

    let computedStatus: AttendanceStatus;
    let computedIsOnTime = false;
    let computedLateMinutes = 0;

    if (statusCategory === 'PRESENT') {
      computedStatus = evaluation.isOnTime ? 'ON_TIME' : 'LATE';
      computedIsOnTime = evaluation.isOnTime;
      computedLateMinutes = evaluation.lateMinutes;
    } else {
      computedStatus = statusCategory as AttendanceStatus;
      computedIsOnTime = false;
      computedLateMinutes = 0;
    }

    const updated: AttendanceRecord = {
      id: recordId,
      teacherId: teacher.id,
      date: dateStr,
      checkInTime: statusCategory === 'ABSENT' || statusCategory === 'OFF_DAY' ? undefined : checkInTime,
      checkOutTime: statusCategory === 'ABSENT' || statusCategory === 'OFF_DAY' ? undefined : checkOutTime,
      status: computedStatus,
      checkInDistanceMeters:
        statusCategory === 'ABSENT' || statusCategory === 'OFF_DAY'
          ? undefined
          : parseFloat(distanceMeters) || 0,
      isOnTime: computedIsOnTime,
      lateMinutes: computedLateMinutes,
      targetArrivalTime: targetTime,
      notes: notes,
      editedByAdmin: true,
      lastUpdated: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          id="edit-record-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Attendance Record Editor</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-white">{teacher.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Date: <strong className="text-slate-200 font-mono">{dateStr}</strong> | Employee ID:{' '}
            <strong className="text-slate-200 font-mono">{teacher.employeeId}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Arrival Info Banner */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Employee Target Arrival Time:</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800/80">
                {formatTime12Hour(targetTime)}
              </span>
            </div>

            {statusCategory === 'PRESENT' && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">Calculated Attendance Status:</span>
                <span
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm ${
                    evaluation.isOnTime
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                      : 'bg-amber-950 text-amber-300 border border-amber-700/80'
                  }`}
                >
                  {evaluation.isOnTime ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ON TIME</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>LATE ARRIVAL ({evaluation.lateMinutes} mins late)</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Attendance Type Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attendance Record Type
            </label>
            <select
              id="edit-record-status-select"
              value={statusCategory}
              onChange={(e) => setStatusCategory(e.target.value as StatusCategoryOption)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="PRESENT">Checked In / Present (Auto On-Time or Late)</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="EXCUSED_LEAVE">Excused Leave</option>
              <option value="OFF_DAY">Off Day / Holiday</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              * Note: On-Time vs. Late status is automatically calculated from the Check-In time relative to the employee's target arrival time ({formatTime12Hour(targetTime)}).
            </p>
          </div>

          {/* Time fields if present */}
          {statusCategory !== 'ABSENT' && statusCategory !== 'OFF_DAY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Check-In Time</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    {formatTime12Hour(checkInTime)}
                  </span>
                </label>
                <input
                  id="edit-record-checkin-time"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Check-Out Time</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                    {formatTime12Hour(checkOutTime)}
                  </span>
                </label>
                <input
                  id="edit-record-checkout-time"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Distance from geofence field */}
          {statusCategory !== 'ABSENT' && statusCategory !== 'OFF_DAY' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Recorded Geofence Distance (Meters)</span>
              </label>
              <input
                id="edit-record-distance"
                type="number"
                value={distanceMeters}
                onChange={(e) => setDistanceMeters(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Remarks / Exception Reason</span>
            </label>
            <textarea
              id="edit-record-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Adjusted check-in time, Medical excuse attached..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              id="edit-record-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="edit-record-save-btn"
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

