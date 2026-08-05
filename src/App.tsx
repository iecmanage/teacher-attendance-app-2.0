import React, { useState, useEffect, useCallback } from 'react';
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
import { fetchGistData, updateGistData, FullAttendanceExport } from './utils/githubSync';
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

  // Cloud & Server Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Central Server API Sync (Syncs across all mobile phones and browsers)
  const fetchServerSync = useCallback(async () => {
    try {
      const res = await fetch('/api/sync?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.teachers && data.records && data.settings) {
          setTeachers(data.teachers);
          saveTeachers(data.teachers);
          setAttendanceRecords(data.records);
          saveAttendance(data.records);
          setSettings(data.settings);
          saveSettings(data.settings);
          setLastSyncedTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        }
      }
    } catch (e) {
      console.warn('Server sync fetch error:', e);
    }
  }, []);

  const pushServerSync = useCallback(
    async (
      currSettings: AdminSettings,
      currTeachers: Teacher[],
      currRecords: AttendanceRecord[]
    ) => {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: currSettings,
            teachers: currTeachers,
            records: currRecords,
          }),
        });
        setLastSyncedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (e) {
        console.warn('Server sync push error:', e);
      }
    },
    []
  );

  // Function to pull remote data from GitHub Gist
  const pullFromGist = useCallback(
    async (targetGistId?: string, targetToken?: string): Promise<boolean> => {
      const gid = targetGistId || settings.githubSync?.gistId;
      const tok = targetToken || settings.githubSync?.githubToken || '';

      if (!gid) {
        await fetchServerSync();
        return true;
      }

      setIsSyncing(true);
      try {
        const remoteData = await fetchGistData(tok, gid);
        if (remoteData) {
          if (Array.isArray(remoteData.teachers) && remoteData.teachers.length > 0) {
            setTeachers(remoteData.teachers);
            saveTeachers(remoteData.teachers);
          }
          if (Array.isArray(remoteData.records)) {
            setAttendanceRecords(remoteData.records);
            saveAttendance(remoteData.records);
          }
          if (remoteData.settings) {
            const mergedSettings = {
              ...remoteData.settings,
              githubSync: {
                ...remoteData.settings.githubSync,
                gistId: gid,
                githubToken: tok || remoteData.settings.githubSync?.githubToken || '',
                enabled: true,
              },
            };
            setSettings(mergedSettings);
            saveSettings(mergedSettings);
          }
          pushServerSync(remoteData.settings || settings, remoteData.teachers || teachers, remoteData.records || attendanceRecords);
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          return true;
        }
      } catch (err) {
        console.warn('GitHub Gist pull warning:', err);
      } finally {
        setIsSyncing(false);
      }
      return false;
    },
    [settings, teachers, attendanceRecords, fetchServerSync, pushServerSync]
  );

  // Function to push local data to GitHub Gist & Server
  const pushToGist = useCallback(
    async (
      currSettings: AdminSettings,
      currTeachers: Teacher[],
      currRecords: AttendanceRecord[]
    ) => {
      await pushServerSync(currSettings, currTeachers, currRecords);

      const gid = currSettings.githubSync?.gistId;
      const tok = currSettings.githubSync?.githubToken;

      if (!gid || !tok) return;

      setIsSyncing(true);
      try {
        const exportData: FullAttendanceExport = {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          instituteName: currSettings.instituteName,
          settings: currSettings,
          teachers: currTeachers,
          records: currRecords,
        };
        await updateGistData(tok, gid, exportData);
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('GitHub Gist push failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [pushServerSync]
  );

  // Initial load sync & URL params check
  useEffect(() => {
    fetchServerSync();

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const mode = urlParams.get('mode');
    const wallQr = urlParams.get('wallQr');
    const action = urlParams.get('action');
    const gistFromUrl = urlParams.get('gistId');

    if (code || wallQr || action === 'checkin') {
      setViewMode('TEACHER_PORTAL');
    } else if (mode === 'admin') {
      setIsPinModalOpen(true);
    }

    if (gistFromUrl) {
      const updatedSettings: AdminSettings = {
        ...settings,
        githubSync: {
          ...settings.githubSync,
          gistId: gistFromUrl,
          enabled: true,
        },
      };
      setSettings(updatedSettings);
      saveSettings(updatedSettings);
      pullFromGist(gistFromUrl, updatedSettings.githubSync?.githubToken);
    } else if (settings.githubSync?.gistId) {
      pullFromGist();
    }
  }, []);

  // Periodic Auto-Sync every 3s across all connected phones and PCs
  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.githubSync?.gistId) {
        pullFromGist();
      } else {
        fetchServerSync();
      }
    }, 3000);

    const handleWindowFocus = () => {
      if (settings.githubSync?.gistId) {
        pullFromGist();
      } else {
        fetchServerSync();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
    };
  }, [settings.githubSync?.gistId, pullFromGist, fetchServerSync]);

  // Handlers for Settings
  const handleSaveSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    pushToGist(newSettings, teachers, attendanceRecords);
  };

  // Handlers for Teachers
  const handleAddTeacher = (newTeacher: Teacher) => {
    const updated = [newTeacher, ...teachers];
    setTeachers(updated);
    saveTeachers(updated);
    pushToGist(settings, updated, attendanceRecords);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const updated = teachers.map((t) =>
      t.id === updatedTeacher.id ? updatedTeacher : t
    );
    setTeachers(updated);
    saveTeachers(updated);
    pushToGist(settings, updated, attendanceRecords);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    saveTeachers(updated);
    pushToGist(settings, updated, attendanceRecords);
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
    pushToGist(settings, teachers, updated);
  };

  // Handler for full Data Reset
  const handleResetData = () => {
    const res = resetAllDataToDefault();
    setSettings(res.settings);
    setTeachers(res.teachers);
    setAttendanceRecords(res.records);
    pushToGist(res.settings, res.teachers, res.records);
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
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
        onManualSync={() => pullFromGist()}
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
            onManualSync={() => pullFromGist()}
            onPullGistData={(gid, tok) => pullFromGist(gid, tok)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 print:hidden">
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
