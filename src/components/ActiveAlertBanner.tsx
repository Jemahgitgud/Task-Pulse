import React from 'react';
import { AlertTriangle, BellRing, CheckCircle, X, CalendarPlus, Clock } from 'lucide-react';
import { TaskAlert } from '../types';

interface ActiveAlertBannerProps {
  alert: TaskAlert | null;
  onDismiss: () => void;
  onCompleteTask: (taskId: string) => void;
  onRescheduleTask: (taskId: string, days: number) => void;
  notificationPermission: NotificationPermission | 'default';
  onRequestPermission: () => void;
}

export const ActiveAlertBanner: React.FC<ActiveAlertBannerProps> = ({
  alert,
  onDismiss,
  onCompleteTask,
  onRescheduleTask,
  notificationPermission,
  onRequestPermission,
}) => {
  if (!alert) return null;

  const isCritical = alert.urgency === 'critical';
  const isInfo = alert.urgency === 'info';
  const isSyntheticAlert = alert.taskId === 'test-alert' || alert.taskId === 'digest-alert';

  return (
    <div className="mb-4">
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-lg transition-all animate-slide-up ${
          isCritical
            ? 'bg-rose-500/10 border-rose-300 dark:border-rose-900/80 text-rose-950 dark:text-rose-100'
            : isInfo
            ? 'bg-indigo-500/10 border-indigo-300 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-100'
            : 'bg-amber-500/10 border-amber-300 dark:border-amber-900/80 text-amber-950 dark:text-amber-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                isCritical
                  ? 'bg-rose-600 text-white'
                  : isInfo
                  ? 'bg-indigo-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {isInfo ? (
                <BellRing className="w-4 h-4 animate-bounce" />
              ) : (
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold truncate">{alert.title}</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  {alert.urgency}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{alert.message}</p>

              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!isSyntheticAlert ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteTask(alert.taskId);
                        onDismiss();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onRescheduleTask(alert.taskId, 1);
                        onDismiss();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Reschedule +1d</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Got It</span>
                  </button>
                )}

                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={onRequestPermission}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Enable Browser Push</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
