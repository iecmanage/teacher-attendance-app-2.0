import { AdminSettings, Teacher, AttendanceRecord } from '../types';
import {
  INITIAL_ADMIN_SETTINGS,
  INITIAL_TEACHERS,
  generateInitialAttendanceRecords,
} from '../data/seedData';

const SETTINGS_KEY = 'iec_attendance_settings_v1';
const TEACHERS_KEY = 'iec_attendance_teachers_v1';
const ATTENDANCE_KEY = 'iec_attendance_records_v1';

export function getStoredSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with initial defaults to guarantee all fields exist
      return {
        ...INITIAL_ADMIN_SETTINGS,
        ...parsed,
        geofence: {
          ...INITIAL_ADMIN_SETTINGS.geofence,
          ...(parsed.geofence || {}),
        },
        githubSync: {
          ...INITIAL_ADMIN_SETTINGS.githubSync,
          ...(parsed.githubSync || {}),
        },
      };
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e);
  }
  return INITIAL_ADMIN_SETTINGS;
}

export function saveSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

export function getStoredTeachers(): Teacher[] {
  try {
    const data = localStorage.getItem(TEACHERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load teachers from storage', e);
  }
  return INITIAL_TEACHERS;
}

export function saveTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
  } catch (e) {
    console.error('Failed to save teachers to storage', e);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(ATTENDANCE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load attendance from storage', e);
  }
  const initial = generateInitialAttendanceRecords();
  saveAttendance(initial);
  return initial;
}

export function saveAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance to storage', e);
  }
}

export function resetAllDataToDefault(): {
  settings: AdminSettings;
  teachers: Teacher[];
  records: AttendanceRecord[];
} {
  saveSettings(INITIAL_ADMIN_SETTINGS);
  saveTeachers(INITIAL_TEACHERS);
  const records = generateInitialAttendanceRecords();
  saveAttendance(records);
  return {
    settings: INITIAL_ADMIN_SETTINGS,
    teachers: INITIAL_TEACHERS,
    records,
  };
}
