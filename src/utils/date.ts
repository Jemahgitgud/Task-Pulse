/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns user-friendly date label like "Today, Oct 28" or "Thu, Oct 29"
 */
export function formatDisplayDate(dateStr: string): string {
  try {
    const today = formatDateKey();
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = date.getDate();

    if (dateStr === today) {
      return `Today, ${month} ${dayNum}`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === formatDateKey(tomorrow)) {
      return `Tomorrow, ${month} ${dayNum}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === formatDateKey(yesterday)) {
      return `Yesterday, ${month} ${dayNum}`;
    }

    const currentYear = new Date().getFullYear();
    if (y !== currentYear) {
      return `${month} ${dayNum}, ${y}`;
    }

    return `${weekday}, ${month} ${dayNum}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats time from 24h to 12h display
 */
export function formatTime12h(time24?: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Returns difference in calendar days between two YYYY-MM-DD strings
 */
export function getDaysDifference(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns human-readable relative deadline countdown for quick deadline scanning
 */
export function getRelativeDeadlineLabel(dueDate: string, dueTime?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
  daysLeft: number;
  urgencyColor: 'red' | 'amber' | 'emerald' | 'slate';
} {
  const today = formatDateKey();
  const now = new Date();
  const daysLeft = getDaysDifference(today, dueDate);
  const formattedTime = dueTime ? formatTime12h(dueTime) : '';

  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return {
      label: overdueDays === 1 ? 'Overdue by 1d' : `Overdue by ${overdueDays}d`,
      isOverdue: true,
      isToday: false,
      isSoon: true,
      daysLeft,
      urgencyColor: 'red',
    };
  }

  if (daysLeft === 0) {
    if (dueTime) {
      const [h, m] = dueTime.split(':').map(Number);
      const dueMoment = new Date();
      dueMoment.setHours(h, m, 0, 0);
      const diffMinutes = Math.round((dueMoment.getTime() - now.getTime()) / (1000 * 60));

      if (diffMinutes < 0) {
        return {
          label: `Overdue · ${formattedTime}`,
          isOverdue: true,
          isToday: true,
          isSoon: true,
          daysLeft: 0,
          urgencyColor: 'red',
        };
      }
      if (diffMinutes <= 60) {
        return {
          label: `Due in ${diffMinutes}m`,
          isOverdue: false,
          isToday: true,
          isSoon: true,
          daysLeft: 0,
          urgencyColor: 'red',
        };
      }
      const hoursLeft = Math.round(diffMinutes / 60);
      if (hoursLeft <= 6) {
        return {
          label: `Due in ${hoursLeft}h · ${formattedTime}`,
          isOverdue: false,
          isToday: true,
          isSoon: true,
          daysLeft: 0,
          urgencyColor: 'amber',
        };
      }
      return {
        label: `Today · ${formattedTime}`,
        isOverdue: false,
        isToday: true,
        isSoon: true,
        daysLeft: 0,
        urgencyColor: 'amber',
      };
    }
    return {
      label: 'Due Today',
      isOverdue: false,
      isToday: true,
      isSoon: true,
      daysLeft: 0,
      urgencyColor: 'amber',
    };
  }

  if (daysLeft === 1) {
    return {
      label: formattedTime ? `Tomorrow · ${formattedTime}` : 'Tomorrow',
      isOverdue: false,
      isToday: false,
      isSoon: true,
      daysLeft: 1,
      urgencyColor: 'amber',
    };
  }

  if (daysLeft <= 7) {
    return {
      label: `In ${daysLeft} days`,
      isOverdue: false,
      isToday: false,
      isSoon: true,
      daysLeft,
      urgencyColor: daysLeft <= 3 ? 'amber' : 'emerald',
    };
  }

  return {
    label: `In ${daysLeft} days`,
    isOverdue: false,
    isToday: false,
    isSoon: false,
    daysLeft,
    urgencyColor: 'slate',
  };
}

/**
 * Subtracts N days from a YYYY-MM-DD date string
 */
export function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - days);
  return formatDateKey(date);
}

/**
 * Adds N days to a YYYY-MM-DD date string
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

/**
 * Calculates preparation deadline (defaults to 7 days before target event date)
 */
export function calculatePrepDeadline(eventDateStr: string, leadDays: number = 7): string {
  return subtractDays(eventDateStr, leadDays);
}

/**
 * Checks whether a task is a holiday / celebration milestone
 */
export function isCelebrationTask(task: {
  isImportantDate?: boolean;
  eventDate?: string;
  project?: string;
  title?: string;
}): boolean {
  return Boolean(
    task.isImportantDate ||
      task.eventDate ||
      task.project === 'Holidays' ||
      task.project === 'Perayaan & Cuti' ||
      task.title?.startsWith('Holiday Prep:') ||
      task.title?.startsWith('Persediaan Sambutan:')
  );
}

/**
 * Returns true if a holiday / celebration task's event date (or due date)
 * has already passed, so the app leaves it quietly without overdue alarms.
 */
export function isPastCelebrationTask(
  task: {
    status?: string;
    dueDate: string;
    isImportantDate?: boolean;
    eventDate?: string;
    project?: string;
    title?: string;
  },
  todayKey: string = formatDateKey()
): boolean {
  if (!isCelebrationTask(task)) return false;
  const targetDate = task.eventDate || task.dueDate;
  return Boolean(targetDate && targetDate < todayKey);
}
