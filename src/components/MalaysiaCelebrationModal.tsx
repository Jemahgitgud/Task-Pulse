import React from 'react';
import { X, Calendar, Plus, Sparkles, CheckCircle, Flag, Clock, Bell, Edit3 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Malaysian Flag / Festive Accents */}
        <div className="relative p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{holiday.icon || '🇲🇾'}</span>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-white/20 text-white backdrop-blur-md">
              {holiday.type.replace('_', ' ')}
            </span>
            {holiday.isPublicHoliday && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500 text-white">
                Cuti Umum
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            {holiday.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-amber-200">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Tarikh Sambutan: {holiday.dayName}, {formatDisplayDate(holiday.date)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* 7-Day Deadline & Alert Highlight Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Dateline Persediaan Automatik (7 Hari Sebelum)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Dateline Tugasan:
                </span>
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {prepDeadline}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                T-7 Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 leading-relaxed">
              <Bell className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                Notifikasi dan amaran audio akan dihantar automatik pada 7 hari sebelum perayaan untuk semakan persediaan akhir.
              </span>
            </p>
          </div>

          {/* Event Description */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Keterangan Acara
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {holiday.description || 'Sambutan rasmi dalam kalendar acara dan cuti Malaysia.'}
            </p>
          </div>

          {holiday.name.includes('Hari Raya') && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-bold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ucapan Perayaan</span>
              </span>
              <p className="text-xs">
                Selamat Hari Raya Aidilfitri! Maaf Zahir dan Batin. Semoga perayaan ini membawa keberkatan dan kebahagiaan kepada anda dan keluarga.
              </p>
            </div>
          )}

          {holiday.name.includes('Tahun Baru Cina') && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 space-y-1">
              <span className="font-bold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Gong Xi Fa Cai</span>
              </span>
              <p className="text-xs">
                Selamat Tahun Baru Cina! Semoga tahun ini dipenuhi kemakmuran, kesihatan dan kejayaan.
              </p>
            </div>
          )}

          {holiday.name.includes('Deepavali') && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Happy Deepavali</span>
              </span>
              <p className="text-xs">
                Happy Deepavali! May the divine light bring joy, peace and prosperity to your home.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Tutup
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onOpenQuickAddWithHoliday && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAddWithHoliday(holiday);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah Suai</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onScheduleTask(holiday);
                  onClose();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Auto-Log Tugasan (Dateline 7 Hari)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
