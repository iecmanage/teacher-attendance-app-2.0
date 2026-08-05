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
  getStoredLastUpdated,
  saveLastUpdated,
} from './utils/storage';
import { DEFAULT_INSTITUTE_LOGO_SVG } from './data/seedData';
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

  const pushServerSync = useCallback(
    async (
      currSettings: AdminSettings,
      currTeachers: Teacher[],
      currRecords: AttendanceRecord[],
      customTimestamp?: string
    ) => {
      const ts = customTimestamp || new Date().toISOString();
      const settingsWithTs = { ...currSettings, lastUpdated: ts };

      // Save locally
      saveSettings(settingsWithTs);
      saveTeachers(currTeachers);
      saveAttendance(currRecords);
      saveLastUpdated(ts);

      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: settingsWithTs,
            teachers: currTeachers,
            records: currRecords,
            lastUpdated: ts,
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

  // Central Server API Sync (Syncs across all mobile phones and browsers)
  const fetchServerSync = useCallback(async () => {
    try {
      const res = await fetch('/api/sync?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.teachers && data.records && data.settings) {
          const localLastUpdated = getStoredLastUpdated();
          const serverLastUpdated = data.lastUpdated || data.settings?.lastUpdated || '1970-01-01T00:00:00.000Z';

          const localSettings = getStoredSettings();
          const localTeachers = getStoredTeachers();
          const localRecords = getStoredAttendance();

          // Check if local has customized data (e.g. uploaded custom logo vs server seed logo)
          const localHasCustomLogo =
            localSettings.logoBase64 && localSettings.logoBase64 !== DEFAULT_INSTITUTE_LOGO_SVG;
          const serverHasDefaultLogo = data.settings.logoBase64 === DEFAULT_INSTITUTE_LOGO_SVG;

          const localHasCustomName =
            localSettings.instituteName && localSettings.instituteName !== 'Islamic Education Center';
          const serverHasDefaultName = data.settings.instituteName === 'Islamic Education Center';

          const localTime = new Date(localLastUpdated).getTime();
          const serverTime = new Date(serverLastUpdated).getTime();

          // If local client has strictly newer data, OR if local client has custom user edits while server is default seed data
          if (
            localTime > serverTime ||
            (localHasCustomLogo && serverHasDefaultLogo) ||
            (localHasCustomName && serverHasDefaultName)
          ) {
            // Force server store to be updated with local customized user data!
            const syncTs = localTime > 0 ? localLastUpdated : new Date().toISOString();
            await pushServerSync(localSettings, localTeachers, localRecords, syncTs);
            return;
          }

          // Otherwise, server data is newer or authoritative. Update local state and storage!
          if (serverTime >= localTime) {
            setTeachers(data.teachers);
            saveTeachers(data.teachers);
            setAttendanceRecords(data.records);
            saveAttendance(data.records);
            setSettings(data.settings);
            saveSettings(data.settings);
            saveLastUpdated(serverLastUpdated);
            setLastSyncedTime(
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
          }
        }
      }
    } catch (e) {
      console.warn('Server sync fetch error:', e);
    }
  }, [pushServerSync]);

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
      const ts = new Date().toISOString();
      const settingsWithTs = { ...currSettings, lastUpdated: ts };

      await pushServerSync(settingsWithTs, currTeachers, currRecords, ts);

      const gid = currSettings.githubSync?.gistId;
      const tok = currSettings.githubSync?.githubToken;

      if (!gid || !tok) return;

      setIsSyncing(true);
      try {
        const exportData: FullAttendanceExport = {
          version: '1.0',
          lastUpdated: ts,
          instituteName: currSettings.instituteName,
          settings: settingsWithTs,
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
    const ts = new Date().toISOString();
    const updatedSettings = { ...newSettings, lastUpdated: ts };
    setSettings(updatedSettings);
    pushToGist(updatedSettings, teachers, attendanceRecords);
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
    const ts = new Date().toISOString();
    const resetSettings = { ...res.settings, lastUpdated: ts };
    setSettings(resetSettings);
    setTeachers(res.teachers);
    setAttendanceRecords(res.records);
    pushToGist(resetSettings, res.teachers, res.records);
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
