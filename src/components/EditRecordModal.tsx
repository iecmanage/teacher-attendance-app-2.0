import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, Teacher } from '../types';
import { X, Save, Clock, MapPin, Calendar, FileText } from 'lucide-react';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  teacher: Teacher | null;
  dateStr: string;
  onSave: (updatedRecord: AttendanceRecord) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  teacher,
  dateStr,
  onSave,
}) => {
  const [checkInTime, setCheckInTime] = useState<string>('08:00');
  const [checkOutTime, setCheckOutTime] = useState<string>('15:30');
  const [status, setStatus] = useState<AttendanceStatus>('ON_TIME');
  const [distanceMeters, setDistanceMeters] = useState<string>('20');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (record) {
      setCheckInTime(record.checkInTime || '08:00');
      setCheckOutTime(record.checkOutTime || '15:30');
      setStatus(record.status || 'ON_TIME');
      setDistanceMeters(
        record.checkInDistanceMeters !== undefined ? String(record.checkInDistanceMeters) : '20'
      );
      setNotes(record.notes || '');
    } else {
      setCheckInTime('08:00');
      setCheckOutTime('15:30');
      setStatus('ON_TIME');
      setDistanceMeters('20');
      setNotes('');
    }
  }, [record, dateStr]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordId = record ? record.id : `att-${teacher.id}-${dateStr}`;

    const updated: AttendanceRecord = {
      id: recordId,
      teacherId: teacher.id,
      date: dateStr,
      checkInTime: status === 'ABSENT' || status === 'OFF_DAY' ? undefined : checkInTime,
      checkOutTime: status === 'ABSENT' || status === 'OFF_DAY' ? undefined : checkOutTime,
      status: status,
      checkInDistanceMeters:
        status === 'ABSENT' || status === 'OFF_DAY'
          ? undefined
          : parseFloat(distanceMeters) || 0,
      isOnTime: status === 'ON_TIME',
      targetArrivalTime: teacher.targetArrivalTime,
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
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attendance Status
            </label>
            <select
              id="edit-record-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ON_TIME">On Time (Present)</option>
              <option value="LATE">Late Arrival</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="EXCUSED_LEAVE">Excused Leave</option>
              <option value="OFF_DAY">Off Day / Holiday</option>
            </select>
          </div>

          {/* Time fields if present */}
          {status !== 'ABSENT' && status !== 'OFF_DAY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Check-In Time</span>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Check-Out Time</span>
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
          {status !== 'ABSENT' && status !== 'OFF_DAY' && (
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
                placeholder="e.g. 25"
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
              placeholder="e.g. Retroactively updated by Admin, Medical excuse attached..."
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
