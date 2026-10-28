import React, { useState } from 'react';
import {
  Check,
  Pin,
  MoreVertical,
  Trash2,
  Edit2,
  CalendarPlus,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Task, TaskPriority } from '../types';
import {
  formatDisplayDate,
  formatTime12h,
  getRelativeDeadlineLabel,
  isPastCelebrationTask,
} from '../utils/date';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number, customDate?: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
}

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; dot: string; text: string }
> = {
  urgent: {
    label: 'Urgent',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400 font-semibold',
  },
  high: {
    label: 'High',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400 font-medium',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-indigo-500',
    text: 'text-slate-600 dark:text-slate-300',
  },
  low: {
    label: 'Low',
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onDelete,
  onReschedule,
  onTogglePin,
  onEdit,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const isCompleted = task.status === 'completed';
  const isPastHoliday = !isCompleted && isPastCelebrationTask(task);
  const isSettled = isCompleted || isPastHoliday;
  const priorityInfo = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const deadlineInfo = getRelativeDeadlineLabel(task.dueDate, task.dueTime);

  const renderDeadlineReadout = () => {
    if (isCompleted) {
      return (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
          Completed
        </span>
      );
    }

    if (isPastHoliday) {
      return (
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
          Past Holiday
        </span>
      );
    }

    if (deadlineInfo.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{deadlineInfo.label}</span>
        </span>
      );
    }

    if (deadlineInfo.isToday || deadlineInfo.daysLeft <= 3) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{deadlineInfo.label}</span>
        </span>
      );
    }

    return (
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
        {deadlineInfo.label}
      </span>
    );
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-colors duration-150 ${
        isSettled
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/60 opacity-75'
          : deadlineInfo.isOverdue
          ? 'bg-white dark:bg-slate-900/95 border-rose-300/80 dark:border-rose-900/70'
          : deadlineInfo.isToday
          ? 'bg-white dark:bg-slate-900/95 border-amber-300/80 dark:border-amber-900/60'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-start gap-2.5 sm:gap-3">
        {/* 44px Touch Target Checkbox */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id)}
          className="w-10 h-10 -ml-1.5 -my-1 flex items-center justify-center shrink-0 rounded-xl focus:outline-hidden active:scale-95"
          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-950'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
        </button>

        {/* Task Content & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              {task.pinned && !isCompleted && (
                <Pin
                  className="w-3.5 h-3.5 text-indigo-500 fill-current rotate-45 shrink-0"
                  aria-label="Pinned"
                />
              )}
              <h4
                onClick={() => onToggleStatus(task.id)}
                className={`text-sm sm:text-[15px] font-semibold cursor-pointer select-none leading-snug break-words ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {task.title}
              </h4>
            </div>

            {/* Desktop Right-Aligned Deadline Proximity */}
            <div className="hidden sm:flex items-center shrink-0 pt-0.5">
              {renderDeadlineReadout()}
            </div>
          </div>

          {task.description && (
            <p
              className={`text-xs mt-0.5 line-clamp-1 ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Clean Unboxed Metadata Line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {/* Mobile Deadline Proximity First so Close Deadlines Stand Out */}
            <span className="sm:hidden inline-flex items-center mr-1">
              {renderDeadlineReadout()}
            </span>
            <span className="sm:hidden text-slate-300 dark:text-slate-700">·</span>

            <span className={`inline-flex items-center gap-1.5 ${priorityInfo.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
              <span>{priorityInfo.label}</span>
            </span>

            {task.project && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="truncate max-w-[130px]">{task.project}</span>
              </>
            )}

            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="tabular-nums">
              Due {formatDisplayDate(task.dueDate)}
              {task.dueTime ? ` at ${formatTime12h(task.dueTime)}` : ''}
            </span>

            {task.eventDate && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="tabular-nums text-amber-700 dark:text-amber-400">
                  Holiday: {task.eventDate}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 44px Action Menu Trigger */}
        <div className="relative shrink-0 -mr-1.5 -my-1">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Task options"
            aria-label="Task options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-1 top-10 z-30 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Edit Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onTogglePin(task.id);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Pin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{task.pinned ? 'Unpin Task' : 'Pin to Top'}</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReschedule(task.id, 1);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Move +1 Day</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReschedule(task.id, 3);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Move +3 Days</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task.id);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
