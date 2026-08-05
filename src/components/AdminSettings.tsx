import React, { useState } from 'react';
import { AdminSettings as AdminSettingsType } from '../types';
import { DEFAULT_INSTITUTE_LOGO_SVG } from '../data/seedData';
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
} from 'lucide-react';

interface AdminSettingsProps {
  settings: AdminSettingsType;
  onSaveSettings: (newSettings: AdminSettingsType) => void;
  onResetData: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onResetData,
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
      geofence: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        instituteAddress,
        strictEnforcement,
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Global Target Arrival Time (HH:mm)
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
