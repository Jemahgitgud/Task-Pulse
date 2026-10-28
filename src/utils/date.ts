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
 * Returns user-friendly date label like "Today, Oct 27" or "Thursday, Oct 29"
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

    return `${weekday}, ${month} ${dayNum}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns human-readable relative deadline tag
 */
export function getRelativeDeadlineLabel(dueDate: string, dueTime?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  urgencyColor: 'red' | 'amber' | 'emerald' | 'slate';
} {
  const today = formatDateKey();
  const now = new Date();

  if (dueDate < today) {
    const diffDays = Math.max(1, Math.round((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)));
    return {
      label: `Overdue ${diffDays}d`,
      isOverdue: true,
      isToday: false,
      urgencyColor: 'red',
    };
  }

  if (dueDate === today) {
    if (dueTime) {
      const [h, m] = dueTime.split(':').map(Number);
      const dueMoment = new Date();
      dueMoment.setHours(h, m, 0, 0);
      const diffMinutes = Math.round((dueMoment.getTime() - now.getTime()) / (1000 * 60));

      if (diffMinutes < 0) {
        return {
          label: `Overdue (${dueTime})`,
          isOverdue: true,
          isToday: true,
          urgencyColor: 'red',
        };
      }
      if (diffMinutes <= 60) {
        return {
          label: `Due in ${diffMinutes}m`,
          isOverdue: false,
          isToday: true,
          urgencyColor: 'red',
        };
      }
      return {
        label: `Today @ ${dueTime}`,
        isOverdue: false,
        isToday: true,
        urgencyColor: 'amber',
      };
    }
    return {
      label: 'Due Today',
      isOverdue: false,
      isToday: true,
      urgencyColor: 'amber',
    };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDate === formatDateKey(tomorrow)) {
    return {
      label: dueTime ? `Tomorrow @ ${dueTime}` : 'Tomorrow',
      isOverdue: false,
      isToday: false,
      urgencyColor: 'emerald',
    };
  }

  const diffDays = Math.round((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
  return {
    label: `In ${diffDays} days`,
    isOverdue: false,
    isToday: false,
    urgencyColor: 'slate',
  };
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
