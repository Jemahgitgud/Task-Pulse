import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task } from '../types';
import { formatDateKey, getDaysDifference, isPastCelebrationTask } from '../utils/date';
import { TaskFilter } from './DeadlineTaskListView';

interface TaskProgressRingProps {
  tasks: Task[];
  activeFilter: TaskFilter;
  onSelectFilter: (filter: TaskFilter) => void;
}

type ProgressScope = 'all' | 'today' | 'week';

export const TaskProgressRing: React.FC<TaskProgressRingProps> = ({
  tasks,
  activeFilter,
  onSelectFilter,
}) => {
  const [scope, setScope] = useState<ProgressScope>('all');
  const today = formatDateKey();
  const prevPercentageRef = useRef<number | null>(null);

  // Compute metrics for different scopes
  const metrics = useMemo(() => {
    const now = new Date();

    const calculateForList = (taskList: Task[]) => {
      let total = 0;
      let completed = 0;
      let overdue = 0;
      let dueToday = 0;

      for (const t of taskList) {
        if (isPastCelebrationTask(t, today)) continue;

        total++;
        if (t.status === 'completed') {
          completed++;
          continue;
        }

        const daysDiff = getDaysDifference(today, t.dueDate);
        let isTaskOverdue = daysDiff < 0;
        if (daysDiff === 0 && t.dueTime) {
          const [h, m] = t.dueTime.split(':').map(Number);
          const dueMoment = new Date();
          dueMoment.setHours(h, m, 0, 0);
          if (dueMoment.getTime() < now.getTime()) {
            isTaskOverdue = true;
          }
        }

        if (isTaskOverdue) {
          overdue++;
        } else if (daysDiff === 0) {
          dueToday++;
        }
      }

      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      const remaining = total - completed;

      return { total, completed, remaining, overdue, dueToday, percentage };
    };

    // Filter tasks based on scope
    const scopedTasks = tasks.filter((t) => {
      if (isPastCelebrationTask(t, today)) return false;
      if (scope === 'all') return true;

      const daysDiff = getDaysDifference(today, t.dueDate);
      if (scope === 'today') {
        return daysDiff === 0;
      }
      if (scope === 'week') {
        return daysDiff >= 0 && daysDiff <= 7;
      }
      return true;
    });

    return calculateForList(scopedTasks);
  }, [tasks, scope, today]);

  const { total, completed, remaining, overdue, dueToday, percentage } = metrics;

  // Trigger celebration confetti when hitting 100% completion
  useEffect(() => {
    if (prevPercentageRef.current !== null && prevPercentageRef.current < 100 && percentage === 100 && total > 0) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}
    }
    prevPercentageRef.current = percentage;
  }, [percentage, total]);

  // SVG ring parameters
  const radius = 48;
  const strokeWidth = 8.5;
  const circumference = 2 * Math.PI * radius; // ~301.59
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color theme according to progress state
  const isComplete = percentage === 100 && total > 0;
  const hasOverdue = overdue > 0;

  const gradientId = useMemo(() => `progress-gradient-${scope}`, [scope]);

  return (
    <div className="p-3.5 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-6">
        {/* Dynamic SVG Circular Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            className="w-28 h-28 sm:w-32 sm:h-32 -rotate-90 transform drop-shadow-xs"
            viewBox="0 0 120 120"
            aria-label={`Task progress: ${percentage}% completed (${completed} of ${total} tasks)`}
            role="img"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                {isComplete ? (
                  <>
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </>
                ) : hasOverdue ? (
                  <>
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </>
                )}
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="text-slate-100 dark:text-slate-800/80"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />

            {/* Foreground Dynamic Animated Ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
              }}
            />
          </svg>

          {/* Centered Percentage & Count Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-2xl sm:text-3xl font-extrabold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white">
              {percentage}%
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {completed}/{total} Done
            </span>
          </div>
        </div>

        {/* Informational & Interactive Controls Panel */}
        <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
          {/* Top row: Headline & Scope Switcher */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {isComplete
                    ? 'All Tasks Completed'
                    : percentage >= 75
                    ? 'Almost At The Finish Line'
                    : percentage >= 40
                    ? 'Steady Progress'
                    : total === 0
                    ? 'No Tasks Scheduled'
                    : 'Tasks In Progress'}
                </h3>
                {isComplete && (
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isComplete
                  ? 'All scheduled deadlines are finished. Excellent momentum!'
                  : total === 0
                  ? 'Add your first task to begin tracking deadlines.'
                  : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} remaining · ${
                      overdue > 0 ? `${overdue} overdue` : 'all deadlines on schedule'
                    }`}
              </p>
            </div>

            {/* Scope Selector: All Tasks / Today / Next 7 Days */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/70 rounded-xl shrink-0 self-stretch xs:self-auto justify-center">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  scope === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All Tasks
              </button>
              <button
                type="button"
                onClick={() => setScope('today')}
                className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  scope === 'today'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setScope('week')}
                className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  scope === 'week'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Next 7d
              </button>
            </div>
          </div>

          {/* Interactive Metric Breakdown Strips */}
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Completed */}
            <button
              type="button"
              onClick={() => onSelectFilter('completed')}
              className={`p-2 rounded-xl text-left transition active:scale-95 ${
                activeFilter === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-950/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Completed
              </span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {completed}
              </span>
            </button>

            {/* In Progress / Remaining */}
            <button
              type="button"
              onClick={() => onSelectFilter('upcoming')}
              className={`p-2 rounded-xl text-left transition active:scale-95 ${
                activeFilter === 'upcoming'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-950/50 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Remaining
              </span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-indigo-600 dark:text-indigo-400 block mt-0.5">
                {remaining}
              </span>
            </button>

            {/* Due Today */}
            <button
              type="button"
              onClick={() => onSelectFilter('today')}
              className={`p-2 rounded-xl text-left transition active:scale-95 ${
                activeFilter === 'today'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-950/50 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Due Today
              </span>
              <span
                className={`text-base sm:text-lg font-bold tabular-nums block mt-0.5 ${
                  dueToday > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {dueToday}
              </span>
            </button>

            {/* Overdue */}
            <button
              type="button"
              onClick={() => onSelectFilter('overdue')}
              className={`p-2 rounded-xl text-left transition active:scale-95 ${
                activeFilter === 'overdue'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-950/50 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Overdue
              </span>
              <span
                className={`text-base sm:text-lg font-bold tabular-nums block mt-0.5 ${
                  overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {overdue}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
