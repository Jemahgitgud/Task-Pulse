import { Task, Subtask } from '../types';
import { formatDateKey } from '../utils/date';

/**
 * Generate intelligent daily progress briefing via server-side Gemini API
 */
export async function generateAIBriefing(tasks: Task[]): Promise<{
  headline: string;
  narrative: string;
  recommendedFocus: string;
}> {
  const today = formatDateKey();
  const active = tasks.filter((t) => t.status !== 'completed');
  const completedToday = tasks.filter((t) => t.status === 'completed' && t.completedAt?.startsWith(today)).length;
  const overdue = active.filter((t) => t.dueDate < today);
  const dueToday = active.filter((t) => t.dueDate === today);
  const urgent = active.filter((t) => t.priority === 'urgent');

  // Deterministic high-quality fallback
  const fallback = generateAlgorithmicBriefing(tasks, today, active, completedToday, overdue, dueToday, urgent);

  try {
    const response = await fetch('/api/gemini/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        today,
        overdue: overdue.map((t) => ({ title: t.title, project: t.project })),
        dueToday: dueToday.map((t) => ({ title: t.title, priority: t.priority, project: t.project })),
        completedToday,
        urgent: urgent.map((t) => ({ title: t.title })),
      }),
    });

    if (response.ok) {
      const parsed = await response.json();
      return {
        headline: parsed.headline || fallback.headline,
        narrative: parsed.narrative || fallback.narrative,
        recommendedFocus: parsed.recommendedFocus || fallback.recommendedFocus,
      };
    }
  } catch {
    // Gracefully fall back if offline or API unavailable
  }

  return fallback;
}

function generateAlgorithmicBriefing(
  tasks: Task[],
  today: string,
  active: Task[],
  completedToday: number,
  overdue: Task[],
  dueToday: Task[],
  urgent: Task[]
) {
  let headline = 'All Clear for Today! ✨';
  let narrative = 'No pressing deadlines pending. Great time to get ahead on upcoming milestone deliverables.';
  let recommendedFocus = 'Review upcoming sprint goals or organize backlog items.';

  if (overdue.length > 0) {
    headline = `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} require immediate action 🚨`;
    narrative = `You have ${overdue.length} overdue commitment${overdue.length > 1 ? 's' : ''} that need resolution. Clearing these will restore momentum.`;
    recommendedFocus = `Tackle "${overdue[0].title}" first before accepting new assignments today.`;
  } else if (dueToday.length > 0) {
    if (urgent.length > 0) {
      headline = `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} today with urgent deadlines ⚡`;
      narrative = `High priority deliverables are scheduled for today. Lock in focus blocks during your peak morning energy.`;
      recommendedFocus = `Prioritize urgent item "${urgent[0].title}" (${urgent[0].project}).`;
    } else {
      headline = `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} scheduled for today 🎯`;
      narrative = `Steady execution will get all items wrapped up on schedule before close of business.`;
      recommendedFocus = `Start with "${dueToday[0].title}" to build quick completion velocity.`;
    }
  } else if (completedToday > 0) {
    headline = `Solid momentum! ${completedToday} completed today 🚀`;
    narrative = `You have cleared your primary deliverables for today. You are ahead of schedule.`;
    recommendedFocus = `Prepare tomorrow's worklist or take a well-earned breather.`;
  }

  return { headline, narrative, recommendedFocus };
}

/**
 * Break down a task into 3-5 actionable subtasks via server-side Gemini API
 */
export async function decomposeTaskAI(taskTitle: string, project = 'General'): Promise<Subtask[]> {
  const fallbackSubtasks = [
    { id: `sub_${Date.now()}_1`, title: 'Review scope and requirements', completed: false },
    { id: `sub_${Date.now()}_2`, title: 'Execute primary milestone draft', completed: false },
    { id: `sub_${Date.now()}_3`, title: 'Quality check and finalize deliverable', completed: false },
  ];

  try {
    const response = await fetch('/api/gemini/decompose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskTitle, project }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.steps) && data.steps.length > 0) {
        return data.steps.slice(0, 5).map((step: string, idx: number) => ({
          id: `sub_${Date.now()}_${idx}`,
          title: String(step).trim(),
          completed: false,
        }));
      }
    }
  } catch {
    // Gracefully fall back if offline or API unavailable
  }

  return fallbackSubtasks;
}
