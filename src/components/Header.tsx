import React from 'react';
import { ViewMode, AdminSettings } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserCheck,
  LayoutDashboard,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  settings: AdminSettings;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAdminUnlocked: boolean;
  onLockAdmin: () => void;
  onOpenPinModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  viewMode,
  setViewMode,
  isAdminUnlocked,
  onLockAdmin,
  onOpenPinModal,
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Institute Branding */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-slate-800 p-1 flex items-center justify-center border border-emerald-500/30 shadow-inner overflow-hidden">
              {settings.logoBase64 ? (
                <img
                  src={settings.logoBase64}
                  alt="Institute Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Sparkles className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-serif">
                  {settings.instituteName}
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified Online Academy
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm">
                {settings.instituteTagline || 'Faculty Geofenced Attendance System'}
              </p>
            </div>
          </div>

          {/* Time & Portal Switcher Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Clock */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTime}</span>
            </div>

            {/* View Modes */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700/80 flex items-center text-xs">
              <button
                id="header-teacher-portal-btn"
                onClick={() => setViewMode('TEACHER_PORTAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'TEACHER_PORTAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Teacher Check-In</span>
              </button>

              <button
                id="header-admin-dashboard-btn"
                onClick={() => {
                  if (isAdminUnlocked) {
                    setViewMode('ADMIN_DASHBOARD');
                  } else {
                    onOpenPinModal();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'ADMIN_DASHBOARD'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
                {!isAdminUnlocked && <Lock className="w-3 h-3 text-amber-300 ml-0.5" />}
              </button>
            </div>

            {/* Admin Lock / Unlock Status Toggle */}
            {isAdminUnlocked ? (
              <button
                id="header-lock-admin-btn"
                onClick={onLockAdmin}
                className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-rose-950/80 text-emerald-300 hover:text-rose-300 border border-emerald-800 hover:border-rose-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                title="Lock Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Unlocked</span>
              </button>
            ) : (
              <button
                id="header-unlock-admin-btn"
                onClick={onOpenPinModal}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                title="Unlock Admin Dashboard"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin PIN</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
