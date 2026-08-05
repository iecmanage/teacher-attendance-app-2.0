import { AdminSettings, Teacher, AttendanceRecord } from '../types';

export const DEFAULT_INSTITUTE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%"><circle cx="150" cy="150" r="140" fill="%23064e3b" stroke="%23d97706" stroke-width="8"/><circle cx="150" cy="150" r="125" fill="none" stroke="%23fef3c7" stroke-width="2" stroke-dasharray="6,6"/><path d="M150 45 C180 85 210 110 210 160 C210 195 183 225 150 225 C117 225 90 195 90 160 C90 110 120 85 150 45 Z" fill="%23047857" stroke="%23f59e0b" stroke-width="4"/><path d="M150 70 L150 210 M110 160 L190 160 M120 120 L180 200 M180 120 L120 200" stroke="%23fef3c7" stroke-width="2" opacity="0.3"/><circle cx="150" cy="115" r="14" fill="%23f59e0b"/><path d="M135 150 Q150 135 165 150 Q150 165 135 150 Z" fill="%23fef3c7"/><text x="150" y="258" text-anchor="middle" fill="%23fef3c7" font-family="serif" font-weight="bold" font-size="18" letter-spacing="1">ISLAMIC EDUCATION CENTER</text><text x="150" y="278" text-anchor="middle" fill="%23f59e0b" font-family="sans-serif" font-size="11" letter-spacing="2">FACULTY ATTENDANCE PORTAL</text></svg>`;

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  instituteName: 'Islamic Education Center',
  instituteTagline: 'Excellence in Islamic Studies & Character Building',
  logoBase64: DEFAULT_INSTITUTE_LOGO_SVG,
  defaultTargetArrivalTime: '21:00', // 09:00 PM (Night Shift)
  gracePeriodMinutes: 10,
  adminPin: '1234',
  requireDynamicUrlToken: true,
  shiftType: 'NIGHT_SHIFT',
  nightShiftStartTime: '21:00', // 09:00 PM
  nightShiftEndTime: '06:00', // 06:00 AM next day
  overnightCutoffHour: 7, // Hours after midnight (00:00 - 07:00) that count as previous day's night shift
  geofence: {
    latitude: 24.8607,
    longitude: 67.0011,
    radiusMeters: 200,
    instituteAddress: 'Plot 42, Main Campus Avenue, Islamic Education Center',
    strictEnforcement: false, // Default records attendance with warning if outside
  },
  githubSync: {
    enabled: false,
    gistId: '',
    githubToken: '',
    customApiUrl: '',
    autoSync: true,
  },
};

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-101',
    employeeId: 'IEC-101',
    name: 'Qari Muhammad Hassan',
    designation: 'Senior Tajweed & Hifz Instructor',
    phone: '+92 300 1234567',
    email: 'hassan.qari@iec.edu',
    targetArrivalTime: '07:45',
    accessCode: 'IEC-7891',
    status: 'ACTIVE',
    joinedDate: '2023-01-15',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 't-102',
    employeeId: 'IEC-102',
    name: 'Sheikh Abdullah Al-Mansoor',
    designation: 'Head of Arabic Language & Hadith',
    phone: '+92 301 9876543',
    email: 'abdullah.m@iec.edu',
    targetArrivalTime: '08:00',
    accessCode: 'IEC-4521',
    status: 'ACTIVE',
    joinedDate: '2022-08-01',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 't-103',
    employeeId: 'IEC-103',
    name: 'Ustadh Bilal Ibrahim',
    designation: 'Islamic History & Fiqh Instructor',
    phone: '+92 321 4567890',
    email: 'bilal.ibrahim@iec.edu',
    targetArrivalTime: '08:00',
    accessCode: 'IEC-3319',
    status: 'ACTIVE',
    joinedDate: '2023-05-10',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 't-104',
    employeeId: 'IEC-104',
    name: 'Ustadha Fatima Siddiqui',
    designation: 'Girls Department Supervisor & Seerah Instructor',
    phone: '+92 333 1122334',
    email: 'fatima.s@iec.edu',
    targetArrivalTime: '07:45',
    accessCode: 'IEC-9012',
    status: 'ACTIVE',
    joinedDate: '2021-03-20',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 't-105',
    employeeId: 'IEC-105',
    name: 'Mufti Tariq Mahmood',
    designation: 'Senior Islamic Jurisprudence Scholar',
    phone: '+92 302 5566778',
    email: 'tariq.mufti@iec.edu',
    targetArrivalTime: '08:15',
    accessCode: 'IEC-6643',
    status: 'ACTIVE',
    joinedDate: '2020-09-01',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 't-106',
    employeeId: 'IEC-106',
    name: 'Ustadh Omar Farooq',
    designation: 'Primary Islamic Education & Moral Studies',
    phone: '+92 345 7788990',
    email: 'omar.f@iec.edu',
    targetArrivalTime: '08:00',
    accessCode: 'IEC-2290',
    status: 'ACTIVE',
    joinedDate: '2024-01-10',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
];

