import React, { useState, useEffect, useMemo } from 'react';
import { Task, UserSettings, TaskPriority, TaskCategory } from './types';
import { useTasks } from './hooks/useTasks';
import { useAlerts, triggerNotification } from './hooks/useAlerts';
import {
  registerServiceWorkerAndPush,
  syncPushSubscriptionIfGranted,
  triggerServerPushTest,
} from './utils/pushNotifications';
import { playAlertPing, triggerHaptic } from './utils/audio';
import { Header } from './components/Header';
import { ActiveAlertBanner } from './components/ActiveAlertBanner';
import { DeadlineTaskListView } from './components/DeadlineTaskListView';
import { QuickAddModal } from './components/QuickAddModal';
import { SettingsModal } from './components/SettingsModal';
import { P2PSyncModal } from './components/P2PSyncModal';
import { MalaysianHolidaysModal } from './components/MalaysianHolidaysModal';
import { MalaysiaCelebrationModal } from './components/MalaysiaCelebrationModal';
import { AIBriefingModal } from './components/AIBriefingModal';
import { CheckCircle2, X } from 'lucide-react';
import { formatDateKey, calculatePrepDeadline } from './utils/date';
import { MalaysiaHoliday, getMalaysianHolidays } from './utils/malaysiaHolidays';

const SETTINGS_KEY = 'taskpulse_settings_v2';
const APP_TITLE_KEY = 'taskpulse_app_title_v2';
const THEME_KEY = 'taskpulse_theme_v2';

