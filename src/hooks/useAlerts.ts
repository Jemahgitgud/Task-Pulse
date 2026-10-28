import { useState, useEffect, useRef } from 'react';
import { Task, UserSettings, TaskAlert } from '../types';
import { formatDateKey } from '../utils/date';
import { playAlertPing, triggerHaptic } from '../utils/audio';

const ALERT_STORAGE_KEY = 'taskpulse_dismissed_alerts';

function getDismissedAlerts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordDismissedAlert(alertKey: string) {
  try {
    const map = getDismissedAlerts();
    map[alertKey] = Date.now();
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function useAlerts(tasks: Task[], settings: UserSettings) {
  const [activeAlert, setActiveAlert] = useState<TaskAlert | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const nowTime = now.getTime();
      const todayStr = formatDateKey(now);
      const dismissed = getDismissedAlerts();

      const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.reminderEnabled);

      for (const task of activeTasks) {
        if (!task.dueDate) continue;

        const dueTimestamp = new Date(`${task.dueDate}T${task.dueTime || '23:59:00'}`).getTime();
        const diffMinutes = Math.round((dueTimestamp - nowTime) / (1000 * 60));

        // 1. Important Date / Celebration 7-Day Alert (T-7 Advance Notice)
        if (task.isImportantDate || task.eventDate) {
          const targetEventDate = task.eventDate || task.dueDate;
          const [ey, em, ed] = targetEventDate.split('-').map(Number);
          const [ty, tm, td] = todayStr.split('-').map(Number);
          const eventTime = new Date(ey, em - 1, ed).getTime();
          const todayTime = new Date(ty, tm - 1, td).getTime();
          const daysToEvent = Math.round((eventTime - todayTime) / (1000 * 60 * 60 * 24));

          // Trigger on exactly 7 days before (or on the task's calculated T-7 prep due date)
          if ((daysToEvent === 7 || task.dueDate === todayStr) && daysToEvent >= 0) {
            const alertKey = `7d_important_${task.id}_${targetEventDate}`;
            if (!dismissed[alertKey]) {
              recordDismissedAlert(alertKey);
              const eventLabel = task.eventName || task.title;
              triggerNotification(`🚨 Peringatan 7 Hari: ${eventLabel}`, {
                body: `Tepat 7 hari menjelang acara (${targetEventDate})! Tarikh akhir persediaan dijadualkan hari ini.`,
              });
              playAlertPing(settings.soundEnabled);
              triggerHaptic(50, settings.vibrationEnabled);
              setActiveAlert({
                id: alertKey,
                taskId: task.id,
                title: `🚨 Peringatan 7 Hari: ${eventLabel}`,
                message: `Tepat 7 hari sebelum ${targetEventDate}! Tarikh akhir persediaan (dateline) adalah hari ini.`,
                urgency: 'warning',
                timestamp: Date.now(),
              });
              break;
            }
          }
        }

        // 2. Critical: Due in <= 30 minutes
        if (diffMinutes > 0 && diffMinutes <= 30) {
          const alertKey = `30m_${task.id}_${task.dueDate}`;
          if (!dismissed[alertKey]) {
            recordDismissedAlert(alertKey);
            triggerNotification(`⚠️ Due in ${diffMinutes}m: ${task.title}`, {
              body: `Project: ${task.project} · Due at ${task.dueTime || 'today'}`,
            });
            playAlertPing(settings.soundEnabled);
            triggerHaptic(60, settings.vibrationEnabled);
            setActiveAlert({
              id: alertKey,
              taskId: task.id,
              title: `Deadline Approaching (${diffMinutes}m remaining)`,
              message: `"${task.title}" is due at ${task.dueTime || 'today'}.`,
              urgency: 'critical',
              timestamp: Date.now(),
            });
            break;
          }
        }

        // 3. Warning: Due in 30 - 120 minutes
        if (diffMinutes > 30 && diffMinutes <= 120) {
          const alertKey = `2h_${task.id}_${task.dueDate}`;
          if (!dismissed[alertKey]) {
            recordDismissedAlert(alertKey);
            const hours = Math.round(diffMinutes / 60);
            triggerNotification(`⏰ Deadline in ~${hours}h: ${task.title}`, {
              body: `Priority: ${task.priority.toUpperCase()} · Project: ${task.project}`,
            });
            playAlertPing(settings.soundEnabled);
            triggerHaptic(40, settings.vibrationEnabled);
            setActiveAlert({
              id: alertKey,
              taskId: task.id,
              title: `Due in ~${hours} Hour(s)`,
              message: `"${task.title}" (${task.project}) is due at ${task.dueTime || 'today'}.`,
              urgency: 'warning',
              timestamp: Date.now(),
            });
            break;
          }
        }

        // 4. Overdue task
        if (task.dueDate < todayStr) {
          const alertKey = `overdue_${task.id}_${todayStr}`;
          if (!dismissed[alertKey]) {
            recordDismissedAlert(alertKey);
            setActiveAlert({
              id: alertKey,
              taskId: task.id,
              title: 'Overdue Deadline Requires Attention',
              message: `"${task.title}" was due on ${task.dueDate}.`,
              urgency: 'critical',
              timestamp: Date.now(),
            });
            break;
          }
        }
      }
    };

    // Run on initial mount
    if (!checkedRef.current) {
      checkedRef.current = true;
      checkDeadlines();
    }

    const interval = setInterval(checkDeadlines, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, [tasks, settings]);

  const dismissAlert = () => {
    if (activeAlert) {
      recordDismissedAlert(activeAlert.id);
      setActiveAlert(null);
    }
  };

  return {
    activeAlert,
    dismissAlert,
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function triggerNotification(title: string, options?: NotificationOptions): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
