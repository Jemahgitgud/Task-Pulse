import React from 'react';
import { Target, Layers, CalendarDays, BellRing } from 'lucide-react';

export type TabKey = 'radar' | 'worklist' | 'deadlines' | 'digest';

interface NavigationTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  urgentCount: number;
  totalActive: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  urgentCount,
  totalActive,
}) => {
  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      key: 'radar',
      label: "Today's Radar",
      icon: Target,
      badge: urgentCount > 0 ? urgentCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      key: 'worklist',
      label: 'All Worklists',
      icon: Layers,
      badge: totalActive > 0 ? totalActive : undefined,
      badgeColor: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    {
      key: 'deadlines',
      label: 'Deadlines Calendar',
      icon: CalendarDays,
    },
    {
      key: 'digest',
      label: 'Daily Digest & Alerts',
      icon: BellRing,
    },
  ];

  return (
    <div className="w-full">
      {/* Desktop & Tablet Segmented Pill Tabs */}
      <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                    tab.badgeColor || 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Floating Bottom Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 px-2 py-1 shadow-2xl">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`flex flex-col items-center justify-center min-h-[48px] px-2 py-1 relative transition active:scale-90 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 px-1 text-[9px] font-bold rounded-full bg-rose-500 text-white min-w-[14px] text-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[68px]">
                  {tab.key === 'radar'
                    ? 'Today'
                    : tab.key === 'worklist'
                    ? 'Worklist'
                    : tab.key === 'deadlines'
                    ? 'Deadlines'
                    : 'Digest'}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
