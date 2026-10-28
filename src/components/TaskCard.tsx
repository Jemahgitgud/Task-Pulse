import React, { useState } from 'react';
import {
  Check,
  Clock,
  Calendar,
  AlertCircle,
  Pin,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Edit2,
  CalendarPlus,
  Tag,
  ListCheck,
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
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number, customDate?: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
  isCompact?: boolean;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800/80',
    dot: 'bg-rose-500',
  },
  high: {
    label: 'High',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800/80',
    dot: 'bg-amber-500',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    dot: 'bg-indigo-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700/60',
    dot: 'bg-slate-400',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onToggleSubtask,
  onDelete,
  onReschedule,
  onTogglePin,
  onEdit,
  isCompact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCompleted = task.status === 'completed';
  const isPastSambutan = !isCompleted && isPastCelebrationTask(task);
  const isSettled = isCompleted || isPastSambutan;
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const deadlineInfo = getRelativeDeadlineLabel(task.dueDate, task.dueTime);

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isSettled
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-75'
          : task.pinned
          ? 'bg-white dark:bg-slate-900/90 border-indigo-300/80 dark:border-indigo-700/60 shadow-md shadow-indigo-500/5'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className={`p-3.5 sm:p-4 ${isCompact ? 'py-3' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Completion Checkbox */}
          <button
            type="button"
            onClick={() => onToggleStatus(task.id)}
            className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-150 active:scale-90 ${
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-950/60'
            }`}
            title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Main Task Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                onClick={() => onToggleStatus(task.id)}
                className={`text-sm sm:text-base font-semibold cursor-pointer select-none leading-snug transition-colors ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {task.title}
              </h4>

              {/* Pin indicator */}
              {task.pinned && !isCompleted && (
                <span
                  title="Pinned to top"
                  className="shrink-0 p-1 text-indigo-600 dark:text-indigo-400"
                >
                  <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
                </span>
              )}
            </div>

            {/* Description (if exists) */}
            {task.description && !isCompact && (
              <p
                className={`text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed ${
                  isCompleted
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Tags, Project, Deadline, and Badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              {/* Important Date / Celebration Badge */}
              {(task.isImportantDate || task.eventDate) && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-xs">
                  <span className="text-xs">🇲🇾</span>
                  <span>{task.eventName || 'Tarikh Penting'}</span>
                  {task.eventDate && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      (Acara: {task.eventDate})
                    </span>
                  )}
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                    T-7 Dateline
                  </span>
                </span>
              )}

              {/* Project Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/60">
                <Tag className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[110px]">{task.project}</span>
              </span>

              {/* Priority Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                <span>{priorityInfo.label}</span>
              </span>

              {/* Category */}
              <span className="px-2 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-medium">
                {task.category}
              </span>

              {/* Deadline Badge */}
              {isPastSambutan ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Sambutan Berlalu</span>
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60">
                  <Check className="w-3 h-3 shrink-0" />
                  <span>{formatDisplayDate(task.dueDate)}</span>
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
                    deadlineInfo.isOverdue
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 font-semibold'
                      : deadlineInfo.isToday
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {deadlineInfo.isOverdue ? (
                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                  ) : (
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span>{deadlineInfo.label}</span>
                </span>
              )}

              {/* Time display if scheduled */}
              {task.dueTime && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime12h(task.dueTime)}</span>
                </span>
              )}

              {/* Subtasks Count Button */}
              {totalSubtasks > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition ${
                    completedSubtasks === totalSubtasks
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                  }`}
                >
                  <ListCheck className="w-3 h-3" />
                  <span>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                  {expanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {/* Subtasks Checklist Drawer */}
            {expanded && totalSubtasks > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                {task.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer select-none transition"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => onToggleSubtask(task.id, st.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                    />
                    <span
                      className={`text-xs sm:text-sm leading-tight ${
                        st.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Menu Trigger */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Pin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{task.pinned ? 'Unpin Task' : 'Pin to Top'}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Quick Reschedule
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReschedule(task.id, 1);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>+1 Day (Tomorrow)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReschedule(task.id, 3);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>+3 Days</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
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
    </div>
  );
};
