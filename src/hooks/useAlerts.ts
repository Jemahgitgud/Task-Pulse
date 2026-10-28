import { useState, useEffect, useCallback } from 'react';
import { Task, UserSettings, TaskAlert } from '../types';
import { formatDateKey, isPastCelebrationTask } from '../utils/date';
import { playAlertPing, triggerHaptic } from '../utils/audio';

const DISMISSED_STORAGE_KEY = 'taskpulse_dismissed_alerts_v3';
const NOTIFIED_STORAGE_KEY = 'taskpulse_notified_alerts_v3';

function getStoredMap(key: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordInMap(key: string, alertKey: string) {
  try {
    const map = getStoredMap(key);
    map[alertKey] = Date.now();
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

function isWithinTimeWindow(currentHHMM: string, targetHHMM?: string, windowMinutes = 15): boolean {
  if (!targetHHMM) return false;
  const [ch, cm] = currentHHMM.split(':').map(Number);
  const [th, tm] = targetHHMM.split(':').map(Number);
  if (Number.isNaN(ch) || Number.isNaN(th)) return false;
  const currentTotal = ch * 60 + cm;
  const targetTotal = th * 60 + tm;
  const diff = currentTotal - targetTotal;
  return diff >= 0 && diff <= windowMinutes;
}

export function useAlerts(tasks: Task[], settings: UserSettings) {
  const [activeAlert, setActiveAlert] = useState<TaskAlert | null>(null);

  useEffect(() => {
    if (!settings.enabled) return;

    const dispatchOnce = (
      alertObj: TaskAlert,
      osTitle: string,
      osBody: string,
      hapticMs = 50
    ) => {
      const notified = getStoredMap(NOTIFIED_STORAGE_KEY);
      const osKey = `${alertObj.id}_os_${settings.permission}`;
      const chimeKey = `${alertObj.id}_chime`;

      if (!notified[chimeKey]) {
        recordInMap(NOTIFIED_STORAGE_KEY, chimeKey);
        playAlertPing(settings.soundEnabled);
        triggerHaptic(hapticMs, settings.vibrationEnabled);
      }

      if (settings.permission === 'granted' && !notified[osKey]) {
        recordInMap(NOTIFIED_STORAGE_KEY, osKey);
        void triggerNotification(osTitle, {
          body: osBody,
          tag: alertObj.id,
        });
      }

      setActiveAlert(alertObj);
    };

    const checkDeadlines = () => {
      const now = new Date();
      const nowTime = now.getTime();
      const todayStr = formatDateKey(now);
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dismissed = getDismissedAlerts();
      const urgentWindowMinutes = Math.max(30, (settings.urgentAlertHoursBefore || 2) * 60);

      const activeTasks = tasks.filter(
        (t) => t.status !== 'completed' && t.reminderEnabled && !isPastCelebrationTask(t, todayStr)
      );

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

          if ((daysToEvent === 7 || task.dueDate === todayStr) && daysToEvent >= 0) {
            const alertKey = `7d_important_${task.id}_${targetEventDate}`;
            if (!dismissed[alertKey]) {
              const eventLabel = task.eventName || task.title;
              dispatchOnce(
                {
                  id: alertKey,
                  taskId: task.id,
                  title: `🚨 Peringatan 7 Hari: ${eventLabel}`,
                  message: `Tepat 7 hari sebelum ${targetEventDate}! Tarikh akhir persediaan (dateline) adalah hari ini.`,
                  urgency: 'warning',
                  timestamp: Date.now(),
                },
                `🚨 Peringatan 7 Hari: ${eventLabel}`,
                `Tepat 7 hari menjelang acara (${targetEventDate})! Tarikh akhir persediaan dijadualkan hari ini.`,
                50
              );
              return;
            }
          }
        }

        // 2. Critical: Due in <= 30 minutes
        if (diffMinutes > 0 && diffMinutes <= 30) {
          const alertKey = `30m_${task.id}_${task.dueDate}`;
          if (!dismissed[alertKey]) {
            dispatchOnce(
              {
                id: alertKey,
                taskId: task.id,
                title: `Deadline Approaching (${diffMinutes}m remaining)`,
                message: `"${task.title}" is due at ${task.dueTime || 'today'}.`,
                urgency: 'critical',
                timestamp: Date.now(),
              },
              `⚠️ Due in ${diffMinutes}m: ${task.title}`,
              `Project: ${task.project} · Due at ${task.dueTime || 'today'}`,
              60
            );
            return;
          }
        }

        // 3. Warning: Due within configured urgent alert window (default 2 hours)
        if (diffMinutes > 30 && diffMinutes <= urgentWindowMinutes) {
          const alertKey = `window_${task.id}_${task.dueDate}`;
          if (!dismissed[alertKey]) {
            const hours = Math.max(1, Math.round(diffMinutes / 60));
            dispatchOnce(
              {
                id: alertKey,
                taskId: task.id,
                title: `Due in ~${hours} Hour(s)`,
                message: `"${task.title}" (${task.project}) is due at ${task.dueTime || 'today'}.`,
                urgency: 'warning',
                timestamp: Date.now(),
              },
              `⏰ Deadline in ~${hours}h: ${task.title}`,
              `Priority: ${task.priority.toUpperCase()} · Project: ${task.project}`,
              40
            );
            return;
          }
        }

        // 4. Overdue task
        if (task.dueDate < todayStr || (task.dueDate === todayStr && task.dueTime && diffMinutes < 0)) {
          const alertKey = `overdue_${task.id}_${todayStr}`;
          if (!dismissed[alertKey]) {
            dispatchOnce(
              {
                id: alertKey,
                taskId: task.id,
                title: 'Overdue Deadline Requires Attention',
                message: `"${task.title}" was due on ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}.`,
                urgency: 'critical',
                timestamp: Date.now(),
              },
              `🚨 Overdue: ${task.title}`,
              `Project: ${task.project} · Was due ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}`,
              55
            );
            return;
          }
        }
      }

      // 5. Scheduled Morning Digest Notification
      const dueTodayCount = activeTasks.filter((t) => t.dueDate === todayStr).length;
      if (dueTodayCount > 0 && isWithinTimeWindow(currentHHMM, settings.morningDigestTime)) {
        const morningKey = `morning_digest_${todayStr}`;
        if (!dismissed[morningKey]) {
          dispatchOnce(
            {
              id: morningKey,
              taskId: 'digest-alert',
              title: `☀️ Morning Digest: ${dueTodayCount} deliverable${dueTodayCount > 1 ? 's' : ''} due today`,
              message: `Good morning! You have ${dueTodayCount} active task${dueTodayCount > 1 ? 's' : ''} scheduled for ${todayStr}.`,
              urgency: 'info',
              timestamp: Date.now(),
            },
            `☀️ TaskPulse Morning Digest`,
            `You have ${dueTodayCount} task${dueTodayCount > 1 ? 's' : ''} scheduled for today.`,
            35
          );
          return;
        }
      }

      // 6. Scheduled Evening Summary Notification
      const completedTodayCount = tasks.filter(
        (t) => t.status === 'completed' && t.completedAt?.startsWith(todayStr)
      ).length;
      if ((dueTodayCount > 0 || completedTodayCount > 0) && isWithinTimeWindow(currentHHMM, settings.eveningSummaryTime)) {
        const eveningKey = `evening_summary_${todayStr}`;
        if (!dismissed[eveningKey]) {
          dispatchOnce(
            {
              id: eveningKey,
              taskId: 'digest-alert',
              title: `🌙 Evening Summary: ${completedTodayCount} completed, ${dueTodayCount} remaining`,
              message: `Wrap-up check: ${completedTodayCount} task${completedTodayCount === 1 ? '' : 's'} finished today and ${dueTodayCount} still open.`,
              urgency: 'info',
              timestamp: Date.now(),
            },
            `🌙 TaskPulse Evening Summary`,
            `${completedTodayCount} completed today · ${dueTodayCount} remaining.`,
            35
          );
        }
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, [tasks, settings]);

  const dismissAlert = useCallback(() => {
    setActiveAlert((prev) => {
      if (prev && prev.taskId !== 'test-alert') {
        recordInMap(DISMISSED_STORAGE_KEY, prev.id);
      }
      return null;
    });
  }, []);

  const showTestAlert = useCallback((message?: string) => {
    setActiveAlert({
      id: `test_alert_${Date.now()}`,
      taskId: 'test-alert',
      title: '🔔 TaskPulse Notification Active!',
      message:
        message ||
        'In-app alert banner, synthesized audio chime, and browser reminder checks are working.',
      urgency: 'info',
      timestamp: Date.now(),
    });
  }, []);

  return {
    activeAlert,
    dismissAlert,
    showTestAlert,
  };
}

function getDismissedAlerts(): Record<string, number> {
  return getStoredMap(DISMISSED_STORAGE_KEY);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function triggerNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const mergedOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options,
  };

  // Prefer ServiceWorkerRegistration.showNotification (required on mobile Chrome / Android & PWAs)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, mergedOptions);
        return true;
      }
    } catch {
      // Fall back to window Notification constructor below
    }
  }

  try {
    new Notification(title, mergedOptions);
    return true;
  } catch {
    return false;
  }
}
