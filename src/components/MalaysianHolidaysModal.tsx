import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MalaysiaHoliday, getMalaysianHolidays } from '../utils/malaysiaHolidays';
import { calculatePrepDeadline, formatDateKey } from '../utils/date';

interface MalaysianHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoLogHoliday: (holiday: MalaysiaHoliday) => void;
  onAutoLogAllMajor: (year: number) => void;
  onSelectHolidayForDetails: (holiday: MalaysiaHoliday) => void;
  existingTaskEventDates?: Set<string>;
}

export const MalaysianHolidaysModal: React.FC<MalaysianHolidaysModalProps> = ({
  isOpen,
  onClose,
  onAutoLogHoliday,
  onAutoLogAllMajor,
  onSelectHolidayForDetails,
  existingTaskEventDates = new Set(),
}) => {
  const today = formatDateKey();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loggedNotification, setLoggedNotification] = useState<string | null>(null);

  const holidays = useMemo(() => {
    return getMalaysianHolidays(selectedYear);
  }, [selectedYear]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      if (selectedCategory === 'public' && !h.isPublicHoliday) return false;
      if (selectedCategory === 'islamic' && h.type !== 'islamic') return false;
      if (selectedCategory === 'cultural' && h.type !== 'cultural') return false;
      if (selectedCategory === 'national' && h.type !== 'national') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.date.includes(q) ||
          h.dayName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [holidays, selectedCategory, searchTerm]);

  if (!isOpen) return null;

  const handleLogHoliday = (holiday: MalaysiaHoliday) => {
    onAutoLogHoliday(holiday);
    setLoggedNotification(
      `Added: ${holiday.name} (Due: ${calculatePrepDeadline(holiday.date, 7)})`
    );
    setTimeout(() => setLoggedNotification(null), 3000);
  };

  const handleLogAll = () => {
    onAutoLogAllMajor(selectedYear);
    setLoggedNotification(
      `Added upcoming ${selectedYear} public holidays with 7-day advance deadlines.`
    );
    setTimeout(() => setLoggedNotification(null), 3500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center safe-modal-overlay bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto safe-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                Auto-Logs 60 Days Ahead
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Malaysia Public Holidays
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Upcoming public holidays within 60 days are automatically added with a due date 7 days early. Passed holidays stay quiet without overdue alerts.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="hover:text-amber-300 p-0.5 text-slate-300 transition"
                title="Previous year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-white px-2 font-mono tabular-nums">
                {selectedYear}
              </span>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="hover:text-amber-300 p-0.5 text-slate-300 transition"
                title="Next year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogAll}
              className="min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add All Upcoming ({selectedYear})</span>
            </button>
          </div>
        </div>

        {loggedNotification && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{loggedNotification}</span>
          </div>
        )}

        {/* Filter & Search */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search holiday (e.g. Deepavali, Hari Raya, Christmas)..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Holidays ({holidays.length})</option>
            <option value="public">Public Holidays Only</option>
            <option value="islamic">Islamic</option>
            <option value="cultural">Cultural</option>
            <option value="national">National</option>
          </select>
        </div>

        {/* Holiday List */}
        <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
          {filteredHolidays.map((holiday) => {
            const prepDeadline = calculatePrepDeadline(holiday.date, 7);
            const isAlreadyTracked = existingTaskEventDates.has(holiday.date);
            const isPastHoliday = holiday.date < today;

            return (
              <div
                key={holiday.id}
                className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isPastHoliday
                    ? 'border-slate-200/70 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="text-center w-14 shrink-0 py-1.5 px-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] leading-tight">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono tabular-nums">
                      {holiday.date.slice(5)}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {holiday.dayName.slice(0, 3)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        {holiday.name}
                      </h4>
                      {isPastHoliday && (
                        <span className="text-[10px] font-medium text-slate-400">
                          · Past
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>7d advance due date: {prepDeadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onSelectHolidayForDetails(holiday)}
                    className="min-h-[34px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition"
                  >
                    Details
                  </button>

                  {!isPastHoliday && (
                    <button
                      type="button"
                      onClick={() => handleLogHoliday(holiday)}
                      className={`min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-[11px] transition active:scale-95 ${
                        isAlreadyTracked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAlreadyTracked ? 'Added' : 'Add Reminder'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
