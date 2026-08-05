import { AttendanceStatus } from '../types';

export function getTodayDateString(): string {
  const today = new Date();
  return formatDateToYYYYMMDD(today);
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatTime12Hour(time24?: string): string {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

// Check if check-in time is late compared to target time (considering grace period)
export function evaluateCheckInTime(
  checkInTime24: string,
  targetArrivalTime24: string,
  gracePeriodMinutes: number = 0
): { isOnTime: boolean; lateMinutes: number } {
  const [cHours, cMins] = checkInTime24.split(':').map(Number);
  const [tHours, tMins] = targetArrivalTime24.split(':').map(Number);

  const checkInTotalMins = cHours * 60 + cMins;
  const targetTotalMins = tHours * 60 + tMins;
  const allowedTotalMins = targetTotalMins + gracePeriodMinutes;

  if (checkInTotalMins <= allowedTotalMins) {
    return { isOnTime: true, lateMinutes: 0 };
  } else {
    const lateMinutes = checkInTotalMins - targetTotalMins;
    return { isOnTime: false, lateMinutes };
  }
}

export function getMonthDaysList(year: number, monthIndex0Based: number): string[] {
  const days: string[] = [];
  const date = new Date(year, monthIndex0Based, 1);
  while (date.getMonth() === monthIndex0Based) {
    days.push(formatDateToYYYYMMDD(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getMonthName(monthIndex0Based: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex0Based] || '';
}

export function getDayOfWeekName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  // In many Islamic centers, Friday (5) and Saturday (6) or Sunday (0) might be off.
  // Here Friday / Sunday can be configured or treated visually.
  return day === 5 || day === 0; // Friday & Sunday
}

export function getStatusBadgeInfo(status: AttendanceStatus): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  switch (status) {
    case 'ON_TIME':
      return {
        label: 'On Time',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'LATE':
      return {
        label: 'Late Arrival',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800',
      };
    case 'ABSENT':
      return {
        label: 'Absent',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        textColor: 'text-rose-700 dark:text-rose-300',
        borderColor: 'border-rose-200 dark:border-rose-800',
      };
    case 'HALF_DAY':
      return {
        label: 'Half Day',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
      };
    case 'EXCUSED_LEAVE':
      return {
        label: 'Excused Leave',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
      };
    case 'OFF_DAY':
      return {
        label: 'Off Day',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
      };
    default:
      return {
        label: status,
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-200',
      };
  }
}
