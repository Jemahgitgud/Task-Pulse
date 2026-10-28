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
  Flag,
  Sparkles,
  Search,
  Filter,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { Task } from '../types';
import {
  formatDateKey,
  formatDisplayDate,
  calculatePrepDeadline,
  isPastCelebrationTask,
} from '../utils/date';
import { TaskCard } from './TaskCard';
import {
  getMalaysianHolidays,
  getDefaultExamMilestones,
  MalaysiaHoliday,
  ExamMilestone,
} from '../utils/malaysiaHolidays';
import { MalaysiaCelebrationModal } from './MalaysiaCelebrationModal';
import { MalaysianHolidaysModal } from './MalaysianHolidaysModal';

interface DeadlinesCalendarViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number, customDate?: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
  onOpenQuickAdd: (prefilledDate?: string) => void;
  onAutoLogHoliday?: (holiday: MalaysiaHoliday) => void;
  onAutoLogAllMajorHolidays?: (year: number) => void;
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
  onAutoLogHoliday,
  onAutoLogAllMajorHolidays,
}) => {
  const today = formatDateKey();
  const currentYear = new Date().getFullYear();

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [showHolidaysList, setShowHolidaysList] = useState<boolean>(false);
  const [holidaySearch, setHolidaySearch] = useState<string>('');
  const [holidayCategory, setHolidayCategory] = useState<string>('all');
  const [selectedHolidayModal, setSelectedHolidayModal] = useState<MalaysiaHoliday | null>(null);

  // Compute Malaysian holidays for selected year dynamically
  const malaysiaHolidays = useMemo(() => {
    return getMalaysianHolidays(selectedYear);
  }, [selectedYear]);

  // Exam milestones (SPM, SPM results, etc.)
  const examMilestones = useMemo(() => {
    return getDefaultExamMilestones(selectedYear);
  }, [selectedYear]);

  // Map of date string -> holidays on that date
  const holidaysByDate = useMemo(() => {
    const map: Record<string, MalaysiaHoliday[]> = {};
    for (const h of malaysiaHolidays) {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    }
    return map;
  }, [malaysiaHolidays]);

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
      holidays: MalaysiaHoliday[];
    }> = [];

    const base = new Date();
    base.setFullYear(selectedYear);
    base.setDate(base.getDate() + weekOffset * 7);

    // Show 14 days starting from Monday of that week
    const currentDay = base.getDay();
    const diffToMonday = base.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(base.setDate(diffToMonday));

    for (let i = 0; i < 14; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = formatDateKey(d);

      const dayTasks = tasks.filter((t) => t.dueDate === key);
      const active = dayTasks.filter(
        (t) => t.status !== 'completed' && !isPastCelebrationTask(t, today)
      );
      const urgent = active.filter((t) => t.priority === 'urgent');
      const completed = dayTasks.filter(
        (t) => t.status === 'completed' || isPastCelebrationTask(t, today)
      );
      const isOverdue = key < today && active.length > 0;
      const dayHolidays = holidaysByDate[key] || [];

      list.push({
        dateKey: key,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: key === today,
        activeCount: active.length,
        urgentCount: urgent.length,
        overdueCount: isOverdue ? active.length : 0,
        completedCount: completed.length,
        holidays: dayHolidays,
      });
    }

    return list;
  }, [tasks, weekOffset, selectedYear, today, holidaysByDate]);

  // Filtered Malaysian holidays list
  const filteredHolidays = useMemo(() => {
    return malaysiaHolidays.filter((h) => {
      if (holidayCategory === 'public' && !h.isPublicHoliday) return false;
      if (holidayCategory === 'islamic' && h.type !== 'islamic') return false;
      if (holidayCategory === 'cultural' && h.type !== 'cultural') return false;
      if (holidayCategory === 'national' && h.type !== 'national') return false;
      if (holidayCategory === 'international' && h.type !== 'international') return false;

      if (holidaySearch.trim()) {
        const q = holidaySearch.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.date.includes(q) ||
          h.dayName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [malaysiaHolidays, holidayCategory, holidaySearch]);

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

  const selectedDateHolidays = holidaysByDate[selectedDate] || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Header with Year Selector & Malaysia Holidays Toggle */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Deliverables & Calendar
              </h2>
            </div>

            {/* Year Selector (Auto Updates Year-by-Year) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="hover:text-indigo-600 px-1"
                title="Tahun Sebelum"
              >
                ‹
              </button>
              <span>{selectedYear}</span>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="hover:text-indigo-600 px-1"
                title="Tahun Seterusnya"
              >
                ›
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Toggle Malaysia Holidays Table */}
            <button
              type="button"
              onClick={() => setShowHolidaysList(!showHolidaysList)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                showHolidaysList
                  ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">🇲🇾 Cuti & Perayaan Malaysia ({selectedYear})</span>
              <span className="sm:hidden">🇲🇾 Cuti M'sia ({selectedYear})</span>
            </button>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
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
                  setSelectedYear(currentYear);
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
        </div>

        {/* Horizontal Date Picker Strip with Holiday Indicators */}
        <div className="overflow-x-auto no-scrollbar pb-1 pt-1">
          <div className="flex items-center gap-2 min-w-max">
            {dateStrip.map((item) => {
              const isSelected = item.dateKey === selectedDate;
              const hasHoliday = item.holidays.length > 0;
              const primaryHoliday = item.holidays[0];

              return (
                <button
                  key={item.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(item.dateKey)}
                  className={`relative flex flex-col items-center justify-between w-16 py-2 px-1 rounded-2xl border transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : item.isToday
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                      : hasHoliday
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-200'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Holiday Badge icon */}
                  {hasHoliday && (
                    <span
                      className="absolute -top-1.5 -right-1 text-xs"
                      title={primaryHoliday.name}
                    >
                      {primaryHoliday.icon || '🇲🇾'}
                    </span>
                  )}

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

                  {/* Indicators for tasks */}
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

      {/* Malaysian Celebrations Full Schedule Modal (Fixes half screen issue) */}
      <MalaysianHolidaysModal
        isOpen={showHolidaysList}
        onClose={() => setShowHolidaysList(false)}
        onAutoLogHoliday={(h) => {
          if (onAutoLogHoliday) {
            onAutoLogHoliday(h);
          } else {
            onOpenQuickAdd(calculatePrepDeadline(h.date, 7));
          }
        }}
        onAutoLogAllMajor={(yr) => {
          if (onAutoLogAllMajorHolidays) {
            onAutoLogAllMajorHolidays(yr);
          }
        }}
        onSelectHolidayForDetails={(h) => setSelectedHolidayModal(h)}
        existingTaskEventDates={new Set(tasks.filter((t) => t.eventDate).map((t) => t.eventDate!))}
      />

      {/* Selected Day Holidays Banner (if any holiday exists on selected date) */}
      {selectedDateHolidays.length > 0 && (
        <div className="space-y-2">
          {selectedDateHolidays.map((h) => (
            <div
              key={h.id}
              onClick={() => setSelectedHolidayModal(h)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-amber-300/80 dark:border-amber-900/60 flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{h.icon || '🇲🇾'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {h.name}
                    </span>
                    {h.isPublicHoliday && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                        Cuti Umum
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {h.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0"
              >
                Butiran
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Day Agenda Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {formatDisplayDate(selectedDate)}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {scheduledTasks.length} {scheduledTasks.length === 1 ? 'tugasan' : 'tugasan'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickAdd(selectedDate)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tugasan Tarikh Ini</span>
        </button>
      </div>

      {/* Scheduled Task Cards */}
      {scheduledTasks.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Tiada tugasan dijadualkan untuk {formatDisplayDate(selectedDate)}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedDateHolidays.length > 0
              ? `Hari ini adalah ${selectedDateHolidays[0].name}. Nikmati sambutan atau jadualkan perancangan anda.`
              : 'Jadual anda lapang. Anda boleh menambah checkpoint atau tugasan baru.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenQuickAdd(selectedDate)}
            className="mt-4 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
          >
            + Jadualkan Tugasan untuk {formatDisplayDate(selectedDate)}
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

      {/* Malaysia Celebration Modal */}
      <MalaysiaCelebrationModal
        holiday={selectedHolidayModal}
        onClose={() => setSelectedHolidayModal(null)}
        onScheduleTask={(h) => {
          if (onAutoLogHoliday) {
            onAutoLogHoliday(h);
          } else {
            onOpenQuickAdd(calculatePrepDeadline(h.date, 7));
          }
        }}
        onOpenQuickAddWithHoliday={(h) => {
          onOpenQuickAdd(calculatePrepDeadline(h.date, 7));
        }}
      />
    </div>
  );
};