// Helper to generate seed attendance records for current & previous days
export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // Current month

  // Generate records for the past 25 days up to today
  const currentDay = now.getDate();

  for (let d = 1; d <= currentDay; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();

    // Skip Sunday (0) or mark as OFF_DAY if desired
    if (dayOfWeek === 0) {
      INITIAL_TEACHERS.forEach((teacher) => {
        records.push({
          id: `att-${teacher.id}-${dateStr}`,
          teacherId: teacher.id,
          date: dateStr,
          status: 'OFF_DAY',
          notes: 'Weekly Holiday',
          targetArrivalTime: teacher.targetArrivalTime,
        });
      });
      continue;
    }

    INITIAL_TEACHERS.forEach((teacher, idx) => {
      // Deterministic pseudo-random generation for realistic test data
      const seed = (d * 13 + idx * 7) % 100;

      // On today's date, only check in some teachers so live dashboard shows active state
      if (d === currentDay) {
        if (idx === 0) {
          records.push({
            id: `att-${teacher.id}-${dateStr}`,
            teacherId: teacher.id,
            date: dateStr,
            checkInTime: '07:41',
            status: 'ON_TIME',
            checkInDistanceMeters: 18,
            checkInLat: 24.86072,
            checkInLng: 67.00114,
            isOnTime: true,
            lateMinutes: 0,
            targetArrivalTime: teacher.targetArrivalTime,
            notes: 'Arrived early at campus gate',
          });
        } else if (idx === 1) {
          records.push({
            id: `att-${teacher.id}-${dateStr}`,
            teacherId: teacher.id,
            date: dateStr,
            checkInTime: '07:58',
            status: 'ON_TIME',
            checkInDistanceMeters: 35,
            checkInLat: 24.8608,
            checkInLng: 67.0012,
            isOnTime: true,
            lateMinutes: 0,
            targetArrivalTime: teacher.targetArrivalTime,
          });
        } else if (idx === 2) {
          records.push({
            id: `att-${teacher.id}-${dateStr}`,
            teacherId: teacher.id,
            date: dateStr,
            checkInTime: '08:24',
            status: 'LATE',
            checkInDistanceMeters: 112,
            checkInLat: 24.8611,
            checkInLng: 67.0015,
            isOnTime: false,
            lateMinutes: 24,
            targetArrivalTime: teacher.targetArrivalTime,
            notes: 'Traffic delay on main road',
          });
        } else if (idx === 3) {
          // Absent today
          records.push({
            id: `att-${teacher.id}-${dateStr}`,
            teacherId: teacher.id,
            date: dateStr,
            status: 'ABSENT',
            targetArrivalTime: teacher.targetArrivalTime,
            notes: 'No check-in recorded yet',
          });
        }
        return;
      }

      // Past days logic
      if (seed < 70) {
        // On time arrival
        const checkInMin = 35 + (seed % 15); // e.g. 07:35 to 07:50
        const checkInHour = teacher.targetArrivalTime.startsWith('07') ? 7 : 7;
        const checkInTimeStr = `07:${String(checkInMin).padStart(2, '0')}`;
        const distance = 12 + (seed % 60); // 12m to 72m inside geofence

        records.push({
          id: `att-${teacher.id}-${dateStr}`,
          teacherId: teacher.id,
          date: dateStr,
          checkInTime: checkInTimeStr,
          checkOutTime: '15:30',
          status: 'ON_TIME',
          checkInDistanceMeters: distance,
          checkOutDistanceMeters: distance + 5,
          isOnTime: true,
          lateMinutes: 0,
          targetArrivalTime: teacher.targetArrivalTime,
        });
      } else if (seed < 88) {
        // Late arrival
        const lateMins = 12 + (seed % 28);
        const checkInTimeStr = '08:' + String(lateMins).padStart(2, '0');
        const distance = 45 + (seed % 140);

        records.push({
          id: `att-${teacher.id}-${dateStr}`,
          teacherId: teacher.id,
          date: dateStr,
          checkInTime: checkInTimeStr,
          checkOutTime: '15:45',
          status: 'LATE',
          checkInDistanceMeters: distance,
          checkOutDistanceMeters: 50,
          isOnTime: false,
          lateMinutes: lateMins,
          targetArrivalTime: teacher.targetArrivalTime,
          notes: `Late by ${lateMins} mins`,
        });
      } else if (seed < 95) {
        // Excused Leave or Half Day
        records.push({
          id: `att-${teacher.id}-${dateStr}`,
          teacherId: teacher.id,
          date: dateStr,
          checkInTime: '08:00',
          checkOutTime: '12:00',
          status: 'HALF_DAY',
          checkInDistanceMeters: 28,
          isOnTime: true,
          lateMinutes: 0,
          targetArrivalTime: teacher.targetArrivalTime,
          notes: 'Approved half day for medical appointment',
        });
      } else {
        // Absent
        records.push({
          id: `att-${teacher.id}-${dateStr}`,
          teacherId: teacher.id,
          date: dateStr,
          status: 'ABSENT',
          targetArrivalTime: teacher.targetArrivalTime,
          notes: 'Unexcused Absence',
        });
      }
    });
  }

  return records;
}
