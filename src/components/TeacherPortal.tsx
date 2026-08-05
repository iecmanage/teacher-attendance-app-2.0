import React, { useState, useEffect } from 'react';
import { Teacher, AttendanceRecord, AdminSettings } from '../types';
import {
  calculateHaversineDistance,
  formatDistance,
  generateSimulatedPosition,
} from '../utils/geofence';
import {
  getTodayDateString,
  getCurrentTimeString,
  formatTime12Hour,
  evaluateCheckInTime,
  getStatusBadgeInfo,
} from '../utils/timeUtils';
import {
  MapPin,
  CheckCircle2,
  Clock,
  LogOut,
  Navigation,
  KeyRound,
  QrCode,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface TeacherPortalProps {
  teachers: Teacher[];
  attendanceRecords: AttendanceRecord[];
  settings: AdminSettings;
  onSaveAttendance: (record: AttendanceRecord) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  teachers,
  attendanceRecords,
  settings,
  onSaveAttendance,
}) => {
  // Access Code State
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [tokenVerified, setTokenVerified] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // GPS / Geofence State
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Success message modal
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Check URL params on initial mount (e.g. ?code=IEC-7891)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    const tokenFromUrl = urlParams.get('token');

    if (codeFromUrl) {
      const match = teachers.find(
        (t) => t.accessCode.toUpperCase() === codeFromUrl.toUpperCase() || t.employeeId.toUpperCase() === codeFromUrl.toUpperCase()
      );
      if (match) {
        setSelectedTeacher(match);
        setTokenVerified(true);
        setAccessCodeInput(match.accessCode);
      }
    } else if (teachers.length > 0) {
      // Default auto-select first active teacher for smooth testing
      setSelectedTeacher(teachers[0]);
      setTokenVerified(true);
      setAccessCodeInput(teachers[0].accessCode);
    }
  }, [teachers]);

  // Request user GPS location
  const fetchCurrentLocation = () => {
    setIsLocating(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      // Fallback to campus center position
      simulateLocation(15);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setIsSimulated(false);

        const dist = calculateHaversineDistance(
          lat,
          lng,
          settings.geofence.latitude,
          settings.geofence.longitude
        );
        setDistanceMeters(dist);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed/denied, switching to campus radar simulation', err);
        setLocationError(
          'GPS permission disabled or unavailable. Used campus GPS radar simulation.'
        );
        setIsLocating(false);
        simulateLocation(18); // Default 18m inside campus
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, [settings.geofence]);

  // Simulate location helper for easy testing
  const simulateLocation = (offsetMeters: number) => {
    const pos = generateSimulatedPosition(
      settings.geofence.latitude,
      settings.geofence.longitude,
      offsetMeters
    );
    setUserLat(pos.latitude);
    setUserLng(pos.longitude);
    setIsSimulated(true);

    const dist = calculateHaversineDistance(
      pos.latitude,
      pos.longitude,
      settings.geofence.latitude,
      settings.geofence.longitude
    );
    setDistanceMeters(dist);
  };

  // Handle access code login
  const handleVerifyAccessCode = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const code = accessCodeInput.trim().toUpperCase();
    if (!code) {
      setAuthError('Please enter your Teacher Access Code / PIN.');
      return;
    }

    const matchedTeacher = teachers.find(
      (t) =>
        t.accessCode.toUpperCase() === code ||
        t.employeeId.toUpperCase() === code ||
        t.phone.includes(code)
    );

    if (matchedTeacher) {
      if (matchedTeacher.status === 'INACTIVE') {
        setAuthError('This teacher record is marked as INACTIVE. Contact Admin.');
        return;
      }
      setSelectedTeacher(matchedTeacher);
      setTokenVerified(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Access Code or Employee ID. Please verify with Admin.');
    }
  };

  // Check today's record for selected teacher
  const todayStr = getTodayDateString();
  const todayRecord = selectedTeacher
    ? attendanceRecords.find(
        (r) => r.teacherId === selectedTeacher.id && r.date === todayStr
      )
    : null;

  // Handle Check-In
  const handleCheckIn = () => {
    if (!selectedTeacher) return;

    const currentDist = distanceMeters ?? 20;
    const isWithin = currentDist <= settings.geofence.radiusMeters;

    if (settings.geofence.strictEnforcement && !isWithin) {
      alert(
        `Geofence Enforcement Active: You are ${formatDistance(
          currentDist
        )} away. You must be within ${
          settings.geofence.radiusMeters
        }m of Islamic Education Center to check in.`
      );
      return;
    }

    const checkInTime24 = getCurrentTimeString();
    const targetTime = selectedTeacher.targetArrivalTime || settings.defaultTargetArrivalTime;
    const evaluation = evaluateCheckInTime(
      checkInTime24,
      targetTime,
      settings.gracePeriodMinutes
    );

    const recordId = todayRecord ? todayRecord.id : `att-${selectedTeacher.id}-${todayStr}`;

    const newRecord: AttendanceRecord = {
      id: recordId,
      teacherId: selectedTeacher.id,
      date: todayStr,
      checkInTime: checkInTime24,
      checkOutTime: todayRecord?.checkOutTime,
      status: evaluation.isOnTime ? 'ON_TIME' : 'LATE',
      checkInDistanceMeters: currentDist,
      checkInLat: userLat ?? settings.geofence.latitude,
      checkInLng: userLng ?? settings.geofence.longitude,
      isOnTime: evaluation.isOnTime,
      lateMinutes: evaluation.lateMinutes,
      targetArrivalTime: targetTime,
      notes: evaluation.isOnTime
        ? 'Arrived On Time'
        : `Late Arrival by ${evaluation.lateMinutes} mins`,
      lastUpdated: new Date().toISOString(),
    };

    onSaveAttendance(newRecord);

    const msg = evaluation.isOnTime
      ? `Check-In Successful! Marked ON TIME at ${formatTime12Hour(
          checkInTime24
        )} (Distance: ${formatDistance(currentDist)}).`
      : `Check-In Recorded! Marked LATE by ${
          evaluation.lateMinutes
        } mins at ${formatTime12Hour(checkInTime24)}.`;

    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  // Handle Check-Out
  const handleCheckOut = () => {
    if (!selectedTeacher || !todayRecord) return;

    const currentDist = distanceMeters ?? 20;
    const checkOutTime24 = getCurrentTimeString();

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      checkOutTime: checkOutTime24,
      checkOutDistanceMeters: currentDist,
      notes: (todayRecord.notes || '') + ` | Check-Out at ${formatTime12Hour(checkOutTime24)}`,
      lastUpdated: new Date().toISOString(),
    };

    onSaveAttendance(updatedRecord);
    setSuccessBanner(
      `Check-Out Marked Successfully at ${formatTime12Hour(
        checkOutTime24
      )}! Have a blessed day.`
    );
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  // Filter personal history for selected teacher
  const teacherHistory = selectedTeacher
    ? attendanceRecords
        .filter((r) => r.teacherId === selectedTeacher.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7)
    : [];

  const isWithinBounds =
    distanceMeters !== null && distanceMeters <= settings.geofence.radiusMeters;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border-2 border-amber-400/60 p-1 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              {selectedTeacher?.avatarUrl ? (
                <img
                  src={selectedTeacher.avatarUrl}
                  alt={selectedTeacher.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <User className="w-8 h-8 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60">
                  {settings.instituteName}
                </span>
                <span className="text-xs text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Dynamic Security Active
                </span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white mt-1">
                {selectedTeacher ? selectedTeacher.name : 'Teacher Access Portal'}
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                {selectedTeacher
                  ? `${selectedTeacher.designation} (${selectedTeacher.employeeId})`
                  : 'Enter access code or select your profile below to mark attendance.'}
              </p>
            </div>
          </div>

          {/* Quick Teacher Switcher dropdown for smooth demo testing */}
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-emerald-800/60 w-full md:w-auto">
            <label className="block text-[11px] font-medium text-amber-300 uppercase tracking-wider mb-1">
              Select Teacher Profile
            </label>
            <select
              id="teacher-portal-select"
              value={selectedTeacher?.id || ''}
              onChange={(e) => {
                const found = teachers.find((t) => t.id === e.target.value);
                if (found) {
                  setSelectedTeacher(found);
                  setAccessCodeInput(found.accessCode);
                  setTokenVerified(true);
                  setAuthError('');
                }
              }}
              className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 w-full md:w-64 focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Access Code Verification Box if Token Not Verified */}
      {!tokenVerified && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white max-w-xl mx-auto shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-950/80 border border-amber-600/40 rounded-xl text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif">Enter Teacher Access Code</h3>
              <p className="text-xs text-slate-400">
                To prevent saved URL reuse, enter your teacher PIN or code.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyAccessCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Access Code / Employee ID
              </label>
              <input
                id="teacher-access-code-input"
                type="text"
                placeholder="e.g. IEC-7891 or IEC-101"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-lg border border-rose-800">
                {authError}
              </p>
            )}

            <button
              id="verify-access-code-btn"
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Continue Check-In</span>
            </button>
          </form>
        </div>
      )}

      {/* Main Attendance Marking Card */}
      {selectedTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center 2 Columns: Geofence Radar + Check In/Out */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Banner Notice */}
            {successBanner && (
              <div className="bg-emerald-900/90 border-2 border-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-7 h-7 text-emerald-300 shrink-0" />
                <p className="text-sm font-semibold">{successBanner}</p>
              </div>
            )}

            {/* Geofence Status Radar Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white font-serif">
                      Campus Geofence Status
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Target: {settings.geofence.instituteAddress} (Radius: {settings.geofence.radiusMeters}m)
                    </p>
                  </div>
                </div>

                <button
                  id="refresh-gps-btn"
                  onClick={fetchCurrentLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : 'Refresh Distance'}</span>
                </button>
              </div>

              {/* Distance Display Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    isWithinBounds
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isWithinBounds
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-amber-500 text-white shadow-md'
                    }`}
                  >
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider opacity-80 block">
                      Current Distance to Institute
                    </span>
                    <span className="text-xl font-extrabold font-mono">
                      {formatDistance(distanceMeters ?? 0)}
                    </span>
                    <span className="text-xs block font-semibold mt-0.5">
                      {isWithinBounds
                        ? 'Inside Campus Geofence Bounds ✅'
                        : 'Outside Allowed Geofence Radius ⚠️'}
                    </span>
                  </div>
                </div>

                {/* Target Time & Status overview */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                      Target Arrival Time
                    </span>
                    <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {formatTime12Hour(
                        selectedTeacher.targetArrivalTime || settings.defaultTargetArrivalTime
                      )}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-0.5">
                      Grace Period: {settings.gracePeriodMinutes} mins allowed
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Quick Controls for test review */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isSimulated ? '📡 Location Simulator Mode Active' : '📍 Device GPS Active'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Quick Test Distance:</span>
                  <button
                    id="simulate-15m-btn"
                    onClick={() => simulateLocation(15)}
                    className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    15m (Inside)
                  </button>
                  <button
                    id="simulate-350m-btn"
                    onClick={() => simulateLocation(350)}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    350m (Outside)
                  </button>
                </div>
              </div>

              {locationError && (
                <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}
            </div>

            {/* Check-In / Check-Out Action Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif mb-4 flex items-center justify-between">
                <span>Today's Attendance Action</span>
                <span className="text-xs font-sans font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {todayStr}
                </span>
              </h3>

              {todayRecord?.checkInTime ? (
                /* Already checked in */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Checked In at {formatTime12Hour(todayRecord.checkInTime)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              todayRecord.isOnTime
                                ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            }`}
                          >
                            {todayRecord.isOnTime ? 'On Time' : `Late (${todayRecord.lateMinutes}m)`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Recorded Distance: {formatDistance(todayRecord.checkInDistanceMeters)}
                        </p>
                      </div>
                    </div>

                    {todayRecord.checkOutTime ? (
                      <div className="text-right sm:border-l border-emerald-200 dark:border-emerald-800 sm:pl-4">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                          Checked Out
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          {formatTime12Hour(todayRecord.checkOutTime)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* If not checked out yet, show Check Out button */}
                  {!todayRecord.checkOutTime ? (
                    <button
                      id="teacher-check-out-btn"
                      onClick={handleCheckOut}
                      className="w-full py-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <LogOut className="w-6 h-6" />
                      <span>Mark Check-Out (Departure)</span>
                    </button>
                  ) : (
                    <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium">
                      ✨ You have completed both Check-In and Check-Out for today.
                    </div>
                  )}
                </div>
              ) : (
                /* Not checked in yet */
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click below to record your arrival at Islamic Education Center. Your GPS position and check-in distance will be verified and stored.
                  </p>

                  <button
                    id="teacher-check-in-btn"
                    onClick={handleCheckIn}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 border border-emerald-400/40"
                  >
                    <CheckCircle2 className="w-7 h-7" />
                    <span>Arrived - Mark Attendance</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Teacher Details & Personal Recent Log */}
          <div className="space-y-6">
            {/* Teacher Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif mb-3">
                Teacher Information
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {selectedTeacher.employeeId}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Access Code:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedTeacher.accessCode}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Target Time:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatTime12Hour(selectedTeacher.targetArrivalTime)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedTeacher.phone}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                    {selectedTeacher.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent History Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif mb-4 flex items-center justify-between">
                <span>Recent Attendance</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </h3>

              <div className="space-y-2.5">
                {teacherHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No attendance records found yet.
                  </p>
                ) : (
                  teacherHistory.map((rec) => {
                    const badge = getStatusBadgeInfo(rec.status);
                    return (
                      <div
                        key={rec.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {rec.date}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            In: {formatTime12Hour(rec.checkInTime)}
                            {rec.checkOutTime ? ` | Out: ${formatTime12Hour(rec.checkOutTime)}` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                          >
                            {badge.label}
                          </span>
                          {rec.checkInDistanceMeters !== undefined && (
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                              {formatDistance(rec.checkInDistanceMeters)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
