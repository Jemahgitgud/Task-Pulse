import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Search,
  Filter,
  Flag,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  GraduationCap,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  MalaysiaHoliday,
  getMalaysianHolidays,
  getDefaultExamMilestones,
} from '../utils/malaysiaHolidays';
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
      if (selectedCategory === 'international' && h.type !== 'international') return false;

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
    setLoggedNotification(`Ditambah: ${holiday.name} (Dateline: ${calculatePrepDeadline(holiday.date, 7)})`);
    setTimeout(() => setLoggedNotification(null), 3000);
  };

  const handleLogAll = () => {
    onAutoLogAllMajor(selectedYear);
    setLoggedNotification(`Semua cuti umum utama akan datang (${selectedYear}) telah diautolog ke senarai tugasan!`);
    setTimeout(() => setLoggedNotification(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 text-white border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🇲🇾</span>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  Kalendar Rasmi Malaysia · Auto-Update Setiap Tahun
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Jadual Acara, Perayaan & Cuti Umum Malaysia
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Cuti umum utama akan datang (<strong className="text-amber-300">dalam tempoh 60 hari</strong>) diautolog secara automatik tahun demi tahun dengan <strong className="text-amber-300">dateline & amaran notifikasi 7 hari sebelum acara</strong>. Anda juga boleh log mana-mana acara pilihan secara manual di bawah.
          </p>

          {/* Year Switcher & Quick 1-Click Action */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 self-start">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="hover:text-amber-300 p-0.5 text-slate-300 transition"
                title="Tahun Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-white px-2 font-mono">
                {selectedYear}
              </span>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="hover:text-amber-300 p-0.5 text-slate-300 transition"
                title="Tahun Seterusnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogAll}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Auto-Log Semua Cuti Utama {selectedYear} (Dateline 7 Hari)</span>
            </button>
          </div>
        </div>

        {/* Temporary action banner */}
        {loggedNotification && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{loggedNotification}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari acara, perayaan (cth: Raya, Deepavali)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">Semua Kategori ({holidays.length})</option>
            <option value="public">Cuti Umum Sahaja</option>
            <option value="islamic">Perayaan Islam</option>
            <option value="cultural">Kebudayaan</option>
            <option value="national">Kebangsaan</option>
            <option value="international">Antarabangsa</option>
          </select>
        </div>

        {/* Public Exam Banner */}
        <div className="mx-4 mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="leading-snug">
              <span className="font-bold text-indigo-950 dark:text-indigo-200">
                Peperiksaan SPM / STPM {selectedYear}:
              </span>
              <span className="text-slate-600 dark:text-slate-400 ml-1">
                Bermula 16 Nov {selectedYear} · Keputusan: Mei {selectedYear + 1} (TBC)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleLogHoliday({
                id: `spm_${selectedYear}`,
                date: `${selectedYear}-11-16`,
                dayName: 'Isnin',
                name: `Peperiksaan SPM ${selectedYear}`,
                type: 'exam',
                isPublicHoliday: false,
                icon: '🎓',
                description: `Peperiksaan Sijil Pelajaran Malaysia (SPM) sesi ${selectedYear}.`,
              });
            }}
            className="self-start sm:self-auto px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition text-[11px] shrink-0"
          >
            + Auto-Log SPM (Dateline 7 Hari)
          </button>
        </div>

        {/* Scrollable Holiday Items List */}
        <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
          {filteredHolidays.map((holiday) => {
            const prepDeadline = calculatePrepDeadline(holiday.date, 7);
            const isAlreadyTracked = existingTaskEventDates.has(holiday.date);
            const isPastHoliday = holiday.date < today;

            return (
              <div
                key={holiday.id}
                className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isPastHoliday
                    ? 'border-slate-200/70 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 opacity-75'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-indigo-300 dark:hover:border-indigo-700/60'
                }`}
              >
                {/* Left: Date & Name */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="text-center w-14 shrink-0 py-1.5 px-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] leading-tight">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">
                      {holiday.date.slice(5)}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {holiday.dayName}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base shrink-0">{holiday.icon || '🇲🇾'}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        {holiday.name}
                      </h4>
                      {holiday.isPublicHoliday && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60">
                          Cuti Umum
                        </span>
                      )}
                      {isPastHoliday && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Telah Berlalu
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900/60">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Dateline Persediaan (T-7): {prepDeadline}</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <Bell className="w-3 h-3 text-indigo-400" />
                        <span>Notifikasi 7 hari sebelum</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onSelectHolidayForDetails(holiday)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition"
                  >
                    Butiran
                  </button>

                  {!isPastHoliday && (
                    <button
                      type="button"
                      onClick={() => handleLogHoliday(holiday)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition active:scale-95 shadow-xs ${
                        isAlreadyTracked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAlreadyTracked ? 'Log Sekali Lagi' : 'Auto-Log (T-7)'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Pematuhan kalendar persekutuan & negeri Malaysia</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
