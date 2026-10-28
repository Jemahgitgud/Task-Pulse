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
  Radio,
  Wifi,
} from 'lucide-react';
import { P2PSyncStats } from '../types';

interface HeaderProps {
  appTitle: string;
  isDark: boolean;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  phoneMode: boolean;
  onTogglePhoneMode: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  connectedDevices: number;
  urgentCount: number;
  p2pStats?: P2PSyncStats;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenAIBriefing: () => void;
  onOpenP2PSync?: () => void;
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
  connectedDevices,
  urgentCount,
  p2pStats,
  onOpenQuickAdd,
  onOpenSettings,
  onOpenAIBriefing,
  onOpenP2PSync,
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[110px] min-[380px]:max-w-[160px] sm:max-w-none">
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
              {/* Multi-Device WebRTC P2P Direct Status */}
              {onOpenP2PSync && p2pStats ? (
                <button
                  type="button"
                  onClick={onOpenP2PSync}
                  className="inline-flex items-center gap-1 font-medium hover:underline text-left cursor-pointer group"
                  title="Direct browser-to-browser P2P WebRTC data sync without cloud database"
                >
                  {p2pStats.state === 'connected' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        P2P ({p2pStats.connectedPeersCount} {p2pStats.connectedPeersCount === 1 ? 'Peer' : 'Peers'}
                        {p2pStats.pingMs !== undefined ? ` • ${p2pStats.pingMs}ms` : ''})
                      </span>
                    </>
                  ) : p2pStats.state === 'connecting' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span className="text-amber-600 dark:text-amber-400">P2P Pairing...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="text-slate-500">P2P Sync</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium">
                  {syncStatus === 'synced' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {connectedDevices > 1 ? `Synced (${connectedDevices} devices)` : 'Synced'}
                      </span>
                    </>
                  ) : syncStatus === 'syncing' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Offline (Local)</span>
                    </>
                  )}
                </span>
              )}

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
          {/* P2P Direct Pair Action Button */}
          {onOpenP2PSync && (
            <button
              type="button"
              onClick={onOpenP2PSync}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                p2pStats?.state === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              }`}
              title="Pair Phone & Laptop via WebRTC (No Firebase)"
            >
              <Radio className={`w-3.5 h-3.5 ${p2pStats?.state === 'connected' ? 'text-emerald-500' : 'text-indigo-500'}`} />
              <span className="hidden min-[420px]:inline">
                {p2pStats?.state === 'connected' ? 'P2P Linked' : 'P2P Sync'}
              </span>
            </button>
          )}

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
