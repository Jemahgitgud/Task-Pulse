import React from 'react';
import {
  Activity,
  Plus,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  CloudCheck,
  CloudUpload,
  Settings,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  appTitle: string;
  isDark: boolean;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  phoneMode: boolean;
  onTogglePhoneMode: () => void;
  syncStatus: 'synced' | 'syncing' | 'local';
  urgentCount: number;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenAIBriefing: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appTitle,
  isDark,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  phoneMode,
  onTogglePhoneMode,
  syncStatus,
  urgentCount,
  onOpenQuickAdd,
  onOpenSettings,
  onOpenAIBriefing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-150">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand & Live Pulse */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {appTitle}
              </h1>
              {urgentCount > 0 && (
                <span
                  title={`${urgentCount} urgent or overdue items`}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0 shadow-xs"
                >
                  {urgentCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              {/* Sync Status Badge */}
              <span className="inline-flex items-center gap-1">
                {syncStatus === 'synced' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Cloud Ready</span>
                  </>
                ) : syncStatus === 'syncing' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Offline Stored</span>
                  </>
                )}
              </span>

              <span>•</span>

              <button
                type="button"
                onClick={onOpenAIBriefing}
                className="hidden sm:inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Daily Briefing</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Phone Frame Toggle (Desktop only) */}
          <button
            type="button"
            onClick={onTogglePhoneMode}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
              phoneMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={phoneMode ? 'Switch to Wide layout' : 'Preview mobile phone frame'}
          >
            {phoneMode ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Wide</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone View</span>
              </>
            )}
          </button>

          {/* Sound Mute / Unmute */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title="Settings & Alerts configuration"
            aria-label="Settings & Alerts configuration"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Rapid Add Task Button */}
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95"
            title="Add new task (Hotkey: N)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
            <span className="hidden lg:inline text-[10px] opacity-75 font-mono px-1 rounded bg-indigo-700/60 ml-0.5">
              N
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
