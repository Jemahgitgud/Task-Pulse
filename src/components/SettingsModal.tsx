import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Settings,
  Bell,
  BellRing,
  Volume2,
  Smartphone,
  RotateCcw,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Radio,
  Download,
  Upload,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { Task, UserSettings, P2PSyncStats } from '../types';
import { isEmbeddedIframe } from '../utils/pushNotifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appTitle: string;
  onUpdateAppTitle: (title: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onEnableNotifications: () => Promise<void>;
  onSendTestAlert: () => Promise<void>;
  p2pStats?: P2PSyncStats;
  syncStatus: 'synced' | 'syncing' | 'offline';
  onOpenP2PSync: () => void;
  onOpenHolidays: () => void;
  tasks: Task[];
  onImportTasks: (tasks: Task[]) => void;
  onClearCompleted: () => void;
  onResetSampleTasks: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appTitle,
  onUpdateAppTitle,
  isDark,
  onToggleTheme,
  settings,
  onUpdateSettings,
  onEnableNotifications,
  onSendTestAlert,
  p2pStats,
  syncStatus,
  onOpenP2PSync,
  onOpenHolidays,
  tasks,
  onImportTasks,
  onClearCompleted,
  onResetSampleTasks,
}) => {
  const [titleInput, setTitleInput] = useState(appTitle);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleInput(appTitle);
  }, [appTitle, isOpen]);

  if (!isOpen) return null;

  const inIframe = isEmbeddedIframe();

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onUpdateAppTitle(titleInput.trim());
      setTitleSaved(true);
      setTimeout(() => setTitleSaved(false), 2000);
    }
  };

  const handleCopyDirectUrl = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedDirectUrl(true);
      setTimeout(() => setCopiedDirectUrl(false), 2500);
    });
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed?.tasks;
        if (Array.isArray(list) && list.length > 0) {
          onImportTasks(list);
          setImportFeedback(`Imported ${list.length} tasks.`);
        } else {
          setImportFeedback('Invalid backup file format.');
        }
      } catch {
        setImportFeedback('Could not read JSON file.');
      }
      setTimeout(() => setImportFeedback(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center safe-modal-overlay bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col safe-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
          {/* 1. General & Appearance */}
          <div className="space-y-3">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
              Appearance & Workspace
            </span>

            <form onSubmit={handleSaveTitle} className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>App Title</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Jemah's TaskPulse"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
                <button
                  type="submit"
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                >
                  {titleSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {isDark ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span>Theme</span>
              </span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>

          {/* 2. Deadline Notifications & Reminders */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
              Deadline Notifications & Alerts
            </span>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Enable Deadline Reminders
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.permission === 'granted'
                    ? 'Browser push & in-app alerts are active'
                    : 'In-app alerts active · Enable browser push below'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 shrink-0"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onEnableNotifications}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                {settings.permission === 'granted' ? (
                  <>
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Push Enabled</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Push</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onSendTestAlert}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>Test Alert</span>
              </button>
            </div>

            {inIframe && settings.permission !== 'granted' && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  Open direct link in Safari/Chrome to allow OS system popups.
                </span>
                <button
                  type="button"
                  onClick={handleCopyDirectUrl}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold text-amber-900 dark:text-amber-200 shrink-0 flex items-center gap-1"
                >
                  {copiedDirectUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDirectUrl ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Remind Me Before Deadline
              </label>
              <select
                value={settings.urgentAlertHoursBefore}
                onChange={(e) =>
                  onUpdateSettings({ urgentAlertHoursBefore: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
              >
                <option value={1}>1 hour before due time</option>
                <option value={2}>2 hours before due time</option>
                <option value={4}>4 hours before due time</option>
                <option value={8}>8 hours before due time</option>
                <option value={24}>24 hours (1 day) before</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Morning Reminder
                </label>
                <input
                  type="time"
                  value={settings.morningDigestTime}
                  onChange={(e) =>
                    onUpdateSettings({ morningDigestTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Evening Summary
                </label>
                <input
                  type="time"
                  value={settings.eveningSummaryTime}
                  onChange={(e) =>
                    onUpdateSettings({ eveningSummaryTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>Sound Chimes</span>
              </span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span>Vibration Feedback</span>
              </span>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>
          </div>

          {/* 3. Device Sync & Public Holidays */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
              Sync & Holiday Calendar
            </span>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenP2PSync();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Radio className="w-4 h-4 text-indigo-500" />
                <span>Sync Across Devices (QR / Room Code)</span>
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {p2pStats && p2pStats.connectedPeersCount > 0
                  ? `${p2pStats.connectedPeersCount} Linked`
                  : syncStatus === 'synced'
                  ? 'Synced'
                  : 'Offline'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHolidays();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Malaysia Public Holidays</span>
              </span>
              <span className="text-[11px] text-slate-500">Auto-logs 60d ahead</span>
            </button>
          </div>

          {/* 4. Data Backup & Maintenance */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
              Data & Maintenance
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            {importFeedback && (
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {importFeedback}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                onClearCompleted();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Clear Completed Tasks</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onResetSampleTasks();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span className="flex items-center gap-2 font-semibold">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Restore Sample Tasks</span>
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
