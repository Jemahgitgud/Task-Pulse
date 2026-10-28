import React, { useState } from 'react';
import {
  X,
  Settings,
  Bell,
  Volume2,
  Smartphone,
  RotateCcw,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appTitle: string;
  onUpdateAppTitle: (title: string) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClearCompleted: () => void;
  onResetSampleTasks: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appTitle,
  onUpdateAppTitle,
  settings,
  onUpdateSettings,
  onClearCompleted,
  onResetSampleTasks,
}) => {
  const [titleInput, setTitleInput] = useState(appTitle);

  if (!isOpen) return null;

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onUpdateAppTitle(titleInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              TaskPulse Preferences
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* App Title Customization */}
          <form onSubmit={handleSaveTitle} className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Workspace / App Title</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Jemah's TaskPulse"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                Save
              </button>
            </div>
          </form>

          {/* Sound & Haptic */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Feedback & Audio
            </span>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>Task Complete & Alert Chimes</span>
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
                <span>Haptic Vibration Feedback</span>
              </span>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>
          </div>

          {/* Clean up & Reset */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Maintenance
            </span>

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
                <span>Clear All Completed Deliverables</span>
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
                <span>Restore Curated Sample Worklists</span>
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
