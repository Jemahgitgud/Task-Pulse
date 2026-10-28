import React from 'react';
import { Calendar, Plus, Settings, CheckSquare, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  appTitle: string;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenHolidays: () => void;
  notificationPermission?: NotificationPermission | 'default';
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appTitle,
  onOpenQuickAdd,
  onOpenSettings,
  onOpenHolidays,
  notificationPermission = 'default',
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="w-full backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-150">
      <div className="max-w-4xl mx-auto safe-header-top pb-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h1 className="text-[15px] sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {appTitle}
            </h1>
          </div>

          {/* Single-Row Action Bar (44px mobile touch targets) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Theme Toggle (Sun / Moon) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center justify-center min-h-[42px] min-w-[42px] p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenHolidays}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition whitespace-nowrap active:scale-95"
              title="Malaysia Public Holidays"
              aria-label="Holidays"
            >
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="hidden xs:inline sm:inline">Holidays</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="relative inline-flex items-center justify-center gap-1.5 min-h-[42px] min-w-[42px] px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition whitespace-nowrap active:scale-95"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
              {notificationPermission !== 'granted' && (
                <span
                  className="absolute top-2 right-2 sm:static sm:w-1.5 sm:h-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0"
                  title="Browser push notifications not enabled yet"
                />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 sm:px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap active:scale-95"
              title="Add new task (Shortcut: N)"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