export default function App() {
  const [appTitle, setAppTitle] = useState<string>(() => {
    if (typeof window === 'undefined') return "Jemah's TaskPulse";
    return localStorage.getItem(APP_TITLE_KEY) || "Jemah's TaskPulse";
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) return stored === 'dark';
    return true;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const defaultSettings: UserSettings = {
      morningDigestTime: '08:30',
      eveningSummaryTime: '18:00',
      urgentAlertHoursBefore: 2,
      soundEnabled: true,
      vibrationEnabled: true,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      enabled: true,
    };
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const livePerm =
          typeof Notification !== 'undefined'
            ? Notification.permission
            : parsed.permission || 'default';
        return {
          ...defaultSettings,
          ...parsed,
          permission: livePerm,
          enabled: parsed.enabled ?? true,
        };
      }
    } catch {}
    return defaultSettings;
  });

  // Modal states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isP2PModalOpen, setIsP2PModalOpen] = useState(false);
  const [isHolidaysOpen, setIsHolidaysOpen] = useState(false);
  const [isAIBriefingOpen, setIsAIBriefingOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<MalaysiaHoliday | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    tasks,
    syncStatus,
    p2pStats,
    changeP2PRoom,
    syncP2PNow,
    addTask,
    updateTask,
    toggleTaskStatus,
    togglePin,
    rescheduleTask,
    deleteTask,
    clearCompleted,
    resetSampleTasks,
    importTasks,
  } = useTasks(settings.soundEnabled, settings.vibrationEnabled);

  const { activeAlert, dismissAlert, showTestAlert } = useAlerts(tasks, settings);

  // Register Service Worker & refresh Web Push subscription on boot
  useEffect(() => {
    syncPushSubscriptionIfGranted().then(({ permission }) => {
      setSettings((prev) => (prev.permission !== permission ? { ...prev, permission } : prev));
    });
  }, []);

  // Sync dark class to html and meta theme-color
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#090d16' : '#f8fafc');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  const handleUpdateAppTitle = (title: string) => {
    setAppTitle(title);
    localStorage.setItem(APP_TITLE_KEY, title);
    document.title = title;
  };

  // Keyboard shortcut: Press 'N' to quick add task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setEditingTask(null);
        setIsQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      updateTask(taskData.id, taskData);
      showToast(`Updated "${taskData.title}"`);
    } else {
      const created = addTask(taskData);
      showToast(`Added "${created.title}"`);
    }
    setEditingTask(null);
  };

  const handleQuickAdd = (partial: {
    title: string;
    project: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate: string;
    dueTime?: string;
  }) => {
    const created = addTask({
      ...partial,
      status: 'todo',
      subtasks: [],
      pinned: false,
      reminderEnabled: true,
    });
    showToast(`Added "${created.title}"`);
  };

  const handleAutoLogHolidayTask = (holiday: MalaysiaHoliday) => {
    const prepDueDate = calculatePrepDeadline(holiday.date, 7);
    const created = addTask({
      title: `Holiday Prep: ${holiday.name}`,
      description: holiday.description || `7-day advance reminder before ${holiday.name}.`,
      project: 'Holidays',
      priority: 'urgent',
      category: 'Deadline',
      dueDate: prepDueDate,
      dueTime: '09:00',
      status: 'todo',
      pinned: false,
      reminderEnabled: true,
      isImportantDate: true,
      eventDate: holiday.date,
      eventName: holiday.name,
      leadDaysNotice: 7,
      subtasks: [],
    });
    showToast(`Added "${created.title}" (Due: ${prepDueDate})`);
  };

  const handleAutoLogAllMajorHolidays = (year: number) => {
    const todayKey = formatDateKey();
    const holidays = getMalaysianHolidays(year);
    const majorHolidays = holidays.filter((h) => h.isPublicHoliday && h.date >= todayKey);
    let count = 0;
    for (const h of majorHolidays) {
      const prepDueDate = calculatePrepDeadline(h.date, 7);
      const exists = tasks.some((t) => t.eventDate === h.date);
      if (!exists) {
        addTask({
          title: `Holiday Prep: ${h.name}`,
          description: h.description || `7-day advance reminder before ${h.name}.`,
          project: 'Holidays',
          priority: 'urgent',
          category: 'Deadline',
          dueDate: prepDueDate,
          dueTime: '09:00',
          status: 'todo',
          pinned: false,
          reminderEnabled: true,
          isImportantDate: true,
          eventDate: h.date,
          eventName: h.name,
          leadDaysNotice: 7,
          subtasks: [],
        });
        count++;
      }
    }
    showToast(
      count > 0
        ? `Added ${count} upcoming ${year} holidays (7-day advance due date)`
        : `All upcoming ${year} holidays are already in your list`
    );
  };

  const handleEnableNotifications = async () => {
    const res = await registerServiceWorkerAndPush();
    handleUpdateSettings({ permission: res.permission, enabled: true });
    playAlertPing(settings.soundEnabled);
    triggerHaptic(40, settings.vibrationEnabled);
    if (res.permission === 'granted') {
      await triggerNotification(`${appTitle}: Notifications Active`, {
        body: 'Deadline alerts and reminders are enabled.',
      });
      await triggerServerPushTest();
      showTestAlert('Browser push notifications and deadline reminders are active.');
      showToast('Notifications enabled');
    } else if (res.blockedByIframe) {
      showTestAlert(
        'In-app banners and sound chimes are active. Open the direct app URL in Safari/Chrome to allow OS system popups.'
      );
    } else {
      showTestAlert('In-app deadline banners and sound chimes are active.');
    }
  };

  const handleSendTestAlert = async () => {
    playAlertPing(settings.soundEnabled);
    triggerHaptic(40, settings.vibrationEnabled);
    if (settings.permission === 'granted') {
      await triggerNotification(`${appTitle}: Test Reminder`, {
        body: 'Your deadline notifications are working properly.',
      });
      await triggerServerPushTest();
      showTestAlert('Test notification sent to browser push and in-app banner.');
    } else {
      showTestAlert('In-app test alert triggered. Enable browser push in Settings for OS popups.');
    }
  };

  const existingTaskEventDates = useMemo(
    () => new Set(tasks.filter((t) => t.eventDate).map((t) => t.eventDate!)),
    [tasks]
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-150">
      {/* Sticky Single-Row Top Bar + Active Alert Banner */}
      <div className="sticky top-0 z-40 w-full">
        <Header
          appTitle={appTitle}
          onOpenQuickAdd={() => {
            setEditingTask(null);
            setIsQuickAddOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHolidays={() => setIsHolidaysOpen(true)}
          notificationPermission={settings.permission}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
        />

        <ActiveAlertBanner
          alert={activeAlert}
          onDismiss={dismissAlert}
          onCompleteTask={toggleTaskStatus}
          onRescheduleTask={(taskId, days) => rescheduleTask(taskId, days)}
          notificationPermission={settings.permission}
          onRequestPermission={handleEnableNotifications}
        />
      </div>

      {/* Main Simple Deadline Task List */}
      <main className="flex-1 pb-safe safe-x pt-4 sm:pt-6 pb-10 w-full max-w-full overflow-x-clip">
        <div className="max-w-4xl mx-auto w-full">
          <DeadlineTaskListView
            tasks={tasks}
            onToggleStatus={toggleTaskStatus}
            onDelete={deleteTask}
            onReschedule={rescheduleTask}
            onTogglePin={togglePin}
            onEdit={(task) => {
              setEditingTask(task);
              setIsQuickAddOpen(true);
            }}
            onQuickAdd={handleQuickAdd}
            onClearCompleted={clearCompleted}
            onOpenAIBriefing={() => setIsAIBriefingOpen(true)}
          />
        </div>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-toast">
          <div className="bg-slate-900 dark:bg-slate-800 text-white border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold truncate">{toastMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingTask(null);
          setPrefilledDate(undefined);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        prefilledDate={prefilledDate}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        appTitle={appTitle}
        onUpdateAppTitle={handleUpdateAppTitle}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onEnableNotifications={handleEnableNotifications}
        onSendTestAlert={handleSendTestAlert}
        p2pStats={p2pStats}
        syncStatus={syncStatus}
        onOpenP2PSync={() => setIsP2PModalOpen(true)}
        onOpenHolidays={() => setIsHolidaysOpen(true)}
        tasks={tasks}
        onImportTasks={importTasks}
        onClearCompleted={clearCompleted}
        onResetSampleTasks={resetSampleTasks}
      />

      <P2PSyncModal
        isOpen={isP2PModalOpen}
        onClose={() => setIsP2PModalOpen(false)}
        stats={p2pStats}
        onChangeRoom={changeP2PRoom}
        onSyncNow={syncP2PNow}
      />

      <MalaysianHolidaysModal
        isOpen={isHolidaysOpen}
        onClose={() => setIsHolidaysOpen(false)}
        onAutoLogHoliday={handleAutoLogHolidayTask}
        onAutoLogAllMajor={handleAutoLogAllMajorHolidays}
        onSelectHolidayForDetails={(h) => setSelectedHoliday(h)}
        existingTaskEventDates={existingTaskEventDates}
      />

      <MalaysiaCelebrationModal
        holiday={selectedHoliday}
        onClose={() => setSelectedHoliday(null)}
        onScheduleTask={handleAutoLogHolidayTask}
      />

      <AIBriefingModal
        isOpen={isAIBriefingOpen}
        onClose={() => setIsAIBriefingOpen(false)}
        tasks={tasks}
      />
    </div>
  );
}
