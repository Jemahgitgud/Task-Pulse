import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, RefreshCw, Volume2, VolumeX, Target, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Task } from '../types';
import { formatDateKey, getDaysDifference, isPastCelebrationTask } from '../utils/date';

interface AIBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTaskFilter?: (filter: any) => void;
}

interface BriefingData {
  headline: string;
  narrative: string;
  recommendedFocus: string;
  source: 'gemini' | 'local';
}

export const AIBriefingModal: React.FC<AIBriefingModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTaskFilter,
}) => {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const today = formatDateKey();

  const generateLocalBriefing = useCallback(
    (overdue: Task[], dueToday: Task[], completedCount: number, urgent: Task[]): BriefingData => {
      let headline = '⚡ Solid Daily Momentum';
      let narrative = `You have completed ${completedCount} ${completedCount === 1 ? 'task' : 'tasks'} today. All deadlines are tracking smoothly.`;
      let recommendedFocus = 'Keep this pace and review upcoming deadlines for tomorrow.';

      if (overdue.length > 0) {
        headline = `⚠️ High Priority: ${overdue.length} ${overdue.length === 1 ? 'Deadline' : 'Deadlines'} Need Attention`;
        narrative = `There are ${overdue.length} overdue items requiring immediate resolution before opening new workstreams.`;
        recommendedFocus = `Tackle "${overdue[0].title}" (${overdue[0].project}) first.`;
      } else if (dueToday.length > 0) {
        const urgentToday = dueToday.filter((t) => t.priority === 'urgent' || t.priority === 'high');
        if (urgentToday.length > 0) {
          headline = `🎯 Focus Locked: ${urgentToday.length} Urgent Targets Due Today`;
          narrative = `${dueToday.length} tasks are due before midnight. Focusing on highest priority items first will protect your schedule.`;
          recommendedFocus = `Begin with "${urgentToday[0].title}".`;
        } else {
          headline = `📅 Steady Cadence: ${dueToday.length} Items Due Today`;
          narrative = `All tasks due today are within manageable priority tiers. Work through them sequentially.`;
          recommendedFocus = `Start with "${dueToday[0].title}".`;
        }
      } else if (tasks.length === 0) {
        headline = '🌟 Clean Slate Ahead';
        narrative = 'No pending deadlines registered. Add upcoming projects to stay ahead.';
        recommendedFocus = 'Use the Quick Add bar or press "N" to capture tasks.';
      } else if (urgent.length > 0) {
        headline = `🔥 ${urgent.length} Urgent Tasks In Flight`;
        narrative = `Critical items are pending for upcoming days. Preparing early prevents last-minute scrambles.`;
        recommendedFocus = `Review "${urgent[0].title}".`;
      }

      return { headline, narrative, recommendedFocus, source: 'local' };
    },
    [tasks.length]
  );

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    const now = new Date();

    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const urgent: Task[] = [];
    let completedToday = 0;

    for (const t of tasks) {
      if (isPastCelebrationTask(t, today)) continue;

      if (t.status === 'completed') {
        if (t.completedAt && t.completedAt.startsWith(today)) {
          completedToday++;
        }
        continue;
      }

      const diff = getDaysDifference(today, t.dueDate);
      let isOverdue = diff < 0;
      if (diff === 0 && t.dueTime) {
        const [h, m] = t.dueTime.split(':').map(Number);
        const dueMoment = new Date();
        dueMoment.setHours(h, m, 0, 0);
        if (dueMoment.getTime() < now.getTime()) {
          isOverdue = true;
        }
      }

      if (isOverdue) {
        overdue.push(t);
      } else if (diff === 0) {
        dueToday.push(t);
      }

      if (t.priority === 'urgent' || t.priority === 'high') {
        urgent.push(t);
      }
    }

    try {
      const res = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          today,
          overdue: overdue.map((t) => ({ title: t.title, project: t.project })),
          dueToday: dueToday.map((t) => ({ title: t.title, priority: t.priority, project: t.project })),
          completedToday,
          urgent: urgent.map((t) => ({ title: t.title, project: t.project })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.headline && data.narrative) {
          setBriefing({
            headline: data.headline,
            narrative: data.narrative,
            recommendedFocus: data.recommendedFocus || 'Proceed with today’s priorities.',
            source: 'gemini',
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback cleanly
    }

    setBriefing(generateLocalBriefing(overdue, dueToday, completedToday, urgent));
    setLoading(false);
  }, [tasks, today, generateLocalBriefing]);

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  }, [isOpen, fetchBriefing]);

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!briefing) return;
    window.speechSynthesis.cancel();

    const textToRead = `${briefing.headline}. ${briefing.narrative} Recommended focus: ${briefing.recommendedFocus}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center safe-modal-overlay bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl safe-modal-panel overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Executive AI Briefing
                </h3>
                {briefing?.source === 'gemini' && (
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Gemini 3.8
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live diagnosis of workload risk and priority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                type="button"
                onClick={handleToggleSpeak}
                disabled={!briefing || loading}
                className={`min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 ${
                  isSpeaking ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60' : ''
                }`}
                title={isSpeaking ? 'Stop voice readout' : 'Read briefing aloud'}
                aria-label={isSpeaking ? 'Stop voice readout' : 'Read briefing aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 animate-pulse text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={fetchBriefing}
              disabled={loading}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
              title="Refresh briefing"
              aria-label="Refresh briefing"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {loading && !briefing ? (
            <div className="space-y-3 py-6 animate-pulse">
              <div className="h-5 bg-indigo-100 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-5/6" />
              <div className="h-10 bg-indigo-50 dark:bg-slate-800/40 rounded-xl w-full mt-4" />
            </div>
          ) : briefing ? (
            <>
              {/* Headline */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {briefing.headline}
                </h4>
              </div>

              {/* Narrative */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Executive Assessment
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {briefing.narrative}
                </p>
              </div>

              {/* Recommended Focus */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Strategic Next Move</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {briefing.recommendedFocus}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition active:scale-95"
                >
                  Got It
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
