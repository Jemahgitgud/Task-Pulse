import React, { useState, useEffect } from 'react';
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
import { NavigationTabs, TabKey } from './components/NavigationTabs';
import { ActiveAlertBanner } from './components/ActiveAlertBanner';
import { TodayRadarView } from './components/TodayRadarView';
import { WorklistView } from './components/WorklistView';
import { DeadlinesCalendarView } from './components/DeadlinesCalendarView';
import { DailyDigestAlertsView } from './components/DailyDigestAlertsView';
import { QuickAddModal } from './components/QuickAddModal';
import { SettingsModal } from './components/SettingsModal';
import { AIBriefingModal } from './components/AIBriefingModal';
import { P2PSyncModal } from './components/P2PSyncModal';
import { CheckCircle2, X } from 'lucide-react';
import { formatDateKey, calculatePrepDeadline, isPastCelebrationTask } from './utils/date';
import { MalaysiaHoliday, getMalaysianHolidays } from './utils/malaysiaHolidays';

const SETTINGS_KEY = 'taskpulse_settings_v2';
const APP_TITLE_KEY = 'taskpulse_app_title_v2';
const THEME_KEY = 'taskpulse_theme_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('radar');
  const [appTitle, setAppTitle] = useState<string>(() => {
    if (typeof window === 'undefined') return "Jemah's TaskPulse";
    return localStorage.getItem(APP_TITLE_KEY) || "Jemah's TaskPulse";
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) return stored === 'dark';
    return true; // Default dark
  });

  const [phoneMode, setPhoneMode] = useState<boolean>(false);

  // User alert & sound settings
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
          typeof Notification !== 'undefined' ? Notification.permission : parsed.permission || 'default';
        return { ...defaultSettings, ...parsed, permission: livePerm, enabled: parsed.enabled ?? true };
      }
    } catch {}
    return defaultSettings;
  });

  // Modal states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIBriefingOpen, setIsAIBriefingOpen] = useState(false);
  const [isP2PModalOpen, setIsP2PModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core tasks engine
  const {
    tasks,
    syncStatus,
    connectedDevices,
    lastAddedTaskId,
    p2pStats,
    changeP2PRoom,
    syncP2PNow,
    addTask,
    updateTask,
    toggleTaskStatus,
    toggleSubtask,
    togglePin,
    rescheduleTask,
    deleteTask,
    clearCompleted,
    resetSampleTasks,
    importTasks,
  } = useTasks(settings.soundEnabled, settings.vibrationEnabled);

  // Alerts monitor
  const { activeAlert, dismissAlert, showTestAlert } = useAlerts(tasks, settings);

  // Register Service Worker & refresh Web Push subscription on boot
  useEffect(() => {
    syncPushSubscriptionIfGranted().then(({ permission }) => {
      setSettings((prev) => (prev.permission !== permission ? { ...prev, permission } : prev));
    });
  }, []);

  // Sync dark class to html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Sync settings
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
      if ((e.key === 'n' || e.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
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
    }, 3500);
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
      title: `Persediaan Sambutan: ${holiday.name}`,
      description: holiday.description || `Persiapan awal dan semakan urusan 7 hari sebelum ${holiday.name}.`,
      project: 'Perayaan & Cuti',
      priority: 'urgent',
      category: 'Deadline',
      dueDate: prepDueDate,
      dueTime: '09:00',
      status: 'todo',
      pinned: true,
      reminderEnabled: true,
      isImportantDate: true,
      eventDate: holiday.date,
      eventName: holiday.name,
      leadDaysNotice: 7,
      subtasks: [
        { id: `st_${Date.now()}_1`, title: `Sediakan perancangan bajet & logistik sambutan`, completed: false },
        { id: `st_${Date.now()}_2`, title: `Pengesahan cuti / urusan tugasan penting`, completed: false },
        { id: `st_${Date.now()}_3`, title: `Selesaikan tempahan perjalanan / bekalan perayaan`, completed: false },
      ],
    });
    showToast(`Auto-log: "${created.title}" (Dateline: ${prepDueDate} - 7 hari sebelum)`);
  };

  const handleAutoLogAllMajorHolidays = (year: number) => {
    const todayKey = formatDateKey();
    const holidays = getMalaysianHolidays(year);
    // Only auto-log upcoming public holidays that have not already passed
    const majorHolidays = holidays.filter((h) => h.isPublicHoliday && h.date >= todayKey);
    let count = 0;
    for (const h of majorHolidays) {
      const prepDueDate = calculatePrepDeadline(h.date, 7);
      const exists = tasks.some((t) => t.eventDate === h.date);
      if (!exists) {
        addTask({
          title: `Persediaan Sambutan: ${h.name}`,
          description: h.description || `Persiapan rasmi 7 hari sebelum ${h.name}.`,
          project: 'Perayaan & Cuti',
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
          subtasks: [
            { id: `st_${Date.now()}_${count}_1`, title: `Sediakan perancangan sambutan & semakan jadual`, completed: false },
            { id: `st_${Date.now()}_${count}_2`, title: `Selesaikan tugasan kerja sebelum tarikh cuti`, completed: false },
          ],
        });
        count++;
      }
    }
    showToast(
      count > 0
        ? `Berjaya menambah ${count} perayaan akan datang (${year}) dengan dateline 7 hari sebelum!`
        : `Semua perayaan akan datang bagi ${year} telah pun dilog!`
    );
  };

  const today = formatDateKey();
  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && !isPastCelebrationTask(t, today)
  );
  const urgentCount = activeTasks.filter(
    (t) => t.priority === 'urgent' || t.dueDate <= today
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-150">
      {/* App Header */}
      <Header
        appTitle={appTitle}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
        phoneMode={phoneMode}
        onTogglePhoneMode={() => setPhoneMode(!phoneMode)}
        syncStatus={syncStatus}
        connectedDevices={connectedDevices}
        urgentCount={urgentCount}
        p2pStats={p2pStats}
        onOpenQuickAdd={() => {
          setEditingTask(null);
          setIsQuickAddOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAIBriefing={() => setIsAIBriefingOpen(true)}
        onOpenP2PSync={() => setIsP2PModalOpen(true)}
        notificationPermission={settings.permission}
        onEnableNotifications={async () => {
          const res = await registerServiceWorkerAndPush();
          handleUpdateSettings({ permission: res.permission, enabled: true });
          playAlertPing(settings.soundEnabled);
          triggerHaptic(40, settings.vibrationEnabled);
          if (res.permission === 'granted') {
            await triggerNotification("Jemah's TaskPulse: Alerts Active! 🔔", {
              body: 'System notifications and deadline reminders are enabled.',
            });
            await triggerServerPushTest();
            showTestAlert('System push notifications & in-app deadline alerts are enabled and active!');
            showToast('Notifications enabled & test alert sent!');
          } else if (res.blockedByIframe) {
            showTestAlert(
              'In-app banners & sound chimes are active! To also receive OS system popups, open the Shared/Direct App URL in a full browser tab.'
            );
            setActiveTab('digest');
          } else {
            showTestAlert('In-app visual banners & audio chimes are active!');
            setActiveTab('digest');
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 safe-bottom-clearance pt-3 sm:pt-6 px-2.5 sm:px-6 w-full max-w-full overflow-x-hidden">
        <div
          className={`mx-auto transition-all duration-200 w-full ${
            phoneMode
              ? 'max-w-[420px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-[44px] p-3 sm:p-4 shadow-2xl my-3'
              : 'max-w-4xl lg:max-w-5xl'
          }`}
        >
          {/* Active Alert Banner */}
          <ActiveAlertBanner
            alert={activeAlert}
            onDismiss={dismissAlert}
            onCompleteTask={toggleTaskStatus}
            onRescheduleTask={(taskId, days) => rescheduleTask(taskId, days)}
            notificationPermission={settings.permission}
            onRequestPermission={async () => {
              const res = await registerServiceWorkerAndPush();
              handleUpdateSettings({ permission: res.permission, enabled: true });
              if (res.permission === 'granted') {
                await triggerNotification("Jemah's TaskPulse: Alerts Active! 🔔", {
                  body: 'Background push and deadline alerts are now enabled.',
                });
                showToast('Browser & background push notifications enabled!');
              } else {
                setActiveTab('digest');
                showToast(
                  res.blockedByIframe
                    ? 'Open the direct app URL in a browser tab to allow OS popups (in-app alerts active!)'
                    : 'Check browser site permissions to allow OS popups'
                );
              }
            }}
          />

          {/* Navigation Tabs Bar */}
          <div className="mb-4 sm:mb-6">
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              urgentCount={urgentCount}
              totalActive={activeTasks.length}
            />
          </div>

          {/* Active Tab View */}
          {activeTab === 'radar' && (
            <TodayRadarView
              tasks={tasks}
              lastAddedTaskId={lastAddedTaskId}
              onToggleStatus={toggleTaskStatus}
              onToggleSubtask={toggleSubtask}
              onDelete={deleteTask}
              onReschedule={rescheduleTask}
              onTogglePin={togglePin}
              onEdit={(task) => {
                setEditingTask(task);
                setIsQuickAddOpen(true);
              }}
              onQuickAdd={handleQuickAdd}
              onOpenFullAddModal={() => {
                setEditingTask(null);
                setIsQuickAddOpen(true);
              }}
              onOpenAIBriefing={() => setIsAIBriefingOpen(true)}
            />
          )}

          {activeTab === 'worklist' && (
            <WorklistView
              tasks={tasks}
              onToggleStatus={toggleTaskStatus}
              onToggleSubtask={toggleSubtask}
              onDelete={deleteTask}
              onReschedule={rescheduleTask}
              onTogglePin={togglePin}
              onEdit={(task) => {
                setEditingTask(task);
                setIsQuickAddOpen(true);
              }}
              onOpenQuickAdd={() => {
                setEditingTask(null);
                setIsQuickAddOpen(true);
              }}
              onClearCompleted={clearCompleted}
            />
          )}

          {activeTab === 'deadlines' && (
            <DeadlinesCalendarView
              tasks={tasks}
              onToggleStatus={toggleTaskStatus}
              onToggleSubtask={toggleSubtask}
              onDelete={deleteTask}
              onReschedule={rescheduleTask}
              onTogglePin={togglePin}
              onEdit={(task) => {
                setEditingTask(task);
                setIsQuickAddOpen(true);
              }}
              onOpenQuickAdd={(date) => {
                setEditingTask(null);
                setPrefilledDate(date);
                setIsQuickAddOpen(true);
              }}
              onAutoLogHoliday={handleAutoLogHolidayTask}
              onAutoLogAllMajorHolidays={handleAutoLogAllMajorHolidays}
            />
          )}

          {activeTab === 'digest' && (
            <DailyDigestAlertsView
              tasks={tasks}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSampleTasks={resetSampleTasks}
              onImportTasks={importTasks}
              onTriggerTestBanner={showTestAlert}
              onOpenQuickAdd={() => {
                setEditingTask(null);
                setPrefilledDate(undefined);
                setIsQuickAddOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-toast">
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
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearCompleted={clearCompleted}
        onResetSampleTasks={resetSampleTasks}
      />

      <AIBriefingModal
        isOpen={isAIBriefingOpen}
        onClose={() => setIsAIBriefingOpen(false)}
        tasks={tasks}
      />

      <P2PSyncModal
        isOpen={isP2PModalOpen}
        onClose={() => setIsP2PModalOpen(false)}
        stats={p2pStats}
        onChangeRoom={changeP2PRoom}
        onSyncNow={syncP2PNow}
      />
    </div>
  );
}
