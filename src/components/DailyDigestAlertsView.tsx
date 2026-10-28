import React, { useState } from 'react';
import {
  BellRing,
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  Clock,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Zap,
  PieChart,
  Calendar,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Task, UserSettings, TaskPriority, TaskCategory } from '../types';
import { formatDateKey, isPastCelebrationTask } from '../utils/date';
import { triggerNotification } from '../hooks/useAlerts';
import { playAlertPing, playCompletionChime, triggerHaptic } from '../utils/audio';
import {
  registerServiceWorkerAndPush,
  triggerServerPushTest,
  isEmbeddedIframe,
} from '../utils/pushNotifications';

interface DailyDigestAlertsViewProps {
  tasks: Task[];
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSampleTasks: () => void;
  onImportTasks: (tasks: Task[]) => void;
  onOpenQuickAdd: () => void;
  onTriggerTestBanner?: (message?: string) => void;
}

export const DailyDigestAlertsView: React.FC<DailyDigestAlertsViewProps> = ({
  tasks,
  settings,
  onUpdateSettings,
  onResetSampleTasks,
  onImportTasks,
  onOpenQuickAdd,
  onTriggerTestBanner,
}) => {
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [pushNotice, setPushNotice] = useState<string | null>(null);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const inIframe = isEmbeddedIframe();
  const today = formatDateKey();

  // Compute analytics (leave passed Persediaan Sambutan celebrations peacefully out of overdue/active load)
  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && !isPastCelebrationTask(t, today)
  );
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt?.startsWith(today)
  );
  const overdueTasks = activeTasks.filter((t) => t.dueDate < today);
  const dueTodayTasks = activeTasks.filter((t) => t.dueDate === today);

  const priorityCounts: Record<TaskPriority, number> = {
    urgent: activeTasks.filter((t) => t.priority === 'urgent').length,
    high: activeTasks.filter((t) => t.priority === 'high').length,
    medium: activeTasks.filter((t) => t.priority === 'medium').length,
    low: activeTasks.filter((t) => t.priority === 'low').length,
  };

  const categoryCounts: Record<TaskCategory, number> = {
    Work: tasks.filter((t) => t.category === 'Work').length,
    Meeting: tasks.filter((t) => t.category === 'Meeting').length,
    Review: tasks.filter((t) => t.category === 'Review').length,
    Deadline: tasks.filter((t) => t.category === 'Deadline').length,
    Personal: tasks.filter((t) => t.category === 'Personal').length,
  };

  const totalPool = dueTodayTasks.length + completedToday.length + overdueTasks.length;
  const completionRate =
    totalPool > 0 ? Math.round((completedToday.length / totalPool) * 100) : 100;

  const handleRequestPermission = async () => {
    const regResult = await registerServiceWorkerAndPush();
    const permission = regResult.permission;
    onUpdateSettings({ permission, enabled: true });

    if (permission === 'granted') {
      setPushNotice(
        regResult.subscribed
          ? 'Browser & background Web Push notifications are active!'
          : 'Browser notifications enabled! In-app & system alerts are active.'
      );
      await triggerNotification("Jemah's TaskPulse: Notifikasi Aktif! 🚀", {
        body: `Notifikasi latar belakang & penyegerakan aktif. ${dueTodayTasks.length} tugasan hari ini.`,
      });
      onTriggerTestBanner?.(
        `Browser & background notifications enabled! ${dueTodayTasks.length} task(s) scheduled for today.`
      );
      playCompletionChime(settings.soundEnabled);
      triggerHaptic(40, settings.vibrationEnabled);
    } else if (regResult.blockedByIframe) {
      setPushNotice(
        'In-app banners & sound alerts are active! Browser OS popups are restricted inside embedded preview frames — open the Direct App Link in a full browser tab (or Add to Home Screen on mobile) to unlock OS push popups.'
      );
      onTriggerTestBanner?.(
        'In-app visual banners & audio chimes are active! Open the direct app URL in a standalone browser tab to also allow OS-level push popups.'
      );
      playAlertPing(settings.soundEnabled);
    } else {
      setPushNotice(
        'Browser OS permission is currently blocked in site settings. In-app visual banners & audio chimes remain active!'
      );
      onTriggerTestBanner?.('In-app visual banners & audio chimes are enabled and active.');
      playAlertPing(settings.soundEnabled);
    }
  };

  const handleTestAlert = async () => {
    let currentPerm = settings.permission;
    if (currentPerm === 'default') {
      const regResult = await registerServiceWorkerAndPush();
      currentPerm = regResult.permission;
      onUpdateSettings({ permission: currentPerm, enabled: true });
    }

    const osDispatched = await triggerNotification("TaskPulse Alert: Deadline Approaching ⏰", {
      body: "High priority deliverable review scheduled for today. Keep up the great velocity!",
    });
    const pushRes = await triggerServerPushTest();

    playAlertPing(settings.soundEnabled);
    triggerHaptic(50, settings.vibrationEnabled);

    onTriggerTestBanner?.(
      osDispatched || pushRes.subscribersNotified > 0
        ? 'Test notification dispatched to both your system notification tray and in-app banner!'
        : inIframe
        ? 'In-app banner & chime fired! (Open the Direct App URL in a new browser tab if you also want OS system tray popups.)'
        : 'In-app banner & audio chime fired! Enable browser permission in site settings to also receive OS tray popups.'
    );

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  const handleCopyDirectUrl = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedDirectUrl(true);
      setTimeout(() => setCopiedDirectUrl(false), 2500);
    });
  };

  const handleExportBackup = () => {
    const json = JSON.stringify(tasks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskpulse_backup_${formatDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          setImportFeedback({ text: `Successfully imported ${parsed.length} tasks!`, isError: false });
          setTimeout(() => setImportFeedback(null), 4000);
        }
      } catch {
        setImportFeedback({ text: 'Invalid backup JSON file.', isError: true });
        setTimeout(() => setImportFeedback(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Daily Executive Briefing Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                Daily Progress Digest
              </span>
              <h2 className="text-base sm:text-lg font-bold">Executive Briefing & Workload Analysis</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Streak: Active</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block">Today's Rate</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              {completionRate}%
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block">Done Today</span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {completedToday.length}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block">Due Today</span>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
              {dueTodayTasks.length}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block">Overdue</span>
            <span
              className={`text-xl sm:text-2xl font-extrabold ${
                overdueTasks.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'
              }`}
            >
              {overdueTasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Customizable Alerts & Notifications Config */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Customizable Alerts & Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive proactive reminders before deadlines and morning digests
              </p>
            </div>
          </div>

          {settings.permission === 'granted' ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>System Push Active</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              Enable Alerts
            </button>
          )}
        </div>

        {/* Status Summary Strip */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              In-App Banner & Chime Alerts: <strong className="text-emerald-600 dark:text-emerald-400">{settings.enabled ? 'Enabled' : 'Paused'}</strong>
              {' · '}
              OS Push: <strong className={settings.permission === 'granted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {settings.permission === 'granted' ? 'Granted' : inIframe ? 'Standalone Tab Required' : settings.permission === 'denied' ? 'Blocked in Browser' : 'Tap Enable Alerts'}
              </strong>
            </span>
          </div>

          {inIframe && settings.permission !== 'granted' && (
            <button
              type="button"
              onClick={handleCopyDirectUrl}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 font-semibold text-[11px] hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
            >
              {copiedDirectUrl ? 'Direct Link Copied!' : 'Copy Direct App Link'}
            </button>
          )}
        </div>

        {pushNotice && (
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
            {pushNotice}
          </div>
        )}

        {/* Timers & Schedule Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Morning Digest</span>
            </label>
            <input
              type="time"
              value={settings.morningDigestTime}
              onChange={(e) => onUpdateSettings({ morningDigestTime: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Evening Summary</span>
            </label>
            <input
              type="time"
              value={settings.eveningSummaryTime}
              onChange={(e) => onUpdateSettings({ eveningSummaryTime: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Advance Lead Alert</span>
            </label>
            <select
              value={settings.urgentAlertHoursBefore || 2}
              onChange={(e) => onUpdateSettings({ urgentAlertHoursBefore: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value={1}>1 hour before</option>
              <option value={2}>2 hours before</option>
              <option value={4}>4 hours before</option>
              <option value={8}>8 hours before</option>
              <option value={24}>24 hours before</option>
            </select>
          </div>
        </div>

        {/* Test Alert Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Verify in-app banner, browser push delivery & sound playback
          </span>
          <button
            type="button"
            onClick={handleTestAlert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{testNotificationSent ? 'Alert Dispatched!' : 'Send Test Notification'}</span>
          </button>
        </div>
      </div>

      {/* Audio & Haptic Feedback Settings */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-500" />
          <span>Feedback & Ergonomics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-semibold block text-slate-800 dark:text-slate-200">
                  Synthesized Sound Effects
                </span>
                <span className="text-[11px] text-slate-500">
                  Chime on completion & alert tones
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-semibold block text-slate-800 dark:text-slate-200">
                  Haptic Vibration
                </span>
                <span className="text-[11px] text-slate-500">
                  Micro-haptics on mobile devices
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* Workload Distribution Analytics */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-500" />
          <span>Active Priority & Category Distribution</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority Bars */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Priority Load
            </span>
            {[
              { label: 'Urgent', count: priorityCounts.urgent, color: 'bg-rose-500' },
              { label: 'High', count: priorityCounts.high, color: 'bg-amber-500' },
              { label: 'Medium', count: priorityCounts.medium, color: 'bg-indigo-500' },
              { label: 'Low', count: priorityCounts.low, color: 'bg-slate-400' },
            ].map((p) => (
              <div key={p.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{p.label}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{p.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${p.color} transition-all duration-500`}
                    style={{
                      width: `${activeTasks.length > 0 ? (p.count / activeTasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Category Count Pills */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div
                  key={cat}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {cat}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Backup, Restore, and Reset */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-500" />
          <span>Data Management & Backup</span>
        </h3>
        <p className="text-xs text-slate-500">
          Export your tasks as a JSON file or restore sample tasks anytime.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Backup</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Tasks</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onResetSampleTasks}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Curated Sample Tasks</span>
          </button>
        </div>
        {importFeedback && (
          <p className={`text-xs font-semibold pt-1 ${importFeedback.isError ? 'text-rose-500' : 'text-emerald-500'}`}>
            {importFeedback.text}
          </p>
        )}
      </div>
    </div>
  );
};
