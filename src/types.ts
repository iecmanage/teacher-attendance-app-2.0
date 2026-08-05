export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'EXCUSED_LEAVE' | 'OFF_DAY';

export type ShiftType = 'DAY_SHIFT' | 'NIGHT_SHIFT';

export interface Teacher {
  id: string;
  employeeId: string; // e.g. IEC-101
  name: string;
  designation: string; // e.g. Senior Quran Teacher, Tajweed Instructor, Islamic History
  phone: string;
  email: string;
  targetArrivalTime: string; // HH:mm format e.g. "08:00" or "21:00" for night shift
  accessCode: string; // Teacher access code/PIN e.g. "IEC-8821"
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  joinedDate: string;
}

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD (Shift Start Date e.g. Saturday's date for 9PM Sat -> 6AM Sun shift)
  checkInTime?: string; // HH:mm or ISO string
  checkOutTime?: string; // HH:mm or ISO string
  status: AttendanceStatus;
  checkInDistanceMeters?: number; // Distance from geofence center in meters
  checkOutDistanceMeters?: number;
  checkInLat?: number;
  checkInLng?: number;
  isOnTime?: boolean;
  lateMinutes?: number;
  targetArrivalTime?: string; // Stored target time for that day
  notes?: string;
  editedByAdmin?: boolean;
  lastUpdated?: string;
  isNightShift?: boolean;
  shiftDateLabel?: string; // e.g. "Sat, Oct 24 (Night Shift: 09:00 PM - 06:00 AM)"
  checkInMethod?: 'GPS_GEOFENCE' | 'QR_SCANNER' | 'MANUAL_ADMIN';
}

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  instituteAddress: string;
  strictEnforcement: boolean; // if true, block check-in outside radius; if false, record with warning flag
}

export interface GitHubSyncConfig {
  enabled: boolean;
  gistId: string;
  githubToken: string;
  customApiUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface AdminSettings {
  instituteName: string;
  instituteTagline: string;
  logoBase64: string; // Stored logo image
  defaultTargetArrivalTime: string; // e.g. "08:00" or "21:00"
  gracePeriodMinutes: number; // e.g. 10 minutes
  adminPin: string; // Default '1234'
  geofence: GeofenceConfig;
  requireDynamicUrlToken: boolean; // Protect static URL reuse
  shiftType: ShiftType; // 'DAY_SHIFT' | 'NIGHT_SHIFT'
  nightShiftStartTime: string; // e.g. "21:00" (9:00 PM)
  nightShiftEndTime: string; // e.g. "06:00" (6:00 AM next morning)
  overnightCutoffHour: number; // e.g. 7 (00:00 to 07:00 AM belongs to previous date)
  githubSync: GitHubSyncConfig;
  lastUpdated?: string;
}

export type ViewMode = 'TEACHER_PORTAL' | 'ADMIN_DASHBOARD';

export type AdminTab = 'OVERVIEW' | 'TEACHERS' | 'REPORTS' | 'GEOFENCE_MAP' | 'SETTINGS';
