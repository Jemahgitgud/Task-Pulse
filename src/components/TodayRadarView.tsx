import React, { useState } from 'react';
import {
  Sparkles,
  AlertOctagon,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Send,
  Zap,
} from 'lucide-react';
import { Task, TaskPriority, TaskCategory } from '../types';
import { formatDateKey, formatDisplayDate, isPastCelebrationTask } from '../utils/date';
import { TaskCard } from './TaskCard';
import { getMalaysianHolidays, MalaysiaHoliday } from '../utils/malaysiaHolidays';

interface TodayRadarViewProps {
  tasks: Task[];
  lastAddedTaskId: string | null;
  onToggleStatus: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
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
  onOpenFullAddModal: () => void;
  onOpenAIBriefing: () => void;
}

export const TodayRadarView: React.FC<TodayRadarViewProps> = ({
  tasks,
  lastAddedTaskId,
  onToggleStatus,
  onToggleSubtask,
  onDelete,
  onReschedule,
  onTogglePin,
  onEdit,
  onQuickAdd,
  onOpenFullAddModal,
  onOpenAIBriefing,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey());
  const today = formatDateKey();

  // Rapid capture state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickProject, setQuickProject] = useState('General');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Work');
  const [quickDueDateOffset, setQuickDueDateOffset] = useState<number>(0);
  const [quickDueTime, setQuickDueTime] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Compute stats for today (leave passed Persediaan Sambutan tasks untouched & out of overdue)
  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && !isPastCelebrationTask(t, today)
  );
  const overdueTasks = activeTasks.filter((t) => t.dueDate < today);
  const dueTodayTasks = activeTasks.filter((t) => t.dueDate === today);
  const completedTodayTasks = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt?.startsWith(today)
  );

  const totalTodayPool = dueTodayTasks.length + completedTodayTasks.length + overdueTasks.length;
  const completionPercentage =
    totalTodayPool > 0
      ? Math.round((completedTodayTasks.length / totalTodayPool) * 100)
      : 100;

  // Selected date tasks
  const selectedDateTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const selectedActive = selectedDateTasks.filter(
    (t) => t.status !== 'completed' && !isPastCelebrationTask(t, today)
  );
  const selectedCompleted = selectedDateTasks.filter(
    (t) => t.status === 'completed' || isPastCelebrationTask(t, today)
  );

  // Pinned / Urgent tasks for today
  const pinnedOrUrgentToday = dueTodayTasks.filter(
    (t) => t.pinned || t.priority === 'urgent'
  );

  // Malaysian celebration on selected date
  const selectedYear = parseInt(selectedDate.split('-')[0], 10) || new Date().getFullYear();
  const activeHolidays = getMalaysianHolidays(selectedYear).filter((h) => h.date === selectedDate);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + quickDueDateOffset);
    const dueDate = formatDateKey(targetDate);

    onQuickAdd({
      title: quickTitle.trim(),
      project: quickProject.trim() || 'General',
      priority: quickPriority,
      category: quickCategory,
      dueDate,
      dueTime: quickDueTime || undefined,
    });

    setQuickTitle('');
    setQuickDueTime('');
    setQuickDueDateOffset(0);
  };

  const jumpDay = (offset: number) => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + offset);
    setSelectedDate(formatDateKey(current));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Navigation & Streak Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => jumpDay(-1)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {formatDisplayDate(selectedDate)}
              </h2>
              {selectedDate === today && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  Today
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedActive.length} active · {selectedCompleted.length} done
            </p>
          </div>

          <button
            type="button"
            onClick={() => jumpDay(1)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {selectedDate !== today && (
          <button
            type="button"
            onClick={() => setSelectedDate(today)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Jump to Today
          </button>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-900/60 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
          <span>Daily Pulse Active</span>
        </div>
      </div>

      {/* Malaysian Celebration Banner if active */}
      {activeHolidays.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-amber-300/80 dark:border-amber-800/60 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeHolidays[0].icon || '🇲🇾'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Acara Hari Ini: {activeHolidays[0].name}
                </span>
                {activeHolidays[0].isPublicHoliday && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                    Cuti Umum
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {activeHolidays[0].description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Progress Digest Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-5 sm:p-6 shadow-xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Headline and Narrative */}
            <div className="space-y-1.5 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-white/10 text-indigo-200 backdrop-blur-md">
                  Daily Progress Digest
                </span>
                {overdueTasks.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500 text-white animate-pulse">
                    {overdueTasks.length} Overdue
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''} Need Attention`
                  : dueTodayTasks.length > 0
                  ? `${dueTodayTasks.length} Task${dueTodayTasks.length > 1 ? 's' : ''} Scheduled for Today`
                  : completedTodayTasks.length > 0
                  ? 'All Set for Today! Outstanding Velocity 🎉'
                  : 'Clear Horizon! Ready for New Priorities ✨'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {overdueTasks.length > 0
                  ? 'Clear overdue deliverables before starting afternoon blocks to preserve milestone velocity.'
                  : dueTodayTasks.length > 0
                  ? `You have cleared ${completedTodayTasks.length} of ${totalTodayPool} daily commitments. Steady progress wraps everything up on time.`
                  : 'No pending deadlines right now. Perfect window to plan ahead or tackle deep work.'}
              </p>
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex items-center gap-4 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-700 ease-out"
                    strokeDasharray={`${completionPercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base sm:text-lg font-extrabold text-white">
                    {completionPercentage}%
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{completedTodayTasks.length} Done Today</span>
                </div>
                <div className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{dueTodayTasks.length} Due Today</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAIBriefing}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-white transition"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Briefing</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rapid Task Capture Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-sm">
        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onFocus={() => setIsCapturing(true)}
                placeholder="Rapid capture: Type new job title or task..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 transition active:scale-90"
                title="Save task"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenFullAddModal}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold shrink-0 transition"
              title="Open full task creator modal"
            >
              <ListPlus className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">+ Full Details</span>
            </button>
          </div>

          {/* Quick Selectors (Priority, Category, Offset, Time) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Priority Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickPriority(p)}
                  className={`px-2 py-0.5 rounded-lg capitalize font-medium transition ${
                    quickPriority === p
                      ? p === 'urgent'
                        ? 'bg-rose-600 text-white'
                        : p === 'high'
                        ? 'bg-amber-600 text-white'
                        : p === 'medium'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Quick Date Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { offset: 0, label: 'Today' },
                { offset: 1, label: '+1d' },
                { offset: 3, label: '+3d' },
              ].map((d) => (
                <button
                  key={d.offset}
                  type="button"
                  onClick={() => setQuickDueDateOffset(d.offset)}
                  className={`px-2 py-0.5 rounded-lg font-medium transition ${
                    quickDueDateOffset === d.offset
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
              className="py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Work">Work</option>
              <option value="Meeting">Meeting</option>
              <option value="Review">Review</option>
              <option value="Deadline">Deadline</option>
              <option value="Personal">Personal</option>
            </select>

            {/* Time Picker */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="time"
                value={quickDueTime}
                onChange={(e) => setQuickDueTime(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Overdue Section (if viewing today and has overdue tasks) */}
      {selectedDate === today && overdueTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 animate-bounce" />
              <span>Overdue Actions ({overdueTasks.length})</span>
            </div>
            <span className="text-xs text-slate-500">Requires resolution</span>
          </div>

          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onToggleSubtask={onToggleSubtask}
                onDelete={onDelete}
                onReschedule={onReschedule}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Focus & Urgent Deliverables */}
      {selectedDate === today && pinnedOrUrgentToday.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-current" />
            <span>Top Priorities & Pinned Focus</span>
          </div>

          <div className="space-y-2">
            {pinnedOrUrgentToday.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onToggleSubtask={onToggleSubtask}
                onDelete={onDelete}
                onReschedule={onReschedule}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Tasks for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Scheduled for {selectedDate === today ? 'Today' : selectedDate}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {selectedActive.length} active
            </span>
          </h3>
        </div>

        {selectedActive.length === 0 && selectedCompleted.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No tasks scheduled for this day
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Enjoy the clear schedule or use rapid capture above to schedule upcoming deliverables.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedActive.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onToggleSubtask={onToggleSubtask}
                onDelete={onDelete}
                onReschedule={onReschedule}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}

        {/* Completed Section */}
        {selectedCompleted.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed ({selectedCompleted.length})</span>
            </h4>
            <div className="space-y-2">
              {selectedCompleted.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onToggleSubtask={onToggleSubtask}
                  onDelete={onDelete}
                  onReschedule={onReschedule}
                  onTogglePin={onTogglePin}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
