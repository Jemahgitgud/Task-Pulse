import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { Task } from '../types';
import { formatDateKey, formatDisplayDate } from '../utils/date';
import { TaskCard } from './TaskCard';

interface DeadlinesCalendarViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number, customDate?: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
  onOpenQuickAdd: () => void;
}

export const DeadlinesCalendarView: React.FC<DeadlinesCalendarViewProps> = ({
  tasks,
  onToggleStatus,
  onToggleSubtask,
  onDelete,
  onReschedule,
  onTogglePin,
  onEdit,
  onOpenQuickAdd,
}) => {
  const today = formatDateKey();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Generate 14 days around the current week offset
  const dateStrip = useMemo(() => {
    const list: Array<{
      dateKey: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
      activeCount: number;
      urgentCount: number;
      overdueCount: number;
      completedCount: number;
    }> = [];

    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);

    // Show 7 days starting from Monday of that week
    const currentDay = base.getDay();
    const diffToMonday = base.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(base.setDate(diffToMonday));

    for (let i = 0; i < 14; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = formatDateKey(d);

      const dayTasks = tasks.filter((t) => t.dueDate === key);
      const active = dayTasks.filter((t) => t.status !== 'completed');
      const urgent = active.filter((t) => t.priority === 'urgent');
      const completed = dayTasks.filter((t) => t.status === 'completed');
      const isOverdue = key < today && active.length > 0;

      list.push({
        dateKey: key,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: key === today,
        activeCount: active.length,
        urgentCount: urgent.length,
        overdueCount: isOverdue ? active.length : 0,
        completedCount: completed.length,
      });
    }

    return list;
  }, [tasks, weekOffset, today]);

  // Tasks for selected date
  const scheduledTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate === selectedDate)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        return a.priority === 'urgent' ? -1 : 1;
      });
  }, [tasks, selectedDate]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Header & Controls */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Deliverables Timeline
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Previous 2 Weeks"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                setSelectedDate(today);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Next 2 Weeks"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Date Picker Strip */}
        <div className="overflow-x-auto no-scrollbar pb-1 pt-1">
          <div className="flex items-center gap-2 min-w-max">
            {dateStrip.map((item) => {
              const isSelected = item.dateKey === selectedDate;
              return (
                <button
                  key={item.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(item.dateKey)}
                  className={`flex flex-col items-center justify-between w-14 py-2.5 px-1 rounded-2xl border transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : item.isToday
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isSelected
                        ? 'text-indigo-200'
                        : item.isToday
                        ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.dayName}
                  </span>

                  <span
                    className={`text-base font-extrabold my-0.5 ${
                      isSelected ? 'text-white' : item.isToday ? 'text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                  >
                    {item.dayNumber}
                  </span>

                  {/* Status Indicator Dots */}
                  <div className="flex items-center gap-1 h-2">
                    {item.overdueCount > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Overdue task" />
                    ) : item.urgentCount > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Urgent deadline" />
                    ) : item.activeCount > 0 ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-indigo-200' : 'bg-indigo-500'
                        }`}
                      />
                    ) : item.completedCount > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Agenda Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {formatDisplayDate(selectedDate)}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {scheduledTasks.length} {scheduledTasks.length === 1 ? 'deadline' : 'deadlines'}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add for this Day</span>
        </button>
      </div>

      {/* Scheduled Task Cards */}
      {scheduledTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No deadlines scheduled for {formatDisplayDate(selectedDate)}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Enjoy the free calendar space or add milestone checkpoints.
          </p>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="mt-4 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
          >
            + Schedule Task for {formatDisplayDate(selectedDate)}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {scheduledTasks.map((task) => (
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
    </div>
  );
};
