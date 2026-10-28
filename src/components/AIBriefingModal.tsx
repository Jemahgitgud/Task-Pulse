import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  RotateCw,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Target,
} from 'lucide-react';
import { Task } from '../types';
import { generateAIBriefing } from '../services/geminiService';

interface AIBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onNavigateToTask?: (taskId: string) => void;
}

export const AIBriefingModal: React.FC<AIBriefingModalProps> = ({
  isOpen,
  onClose,
  tasks,
}) => {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<{
    headline: string;
    narrative: string;
    recommendedFocus: string;
  } | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const result = await generateAIBriefing(tasks);
      setBriefing(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !briefing) {
      fetchBriefing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900 text-white border border-indigo-800/60 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-900/60 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Daily AI Progress Briefing</h3>
              <p className="text-[11px] text-indigo-300">Intelligent workload & deadline summary</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs font-medium">Synthesizing deadline radar and progress velocity...</p>
            </div>
          ) : briefing ? (
            <div className="space-y-4">
              {/* Headline Badge */}
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Status Headline
                </span>
                <h4 className="text-base sm:text-lg font-extrabold text-white">
                  {briefing.headline}
                </h4>
              </div>

              {/* Narrative */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Executive Briefing
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {briefing.narrative}
                </p>
              </div>

              {/* Recommended Focus */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Target className="w-4 h-4" />
                  <span>Strategic Focus Recommendation</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {briefing.recommendedFocus}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">No briefing available.</p>
          )}

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={fetchBriefing}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
