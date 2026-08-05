import React, { useState } from 'react';
import { AdminSettings as AdminSettingsType, ShiftType } from '../types';
import { DEFAULT_INSTITUTE_LOGO_SVG } from '../data/seedData';
import { QRCodeDisplay } from './QRCodeDisplay';
import { createNewGist, updateGistData, fetchGistData } from '../utils/githubSync';
import { getStoredTeachers, getStoredAttendance } from '../utils/storage';
import { formatTime12Hour } from '../utils/timeUtils';
import {
  Upload,
  Save,
  Clock,
  MapPin,
  Lock,
  RotateCcw,
  Building,
  CheckCircle2,
  FileImage,
  Moon,
  Sun,
  Github,
  QrCode,
  Printer,
  Sparkles,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface AdminSettingsProps {
  settings: AdminSettingsType;
  onSaveSettings: (newSettings: AdminSettingsType) => void;
  onResetData: () => void;
  onManualSync?: () => void;
  onPullGistData?: (gistId: string, token: string) => Promise<boolean>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onManualSync,
  onPullGistData,
}) => {
  const [instituteName, setInstituteName] = useState<string>(settings.instituteName);
  const [instituteTagline, setInstituteTagline] = useState<string>(settings.instituteTagline);
  const [logoBase64, setLogoBase64] = useState<string>(settings.logoBase64);
  const [defaultTargetArrivalTime, setDefaultTargetArrivalTime] = useState<string>(
    settings.defaultTargetArrivalTime
  );
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(
    settings.gracePeriodMinutes
  );
  const [adminPin, setAdminPin] = useState<string>(settings.adminPin);

  // Night Shift state
  const [shiftType, setShiftType] = useState<ShiftType>(settings.shiftType || 'NIGHT_SHIFT');
  const [nightShiftStartTime, setNightShiftStartTime] = useState<string>(
    settings.nightShiftStartTime || '21:00'
  );
  const [nightShiftEndTime, setNightShiftEndTime] = useState<string>(
    settings.nightShiftEndTime || '06:00'
  );
  const [overnightCutoffHour, setOvernightCutoffHour] = useState<number>(
    settings.overnightCutoffHour ?? 7
  );

  // GitHub Sync state
  const [githubSyncEnabled, setGithubSyncEnabled] = useState<boolean>(
    settings.githubSync?.enabled ?? false
  );
  const [githubToken, setGithubToken] = useState<string>(settings.githubSync?.githubToken || '');
  const [gistId, setGistId] = useState<string>(settings.githubSync?.gistId || '');
  const [customApiUrl, setCustomApiUrl] = useState<string>(
    settings.githubSync?.customApiUrl || ''
  );

  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);

  // Geofence
  const [latitude, setLatitude] = useState<number>(settings.geofence.latitude);
  const [longitude, setLongitude] = useState<number>(settings.geofence.longitude);
  const [radiusMeters, setRadiusMeters] = useState<number>(settings.geofence.radiusMeters);
  const [instituteAddress, setInstituteAddress] = useState<string>(
    settings.geofence.instituteAddress
  );
  const [strictEnforcement, setStrictEnforcement] = useState<boolean>(
    settings.geofence.strictEnforcement
  );

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Handle Logo Upload File Picker
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setLogoBase64(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultLogo = () => {
    setLogoBase64(DEFAULT_INSTITUTE_LOGO_SVG);
  };

  // Create GitHub Gist helper
  const handleCreateGitHubGist = async () => {
    if (!githubToken) {
      alert('Please enter a GitHub Personal Access Token first.');
      return;
    }

    setSyncingStatus('Creating secret Gist on GitHub...');
    try {
      const teachers = getStoredTeachers();
      const records = getStoredAttendance();
      const newGistId = await createNewGist(githubToken, {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        instituteName,
        settings: {
          ...settings,
          instituteName,
          shiftType,
          githubSync: {
            enabled: true,
            gistId: '',
            githubToken,
            customApiUrl,
            autoSync: true,
          },
        },
        teachers,
        records,
      });

      setGistId(newGistId);
      setGithubSyncEnabled(true);
      setSyncingStatus(`Gist Created Successfully! ID: ${newGistId}`);
      setTimeout(() => setSyncingStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert(`GitHub Gist Creation Failed: ${err.message}`);
      setSyncingStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: AdminSettingsType = {
      ...settings,
      instituteName,
      instituteTagline,
      logoBase64,
      defaultTargetArrivalTime,
      gracePeriodMinutes: Number(gracePeriodMinutes),
      adminPin,
      shiftType,
      nightShiftStartTime,
      nightShiftEndTime,
      overnightCutoffHour: Number(overnightCutoffHour),
      geofence: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        instituteAddress,
        strictEnforcement,
      },
      githubSync: {
        enabled: githubSyncEnabled,
        githubToken,
        gistId,
        customApiUrl,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
      },
    };

    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="bg-emerald-900 border-2 border-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
          <p className="text-sm font-semibold">
            Institute Settings & Geofence configuration saved successfully!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institute Branding & Logo Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-500" />
              <span>Institute Identity & Official Logo</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Logo uploaded here is printed directly on all teacher monthly attendance reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Logo Preview & Picker */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 p-2 flex items-center justify-center border border-amber-500/40 shadow-inner overflow-hidden mb-3">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Uploaded Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <FileImage className="w-10 h-10 text-slate-500" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Logo</span>
                  <input
                    id="admin-logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                <button
                  id="reset-default-logo-btn"
                  type="button"
                  onClick={handleResetToDefaultLogo}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 underline"
                >
                  Reset Logo
                </button>
              </div>
            </div>

            {/* Institute Name & Tagline */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institute Name *
                </label>
                <input
                  id="settings-institute-name"
                  type="text"
                  required
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-serif text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Subheader
                </label>
                <input
                  id="settings-institute-tagline"
                  type="text"
                  value={instituteTagline}
                  onChange={(e) => setInstituteTagline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Target Arrival Time & Grace Period */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Default Target Arrival Time & Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set global target arrival time for all teachers. Individual teacher target times can also be customized.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Global Target Arrival Time</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {formatTime12Hour(defaultTargetArrivalTime)}
                </span>
              </label>
              <input
                id="settings-default-target-time"
                type="time"
                required
                value={defaultTargetArrivalTime}
                onChange={(e) => setDefaultTargetArrivalTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (Minutes)
              </label>
              <input
                id="settings-grace-period"
                type="number"
                min="0"
                max="60"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Geofencing Coordinates & Enforcement */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <span>Campus GPS Geofence Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify exact latitude, longitude, and allowed proximity boundary in meters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Latitude
              </label>
              <input
                id="settings-geofence-lat"
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Longitude
              </label>
              <input
                id="settings-geofence-lng"
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Allowed Radius (Meters)
              </label>
              <input
                id="settings-geofence-radius"
                type="number"
                required
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10) || 100)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campus Address Text
            </label>
            <input
              id="settings-geofence-address"
              type="text"
              value={instituteAddress}
              onChange={(e) => setInstituteAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="settings-geofence-strict-toggle"
              type="checkbox"
              checked={strictEnforcement}
              onChange={(e) => setStrictEnforcement(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="settings-geofence-strict-toggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Strictly Block Check-Ins Outside Geofence (If unchecked, check-ins are allowed but flagged with exact distance)
            </label>
          </div>
        </div>

        {/* Night Shift & Overnight Shift Configuration Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-500" />
                <span>Shift Schedule Mode (Overnight / Night Shift Support)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure whether teachers work standard day shifts or overnight night shifts (e.g., 09:00 PM Saturday to 06:00 AM Sunday).
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              {shiftType === 'NIGHT_SHIFT' ? '🌙 Night Shift Active' : '☀️ Day Shift Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Type
              </label>
              <select
                id="settings-shift-type"
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as ShiftType)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NIGHT_SHIFT">🌙 Night Shift (Overnight e.g. 09:00 PM Sat → 06:00 AM Sun)</option>
                <option value="DAY_SHIFT">☀️ Day Shift (Standard e.g. 08:00 AM → 04:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Night Shift Target Arrival Time</span>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {formatTime12Hour(nightShiftStartTime)}
                </span>
              </label>
              <input
                id="settings-night-shift-start"
                type="time"
                value={nightShiftStartTime}
                onChange={(e) => setNightShiftStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Night Shift Target Departure Time</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  {formatTime12Hour(nightShiftEndTime)}
                </span>
              </label>
              <input
                id="settings-night-shift-end"
                type="time"
                value={nightShiftEndTime}
                onChange={(e) => setNightShiftEndTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Overnight Shift Cutoff Hour (0 to 12 AM)
              </label>
              <input
                id="settings-overnight-cutoff"
                type="number"
                min="1"
                max="12"
                value={overnightCutoffHour}
                onChange={(e) => setOvernightCutoffHour(parseInt(e.target.value, 10) || 7)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Cross-Day Logic Explanation:</strong> In Night Shift mode, if a teacher arrives Saturday at 09:00 PM and leaves Sunday at 06:00 AM (or checks in after midnight before 0{overnightCutoffHour}:00 AM Sunday), the attendance record is correctly credited to <strong>Saturday's date</strong>.
            </span>
          </div>
        </div>

        {/* GitHub JSON Storage & Remote Data Sync Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                <span>Central Cloud Storage (GitHub Gist / Remote JSON Sync)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Store and sync all attendance JSON data directly on GitHub or custom API so teachers can access and record attendance from their personal mobile devices.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="settings-github-enabled"
                type="checkbox"
                checked={githubSyncEnabled}
                onChange={(e) => setGithubSyncEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="settings-github-enabled" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Enable GitHub Gist Central Storage Sync
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  id="settings-github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Gist ID
                </label>
                <input
                  id="settings-gist-id"
                  type="text"
                  placeholder="e.g. 8a9b7c6d5e4f..."
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="create-gist-btn"
                type="button"
                onClick={handleCreateGitHubGist}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Create New Secret Gist on GitHub</span>
              </button>

              {gistId && (
                <>
                  <button
                    id="pull-gist-data-btn"
                    type="button"
                    onClick={async () => {
                      if (!gistId) return;
                      setSyncingStatus('Pulling latest data from GitHub Gist...');
                      if (onPullGistData) {
                        const success = await onPullGistData(gistId, githubToken);
                        if (success) {
                          setSyncingStatus('✅ Remote data loaded successfully from GitHub Gist!');
                          setTimeout(() => setSyncingStatus(null), 4000);
                        } else {
                          setSyncingStatus('❌ Failed to pull data from GitHub Gist.');
                        }
                      }
                    }}
                    className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-300" />
                    <span>Pull Remote Data Now</span>
                  </button>

                  <button
                    id="copy-multi-device-link-btn"
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?gistId=${gistId}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert(`Multi-Device Sync URL Copied to Clipboard!\n\n${shareUrl}\n\nOpen this link on any mobile phone or browser to automatically load and sync all teachers & attendance data!`);
                    }}
                    className="bg-indigo-900 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
                  >
                    <Share2 className="w-4 h-4 text-indigo-300" />
                    <span>Copy Multi-Device Sync Link</span>
                  </button>

                  <a
                    href={`https://gist.github.com/${gistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    View Raw Gist
                  </a>
                </>
              )}
            </div>

            {syncingStatus && (
              <p className="text-xs font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-emerald-800">
                {syncingStatus}
              </p>
            )}
          </div>
        </div>

        {/* Printable Institute Station Check-In QR Code Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                <span>Official Institution Wall Check-In QR Code</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Print and mount this official QR code on the wall at the institute entrance for teacher mobile check-in.
              </p>
            </div>

            <button
              id="print-campus-qr-btn"
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-500" />
              <span>Print Wall QR Poster</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center gap-6">
            <div className="p-3 bg-slate-900 rounded-2xl border border-amber-500/30 shadow-xl">
              <QRCodeDisplay
                value={`${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?wallQr=IEC-WALL-CHECKIN&v=${Date.now()}`}
                size={200}
              />
            </div>

            <div className="text-left space-y-2 max-w-sm text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                {instituteName}
              </span>
              <h4 className="text-xl font-bold font-serif text-white">Institute Wall QR Code</h4>
              <p className="text-xs text-slate-300">
                Teachers scan this QR code with their mobile phone camera or the in-app scanner at the institute entrance. They will be directed to enter their PIN to check in, verified by the campus GPS parameter.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-400">
                Wall QR Signature: IEC-WALL-CHECKIN
              </div>
            </div>
          </div>
        </div>

        {/* Security Admin PIN */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>Admin Dashboard Security PIN</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              4-digit security PIN used to lock and unlock the Admin Dashboard.
            </p>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Admin PIN
            </label>
            <input
              id="settings-admin-pin"
              type="password"
              maxLength={6}
              required
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm tracking-widest focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            id="reset-all-data-btn"
            type="button"
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to reset all teacher records, attendance logs, and settings back to default seed data?'
                )
              ) {
                onResetData();
              }
            }}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Data to Default</span>
          </button>

          <button
            id="save-settings-btn"
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Institute Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
