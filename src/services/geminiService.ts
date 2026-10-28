import { GoogleGenAI } from '@google/genai';
import { Task, Subtask } from '../types';
import { formatDateKey } from '../utils/date';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (typeof window === 'undefined') return null;
  const apiKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Generate intelligent daily progress briefing
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

  const ai = getGenAI();
  if (!ai) return fallback;

  try {
    const prompt = `You are the executive productivity AI for "Jemah's TaskPulse", a mobile worklist and deadline tracker.
Current state:
- Date: ${today}
- Overdue tasks (${overdue.length}): ${overdue.map((t) => `"${t.title}" (${t.project})`).join(', ') || 'None'}
- Due Today (${dueToday.length}): ${dueToday.map((t) => `"${t.title}" [${t.priority}] (${t.project})`).join(', ') || 'None'}
- Completed Today: ${completedToday}
- Urgent active items: ${urgent.map((t) => t.title).join(', ') || 'None'}

Return a concise JSON object with exactly these keys:
{
  "headline": "A punchy 5-8 word status headline with 1 relevant emoji",
  "narrative": "A crisp 2-sentence executive summary evaluating today's momentum and workload risk",
  "recommendedFocus": "Specific action advice on which task or project block to tackle first"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        headline: parsed.headline || fallback.headline,
        narrative: parsed.narrative || fallback.narrative,
        recommendedFocus: parsed.recommendedFocus || fallback.recommendedFocus,
      };
    }
  } catch {
    // If AI rate limit or key missing, gracefully fallback
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
 * Break down a task into 3-5 actionable subtasks using AI
 */
export async function decomposeTaskAI(taskTitle: string, project = 'General'): Promise<Subtask[]> {
  const fallbackSubtasks = [
    { id: `sub_${Date.now()}_1`, title: 'Review scope and requirements', completed: false },
    { id: `sub_${Date.now()}_2`, title: 'Execute primary milestone draft', completed: false },
    { id: `sub_${Date.now()}_3`, title: 'Quality check and finalize deliverable', completed: false },
  ];

  const ai = getGenAI();
  if (!ai) return fallbackSubtasks;

  try {
    const prompt = `Decompose this task title into 3 to 4 actionable, specific micro-steps for a professional project worklist:
Task: "${taskTitle}"
Project: "${project}"

Return JSON array of strings: ["Step 1", "Step 2", "Step 3"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const list = JSON.parse(response.text);
      if (Array.isArray(list) && list.length > 0) {
        return list.slice(0, 5).map((step: string, idx: number) => ({
          id: `sub_${Date.now()}_${idx}`,
          title: String(step).trim(),
          completed: false,
        }));
      }
    }
  } catch {}

  return fallbackSubtasks;
}
