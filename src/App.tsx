import React, { useState, useEffect } from 'react';
import { ViewMode, AdminSettings, Teacher, AttendanceRecord } from './types';
import {
  getStoredSettings,
  saveSettings,
  getStoredTeachers,
  saveTeachers,
  getStoredAttendance,
  saveAttendance,
  resetAllDataToDefault,
} from './utils/storage';
import { Header } from './components/Header';
import { PinLockModal } from './components/PinLockModal';
import { TeacherPortal } from './components/TeacherPortal';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [settings, setSettings] = useState<AdminSettings>(getStoredSettings);
  const [teachers, setTeachers] = useState<Teacher[]>(getStoredTeachers);
  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>(getStoredAttendance);

  const [viewMode, setViewMode] = useState<ViewMode>('TEACHER_PORTAL');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // Check URL params on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const mode = urlParams.get('mode');

    if (code) {
      setViewMode('TEACHER_PORTAL');
    } else if (mode === 'admin') {
      setIsPinModalOpen(true);
    }
  }, []);

  // Handlers for Settings
  const handleSaveSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Handlers for Teachers
  const handleAddTeacher = (newTeacher: Teacher) => {
    const updated = [newTeacher, ...teachers];
    setTeachers(updated);
    saveTeachers(updated);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const updated = teachers.map((t) =>
      t.id === updatedTeacher.id ? updatedTeacher : t
    );
    setTeachers(updated);
    saveTeachers(updated);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    saveTeachers(updated);
  };

  // Handlers for Attendance Records
  const handleSaveAttendanceRecord = (record: AttendanceRecord) => {
    const existingIdx = attendanceRecords.findIndex((r) => r.id === record.id);
    let updated: AttendanceRecord[];

    if (existingIdx >= 0) {
      updated = [...attendanceRecords];
      updated[existingIdx] = record;
    } else {
      updated = [record, ...attendanceRecords];
    }

    setAttendanceRecords(updated);
    saveAttendance(updated);
  };

  // Handler for full Data Reset
  const handleResetData = () => {
    const res = resetAllDataToDefault();
    setSettings(res.settings);
    setTeachers(res.teachers);
    setAttendanceRecords(res.records);
  };

  const handleUnlockAdminSuccess = () => {
    setIsAdminUnlocked(true);
    setIsPinModalOpen(false);
    setViewMode('ADMIN_DASHBOARD');
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setViewMode('TEACHER_PORTAL');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        settings={settings}
        viewMode={viewMode}
        setViewMode={(mode) => {
          if (mode === 'ADMIN_DASHBOARD' && !isAdminUnlocked) {
            setIsPinModalOpen(true);
          } else {
            setViewMode(mode);
          }
        }}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={handleLockAdmin}
        onOpenPinModal={() => setIsPinModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'TEACHER_PORTAL' ? (
          <TeacherPortal
            teachers={teachers}
            attendanceRecords={attendanceRecords}
            settings={settings}
            onSaveAttendance={handleSaveAttendanceRecord}
          />
        ) : (
          <AdminDashboard
            teachers={teachers}
            attendanceRecords={attendanceRecords}
            settings={settings}
            onLockAdmin={handleLockAdmin}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onSaveRecord={handleSaveAttendanceRecord}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} {settings.instituteName} — Faculty Geofenced Attendance System
        </p>
      </footer>

      {/* Security PIN Authorization Modal */}
      <PinLockModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleUnlockAdminSuccess}
        expectedPin={settings.adminPin || '1234'}
      />
    </div>
  );
}
