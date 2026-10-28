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
    <div className="w-full max-w-5xl mx-auto safe-x pt-2 pb-1">
      <div
        className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-xl backdrop-blur-xl transition-all animate-slide-up ${
          isCritical
            ? 'bg-rose-50/95 dark:bg-rose-950/95 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
            : isInfo
            ? 'bg-indigo-50/95 dark:bg-indigo-950/95 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
            : 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
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

            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold leading-snug break-words">
                  {alert.title}
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 shrink-0">
                  {alert.urgency}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90 leading-relaxed break-words">
                {alert.message}
              </p>

              {/* Quick Actions */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {!isSyntheticAlert ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteTask(alert.taskId);
                        onDismiss();
                      }}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
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
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Reschedule +1d</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Got It</span>
                  </button>
                )}

                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={onRequestPermission}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition active:scale-95"
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
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
            title="Dismiss alert"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
