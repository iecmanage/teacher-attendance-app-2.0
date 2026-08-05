import React, { useState } from 'react';
import {
  Teacher,
  AttendanceRecord,
  AdminSettings as AdminSettingsType,
  AdminTab,
} from '../types';
import { getTodayDateString, formatTime12Hour } from '../utils/timeUtils';
import { formatDistance } from '../utils/geofence';
import { TeacherManagement } from './TeacherManagement';
import { MonthlyReport } from './MonthlyReport';
import { GeofenceMap } from './GeofenceMap';
import { AdminSettings } from './AdminSettings';
import { EditRecordModal } from './EditRecordModal';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  MapPin,
  Settings,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  QrCode,
  Copy,
  Check,
  Edit2,
  Radio,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  teachers: Teacher[];
  attendanceRecords: AttendanceRecord[];
  settings: AdminSettingsType;
  onLockAdmin: () => void;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onSaveRecord: (record: AttendanceRecord) => void;
  onSaveSettings: (newSettings: AdminSettingsType) => void;
  onResetData: () => void;
  onManualSync?: () => void;
  onPullGistData?: (gistId: string, token: string) => Promise<boolean>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  teachers,
  attendanceRecords,
  settings,
  onLockAdmin,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onSaveRecord,
  onSaveSettings,
  onResetData,
  onManualSync,
  onPullGistData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [generatedCode, setGeneratedCode] = useState<string>('IEC-7891');
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Quick edit modal state on overview feed
  const [editingRow, setEditingRow] = useState<{
    record: AttendanceRecord | null;
    teacher: Teacher;
    dateStr: string;
  } | null>(null);

  const todayStr = getTodayDateString();

  // Filter today's records
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  const checkedInTodayCount = todayRecords.filter(
    (r) => r.status === 'ON_TIME' || r.status === 'LATE' || r.status === 'HALF_DAY'
  ).length;

  const onTimeTodayCount = todayRecords.filter((r) => r.status === 'ON_TIME').length;
  const lateTodayCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const absentTodayCount = teachers.length - checkedInTodayCount;

  // Compute average check-in distance today
  const todayDistances = todayRecords
    .map((r) => r.checkInDistanceMeters)
    .filter((d): d is number => d !== undefined);

  const avgDistanceToday =
    todayDistances.length > 0
      ? Math.round(todayDistances.reduce((a, b) => a + b, 0) / todayDistances.length)
      : 0;

  const handleGenerateCode = () => {
    const randomCode = `IEC-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedCode(randomCode);
    setCodeCopied(false);
  };

  const handleCopyLink = () => {
    const origin = window.location.origin + window.location.pathname;
    const link = `${origin}?code=${encodeURIComponent(generatedCode)}`;
    navigator.clipboard.writeText(link);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Dashboard Header Bar */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
              Admin Control Center
            </span>
            <span className="text-xs text-slate-400 font-mono">Date: {todayStr}</span>
          </div>
          <h2 className="text-2xl font-bold font-serif mt-1">Real-Time Faculty Monitoring</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geofenced check-in tracking, customizable arrival targets, and monthly printable reports.
          </p>
        </div>

        <button
          id="lock-dashboard-btn"
          onClick={onLockAdmin}
          className="bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 px-4 py-2.5 rounded-xl text-xs font-semibold shadow transition-all flex items-center gap-2 shrink-0"
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Lock Dashboard PIN</span>
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1 print:hidden">
        <button
          id="admin-tab-overview"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Real-Time Monitor</span>
        </button>

        <button
          id="admin-tab-teachers"
          onClick={() => setActiveTab('TEACHERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TEACHERS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teacher Directory ({teachers.length})</span>
        </button>

        <button
          id="admin-tab-reports"
          onClick={() => setActiveTab('REPORTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'REPORTS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Monthly Reports & Print</span>
        </button>

        <button
          id="admin-tab-geofence"
          onClick={() => setActiveTab('GEOFENCE_MAP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'GEOFENCE_MAP'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Campus Radar</span>
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Institute Settings</span>
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">
                  Present Today
                </span>
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {checkedInTodayCount} / {teachers.length}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">
                  On-Time Today
                </span>
                <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {onTimeTodayCount}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">
                  Late Arrivals
                </span>
                <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {lateTodayCount}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">
                  Not Checked In
                </span>
                <span className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                  {absentTodayCount}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">
                  Avg Distance Today
                </span>
                <span className="text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {formatDistance(avgDistanceToday)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Today's Live Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Today's Live Attendance Feed ({todayStr})</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Geofence Allowed: {settings.geofence.radiusMeters}m
                </span>
              </div>

              <div className="space-y-3">
                {teachers.map((teacher) => {
                  const record = todayRecords.find((r) => r.teacherId === teacher.id);
                  const status = record?.status || 'ABSENT';

                  return (
                    <div
                      key={teacher.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 overflow-hidden shrink-0">
                          {teacher.avatarUrl ? (
                            <img
                              src={teacher.avatarUrl}
                              alt={teacher.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            teacher.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white font-serif">
                              {teacher.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({teacher.employeeId})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Target: {formatTime12Hour(teacher.targetArrivalTime || settings.defaultTargetArrivalTime)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            In: {record?.checkInTime ? formatTime12Hour(record.checkInTime) : '--:--'}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Dist:{' '}
                            {record?.checkInDistanceMeters !== undefined
                              ? formatDistance(record.checkInDistanceMeters)
                              : 'No GPS'}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            status === 'ON_TIME'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200'
                              : status === 'LATE'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200'
                          }`}
                        >
                          {status === 'ON_TIME'
                            ? 'On Time'
                            : status === 'LATE'
                            ? `Late (${record?.lateMinutes}m)`
                            : 'Absent'}
                        </span>

                        <button
                          id={`overview-edit-btn-${teacher.id}`}
                          onClick={() =>
                            setEditingRow({
                              record: record || null,
                              teacher,
                              dateStr: todayStr,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Quick Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Access Link & Dynamic Code Generator */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold font-serif text-base">Dynamic Teacher Link</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Generates an access code / dynamic URL. Teachers cannot bookmark static URLs because valid tokens expire daily.
                </p>

                <div className="space-y-3">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {generatedCode}
                    </span>
                    <button
                      id="generate-new-code-btn"
                      onClick={handleGenerateCode}
                      className="text-[11px] text-emerald-400 hover:underline font-semibold"
                    >
                      New Code
                    </button>
                  </div>

                  <button
                    id="copy-dynamic-link-btn"
                    onClick={handleCopyLink}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>Dynamic URL Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Teacher Access URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Geofence Radar Mini Preview */}
              <GeofenceMap
                config={settings.geofence}
                todayRecords={todayRecords}
                teachers={teachers}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEACHER MANAGEMENT */}
      {activeTab === 'TEACHERS' && (
        <TeacherManagement
          teachers={teachers}
          settings={settings}
          onAddTeacher={onAddTeacher}
          onUpdateTeacher={onUpdateTeacher}
          onDeleteTeacher={onDeleteTeacher}
        />
      )}

      {/* TAB CONTENT: MONTHLY REPORTS */}
      {activeTab === 'REPORTS' && (
        <MonthlyReport
          teachers={teachers}
          attendanceRecords={attendanceRecords}
          settings={settings}
          onSaveRecord={onSaveRecord}
        />
      )}

      {/* TAB CONTENT: GEOFENCE MAP */}
      {activeTab === 'GEOFENCE_MAP' && (
        <GeofenceMap
          config={settings.geofence}
          todayRecords={todayRecords}
          teachers={teachers}
        />
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <AdminSettings
          settings={settings}
          onSaveSettings={onSaveSettings}
          onResetData={onResetData}
          onManualSync={onManualSync}
          onPullGistData={onPullGistData}
        />
      )}

      {/* Quick Edit Modal */}
      {editingRow && (
        <EditRecordModal
          isOpen={!!editingRow}
          onClose={() => setEditingRow(null)}
          record={editingRow.record}
          teacher={editingRow.teacher}
          dateStr={editingRow.dateStr}
          onSave={onSaveRecord}
        />
      )}
    </div>
  );
};
