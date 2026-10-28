import React, { useState, useMemo } from 'react';
import { Plus, Search, X, CheckCircle2, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskCategory } from '../types';
import {
  formatDateKey,
  getDaysDifference,
  isPastCelebrationTask,
} from '../utils/date';
import { TaskCard } from './TaskCard';

export type TaskFilter = 'upcoming' | 'close' | 'overdue' | 'today' | 'completed' | 'all';

interface DeadlineTaskListViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number, customDate?: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickAdd: (task: {
    title: string;
    project: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate: string;
    dueTime?: string;
  }) => void;
  onClearCompleted: () => void;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function compareByClosestDeadline(a: Task, b: Task): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  const dateA = `${a.dueDate}T${a.dueTime || '23:59'}`;
  const dateB = `${b.dueDate}T${b.dueTime || '23:59'}`;
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return (PRIORITY_WEIGHT[a.priority] ?? 2) - (PRIORITY_WEIGHT[b.priority] ?? 2);
}

export const DeadlineTaskListView: React.FC<DeadlineTaskListViewProps> = ({
  tasks,
  onToggleStatus,
  onDelete,
  onReschedule,
  onTogglePin,
  onEdit,
  onQuickAdd,
  onClearCompleted,
}) => {
  const today = formatDateKey();
  const [filter, setFilter] = useState<TaskFilter>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Fast inline quick-add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState(today);
  const [quickTime, setQuickTime] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');

  const handleInlineAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAdd({
      title: quickTitle.trim(),
      project: 'General',
      priority: quickPriority,
      category: 'Deadline',
      dueDate: quickDate || today,
      dueTime: quickTime || undefined,
    });
    setQuickTitle('');
    setQuickTime('');
  };

  // Compute summary counts
  const counts = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let dueSoon7d = 0;
    let completed = 0;
    let activeTotal = 0;

    const now = new Date();

    for (const t of tasks) {
      if (t.status === 'completed') {
        completed++;
        continue;
      }
      if (isPastCelebrationTask(t, today)) {
        continue;
      }
      activeTotal++;
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
      } else if (daysDiff >= 1 && daysDiff <= 7) {
        dueSoon7d++;
      }
    }

    return {
      overdue,
      dueToday,
      dueSoon7d,
      closeTotal: overdue + dueToday + dueSoon7d,
      completed,
      activeTotal,
    };
  }, [tasks, today]);

  // Filter & search tasks
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return tasks.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.project || ''} ${t.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      const isCompleted = t.status === 'completed';
      const isPastHoliday = !isCompleted && isPastCelebrationTask(t, today);
      const daysDiff = getDaysDifference(today, t.dueDate);

      let isOverdue = !isCompleted && !isPastHoliday && daysDiff < 0;
      if (!isCompleted && !isPastHoliday && daysDiff === 0 && t.dueTime) {
        const [h, m] = t.dueTime.split(':').map(Number);
        const dueMoment = new Date();
        dueMoment.setHours(h, m, 0, 0);
        if (dueMoment.getTime() < now.getTime()) {
          isOverdue = true;
        }
      }

      switch (filter) {
        case 'upcoming':
          return !isCompleted && !isPastHoliday;
        case 'close':
          return !isCompleted && !isPastHoliday && (isOverdue || daysDiff <= 7);
        case 'overdue':
          return isOverdue;
        case 'today':
          return !isCompleted && !isPastHoliday && daysDiff === 0 && !isOverdue;
        case 'completed':
          return isCompleted;
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, filter, searchQuery, today]);

  // Group tasks by deadline proximity when viewing Upcoming / Close / All
  const sections = useMemo(() => {
    if (filter === 'completed') {
      const sorted = [...filteredTasks].sort((a, b) =>
        (b.completedAt || b.dueDate).localeCompare(a.completedAt || a.dueDate)
      );
      return [{ id: 'completed', title: 'Completed', tone: 'slate', items: sorted }];
    }

    if (filter === 'overdue' || filter === 'today') {
      return [
        {
          id: filter,
          title: filter === 'overdue' ? 'Overdue' : 'Due Today',
          tone: filter === 'overdue' ? 'rose' : 'amber',
          items: [...filteredTasks].sort(compareByClosestDeadline),
        },
      ];
    }

    const now = new Date();
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const next7Days: Task[] = [];
    const later: Task[] = [];
    const settled: Task[] = [];

    for (const t of filteredTasks) {
      if (t.status === 'completed' || isPastCelebrationTask(t, today)) {
        settled.push(t);
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
        overdue.push(t);
      } else if (daysDiff === 0) {
        dueToday.push(t);
      } else if (daysDiff <= 7) {
        next7Days.push(t);
      } else {
        later.push(t);
      }
    }

    overdue.sort(compareByClosestDeadline);
    dueToday.sort(compareByClosestDeadline);
    next7Days.sort(compareByClosestDeadline);
    later.sort(compareByClosestDeadline);
    settled.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

    return [
      { id: 'overdue', title: 'Overdue', tone: 'rose', items: overdue },
      { id: 'today', title: 'Due Today', tone: 'amber', items: dueToday },
      { id: 'week', title: 'Due Within 7 Days', tone: 'indigo', items: next7Days },
      { id: 'later', title: 'Later', tone: 'slate', items: later },
      { id: 'settled', title: 'Completed & Past Holidays', tone: 'slate', items: settled },
    ].filter((sec) => sec.items.length > 0);
  }, [filteredTasks, filter, today]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Close-Deadline Summary Strip (Tap any card to filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setFilter(filter === 'overdue' ? 'upcoming' : 'overdue')}
          className={`text-left p-3 sm:p-3.5 rounded-2xl border transition active:scale-[0.99] ${
            filter === 'overdue'
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/80 hover:border-rose-300 dark:hover:border-rose-800'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Overdue
          </span>
          <span
            className={`mt-0.5 text-xl sm:text-2xl font-bold tabular-nums block ${
              counts.overdue > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {counts.overdue}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'today' ? 'upcoming' : 'today')}
          className={`text-left p-3 sm:p-3.5 rounded-2xl border transition active:scale-[0.99] ${
            filter === 'today'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-800'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Due Today
          </span>
          <span
            className={`mt-0.5 text-xl sm:text-2xl font-bold tabular-nums block ${
              counts.dueToday > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {counts.dueToday}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'close' ? 'upcoming' : 'close')}
          className={`text-left p-3 sm:p-3.5 rounded-2xl border transition active:scale-[0.99] ${
            filter === 'close'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Next 7 Days
          </span>
          <span className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100 block">
            {counts.dueSoon7d}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'completed' ? 'upcoming' : 'completed')}
          className={`text-left p-3 sm:p-3.5 rounded-2xl border transition active:scale-[0.99] ${
            filter === 'completed'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-800'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Completed
          </span>
          <span className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 block">
            {counts.completed}
          </span>
        </button>
      </div>

      {/* Fast Inline Add Task Form */}
      <form
        onSubmit={handleInlineAdd}
        className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add a task with deadline..."
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Due:</span>
            <input
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 tabular-nums"
            />
          </div>

          <input
            type="time"
            value={quickTime}
            onChange={(e) => setQuickTime(e.target.value)}
            aria-label="Due time (optional)"
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 tabular-nums"
          />

          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
            aria-label="Priority"
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </form>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {(
            [
              { id: 'upcoming', label: `Upcoming (${counts.activeTotal})` },
              { id: 'close', label: `Close Deadlines (${counts.closeTotal})` },
              { id: 'completed', label: `Completed (${counts.completed})` },
              { id: 'all', label: `All (${tasks.length})` },
            ] as { id: TaskFilter; label: string }[]
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {filter === 'completed' && counts.completed > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold whitespace-nowrap transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Deadline-Grouped Task List */}
      {sections.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {searchQuery
              ? 'No matching tasks found'
              : filter === 'completed'
              ? 'No completed tasks yet'
              : 'All clear — no open deadlines here'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchQuery
              ? 'Try another keyword or clear your search filter.'
              : 'Add a task above to track upcoming deadlines.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider ${
                    section.tone === 'rose'
                      ? 'text-rose-600 dark:text-rose-400'
                      : section.tone === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : section.tone === 'indigo'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {section.title}
                </h2>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                  {section.items.length}
                </span>
              </div>

              <div className="space-y-2">
                {section.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                    onReschedule={onReschedule}
                    onTogglePin={onTogglePin}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
