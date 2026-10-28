import React, { useMemo } from 'react';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { formatDateKey, getDaysDifference, isPastCelebrationTask } from '../utils/date';

interface DailyProgressDigestCardProps {
  tasks: Task[];
  onOpenAIBriefing: () => void;
  onFilterToday?: () => void;
  onFilterCompleted?: () => void;
}

export const DailyProgressDigestCard: React.FC<DailyProgressDigestCardProps> = ({
  tasks,
  onOpenAIBriefing,
  onFilterToday,
  onFilterCompleted,
}) => {
  const today = formatDateKey();

  const metrics = useMemo(() => {
    let completedToday = 0;
    let dueToday = 0;
    let overdue = 0;
    let activeTotal = 0;
    let totalOverall = 0;
    let completedOverall = 0;

    const now = new Date();

    for (const t of tasks) {
      if (isPastCelebrationTask(t, today)) continue;

      totalOverall++;
      if (t.status === 'completed') {
        completedOverall++;
        if (t.completedAt && t.completedAt.startsWith(today)) {
          completedToday++;
        }
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
      }
    }

    // Daily progress percentage:
    // If there were tasks for today, calculate completedToday / (completedToday + dueToday)
    // If no specific tasks today, use overall completion rate
    const todayTargetTotal = completedToday + dueToday;
    let percentage = 100;

    if (todayTargetTotal > 0) {
      percentage = Math.round((completedToday / todayTargetTotal) * 100);
    } else if (totalOverall > 0) {
      percentage = activeTotal === 0 ? 100 : Math.round((completedOverall / totalOverall) * 100);
    }

    // Generate dynamic headline and message matching the user's design
    let headline = 'All Set for Today! Outstanding Velocity 🎉';
    let description = 'No pending deadlines right now. Perfect window to plan ahead or tackle deep work.';

    if (overdue > 0) {
      headline = `Action Required: ${overdue} Overdue ${overdue === 1 ? 'Task' : 'Tasks'} ⚠️`;
      description = 'Immediate attention needed for overdue deadlines before tackling new work.';
    } else if (dueToday > 0) {
      if (completedToday > 0) {
        headline = `Great Momentum: ${dueToday} ${dueToday === 1 ? 'Task' : 'Tasks'} Left Today ⚡`;
        description = `${completedToday} completed today. Keep the cadence going to close out remaining items.`;
      } else {
        headline = `Focus Locked: ${dueToday} ${dueToday === 1 ? 'Deadline' : 'Deadlines'} Due Today 🎯`;
        description = 'Review priority items below and knock out high-impact tasks early.';
      }
    } else if (completedToday > 0) {
      headline = 'All Set for Today! Outstanding Velocity 🎉';
      description = `${completedToday} ${completedToday === 1 ? 'task' : 'tasks'} finished today. Perfect window to plan ahead or tackle deep work.`;
    } else if (activeTotal > 0) {
      headline = 'All Quiet Today · Ahead of Deadlines ✨';
      description = `${activeTotal} upcoming tasks scheduled for later this week. You are in full control.`;
    }

    return {
      completedToday,
      dueToday,
      overdue,
      activeTotal,
      percentage,
      headline,
      description,
    };
  }, [tasks, today]);

  // SVG Circle calculation
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius; // ~150.8
  const strokeDashoffset = circumference - (metrics.percentage / 100) * circumference;

  return (
    <div className="relative rounded-3xl p-4 sm:p-6 bg-linear-to-r from-[#10133a] via-[#141644] to-[#0c0e27] border border-indigo-500/30 shadow-xl text-white overflow-hidden transition-all">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        {/* Left: Headline & Description */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="inline-flex items-center">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/5">
              Daily Progress Digest
            </span>
          </div>

          <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-snug">
            {metrics.headline}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {metrics.description}
          </p>
        </div>

        {/* Right: Dynamic Progress Ring & Metrics Inset Box */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5 sm:gap-4 shrink-0 shadow-inner backdrop-blur-sm">
          {/* Dynamic Progress Circle */}
          <div className="relative flex items-center justify-center shrink-0 w-14 h-14 sm:w-16 sm:h-16">
            <svg
              className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90 transform"
              viewBox="0 0 60 60"
              aria-label={`Progress: ${metrics.percentage}%`}
            >
              {/* Subtle background track */}
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="text-slate-800"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />

              {/* Dynamic emerald progress ring */}
              <circle
                cx="30"
                cy="30"
                r={radius}
                stroke={metrics.percentage === 100 ? '#00e599' : '#10b981'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </svg>

            {/* Inner Percentage */}
            <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none select-none">
              <span className="text-xs sm:text-sm font-extrabold font-sans tabular-nums text-white tracking-tight">
                {metrics.percentage}%
              </span>
            </div>
          </div>

          {/* Metrics Stack */}
          <div className="flex flex-col justify-center space-y-1 text-xs">
            {/* Done Today */}
            <button
              type="button"
              onClick={onFilterCompleted}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition text-left cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="tabular-nums">{metrics.completedToday} Done Today</span>
            </button>

            {/* Due Today */}
            <button
              type="button"
              onClick={onFilterToday}
              className="flex items-center gap-1.5 text-indigo-200 hover:text-white font-medium transition text-left cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2] shrink-0 text-indigo-300" />
              <span className="tabular-nums">{metrics.dueToday} Due Today</span>
            </button>

            {/* AI Briefing Link Button */}
            <button
              type="button"
              onClick={onOpenAIBriefing}
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition text-left cursor-pointer active:scale-95 mt-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span>AI Briefing →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
