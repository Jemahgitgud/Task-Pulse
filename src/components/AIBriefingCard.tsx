import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Volume2, VolumeX, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Task } from '../types';
import { formatDateKey, getDaysDifference, isPastCelebrationTask } from '../utils/date';

interface AIBriefingCardProps {
  tasks: Task[];
  onFocusTask?: (taskTitle: string) => void;
}

interface BriefingData {
  headline: string;
  narrative: string;
  recommendedFocus: string;
  source: 'gemini' | 'local';
}

export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({ tasks, onFocusTask }) => {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const today = formatDateKey();

  // Generate fallback local algorithmic briefing if Gemini is unavailable
  const generateLocalBriefing = useCallback(
    (overdue: Task[], dueToday: Task[], completedCount: number, urgent: Task[]): BriefingData => {
      let headline = '⚡ Solid Daily Momentum';
      let narrative = `You have completed ${completedCount} ${completedCount === 1 ? 'task' : 'tasks'} today. All deadlines are tracking smoothly.`;
      let recommendedFocus = 'Keep this pace and review upcoming deadlines for tomorrow.';

      if (overdue.length > 0) {
        headline = `⚠️ High Priority: ${overdue.length} ${overdue.length === 1 ? 'Deadline' : 'Deadlines'} Need Attention`;
        narrative = `There are ${overdue.length} overdue items that require immediate resolution before opening new workstreams.`;
        recommendedFocus = `Tackle "${overdue[0].title}" first to clear deadline backlog.`;
      } else if (dueToday.length > 0) {
        const urgentToday = dueToday.filter((t) => t.priority === 'urgent' || t.priority === 'high');
        if (urgentToday.length > 0) {
          headline = `🎯 Focus Locked: ${urgentToday.length} Urgent Targets Due Today`;
          narrative = `${dueToday.length} total tasks are due before midnight. Focusing on highest priority items first will protect your schedule.`;
          recommendedFocus = `Begin with "${urgentToday[0].title}" (${urgentToday[0].project}).`;
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

    // Fallback to local heuristic
    setBriefing(generateLocalBriefing(overdue, dueToday, completedToday, urgent));
    setLoading(false);
  }, [tasks, today, generateLocalBriefing]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  // Audio speech synthesis of briefing
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

  return (
    <div className="rounded-3xl bg-linear-to-br from-indigo-50/90 via-white to-slate-50/90 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs transition-colors overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 border-b border-indigo-100/70 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                AI Executive Briefing
              </span>
              {briefing?.source === 'gemini' && (
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Gemini 3.8
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              Daily workload diagnosis & focus priority
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleToggleSpeak}
              disabled={!briefing || loading}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-indigo-100/60 dark:hover:bg-slate-800 transition active:scale-95 ${
                isSpeaking ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60' : ''
              }`}
              title={isSpeaking ? 'Stop voice readout' : 'Listen to briefing'}
              aria-label={isSpeaking ? 'Stop voice readout' : 'Listen to briefing'}
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
            className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-indigo-100/60 dark:hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
            title="Refresh briefing with current tasks"
            aria-label="Refresh briefing"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-indigo-100/60 dark:hover:bg-slate-800 transition active:scale-95"
            title={isExpanded ? 'Collapse briefing' : 'Expand briefing'}
            aria-label={isExpanded ? 'Collapse briefing' : 'Expand briefing'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Briefing Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3">
          {loading && !briefing ? (
            <div className="space-y-2 animate-pulse py-2">
              <div className="h-4 bg-indigo-200/50 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-3 bg-indigo-100/60 dark:bg-slate-800/60 rounded-md w-full" />
              <div className="h-3 bg-indigo-100/60 dark:bg-slate-800/60 rounded-md w-5/6" />
            </div>
          ) : briefing ? (
            <>
              {/* Punchy Headline */}
              <div className="flex items-start gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {briefing.headline}
                </h4>
              </div>

              {/* Narrative Analysis */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {briefing.narrative}
              </p>

              {/* Recommended Focus Action */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-indigo-100/80 dark:border-slate-800/80 text-xs">
                <div className="flex items-start gap-2 text-indigo-950 dark:text-indigo-200 font-medium">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">
                      Recommended Focus:
                    </strong>{' '}
                    {briefing.recommendedFocus}
                  </span>
                </div>

                {onFocusTask && (
                  <button
                    type="button"
                    onClick={() => onFocusTask(briefing.recommendedFocus)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 shrink-0 cursor-pointer"
                  >
                    <span>Highlight</span>
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
