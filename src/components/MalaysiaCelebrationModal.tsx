import React from 'react';
import { X, Calendar, Plus, Clock, Bell, Edit3 } from 'lucide-react';
import { MalaysiaHoliday } from '../utils/malaysiaHolidays';
import { formatDisplayDate, calculatePrepDeadline } from '../utils/date';

interface MalaysiaCelebrationModalProps {
  holiday: MalaysiaHoliday | null;
  onClose: () => void;
  onScheduleTask: (holiday: MalaysiaHoliday) => void;
  onOpenQuickAddWithHoliday?: (holiday: MalaysiaHoliday) => void;
}

export const MalaysiaCelebrationModal: React.FC<MalaysiaCelebrationModalProps> = ({
  holiday,
  onClose,
  onScheduleTask,
  onOpenQuickAddWithHoliday,
}) => {
  if (!holiday) return null;

  const prepDeadline = calculatePrepDeadline(holiday.date, 7);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center safe-modal-overlay bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col safe-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 bg-slate-900 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold mb-1">
            <span>{holiday.isPublicHoliday ? 'Public Holiday' : 'Observance'}</span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight pr-8">
            {holiday.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Holiday Date: {holiday.dayName}, {formatDisplayDate(holiday.date)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>7-Day Advance Deadline</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Task Due Date
              </span>
              <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                {prepDeadline}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 leading-relaxed">
              <Bell className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                Sends a reminder 7 days before the holiday so you can wrap up close deadlines early.
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              About
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {holiday.description || 'Malaysia calendar holiday and observance.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[38px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Close
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onOpenQuickAddWithHoliday && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAddWithHoliday(holiday);
                    onClose();
                  }}
                  className="min-h-[38px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onScheduleTask(holiday);
                  onClose();
                }}
                className="w-full sm:w-auto min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reminder</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
