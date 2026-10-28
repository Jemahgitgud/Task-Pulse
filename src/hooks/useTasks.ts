import { useState, useEffect, useRef } from 'react';
import { Task, TaskPriority, TaskCategory, TaskStatus } from '../types';
import { formatDateKey } from '../utils/date';
import { playCompletionChime, playClickTone, triggerHaptic, fireConfetti } from '../utils/audio';

const STORAGE_KEY = 'taskpulse_tasks_v2';

export function getSampleTasks(): Task[] {
  const today = formatDateKey();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateKey(yesterdayDate);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = formatDateKey(tomorrowDate);

  const inTwoDaysDate = new Date();
  inTwoDaysDate.setDate(inTwoDaysDate.getDate() + 2);
  const inTwoDays = formatDateKey(inTwoDaysDate);

  const inFourDaysDate = new Date();
  inFourDaysDate.setDate(inFourDaysDate.getDate() + 4);
  const inFourDays = formatDateKey(inFourDaysDate);

  return [
    {
      id: 'task-1',
      title: 'Submit Q4 Client Deliverables & Milestone Report',
      description: 'Finalize presentation deck, summarize deliverable checklist, and send link to stakeholders.',
      project: 'Client Accounts',
      priority: 'urgent',
      category: 'Deadline',
      dueDate: today,
      dueTime: '17:00',
      status: 'in_progress',
      pinned: true,
      reminderEnabled: true,
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub-1', title: 'Export metrics chart and KPI summary', completed: true },
        { id: 'sub-2', title: 'Review feedback with project lead', completed: true },
        { id: 'sub-3', title: 'Send final PDF report via email', completed: false },
      ],
    },
    {
      id: 'task-overdue',
      title: 'Finalize Vendor Service Agreements & Security NDA',
      description: 'Review updated terms of service and submit signed addendum.',
      project: 'Legal & Ops',
      priority: 'high',
      category: 'Deadline',
      dueDate: yesterday,
      dueTime: '14:00',
      status: 'todo',
      pinned: false,
      reminderEnabled: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      subtasks: [
        { id: 'sub-od-1', title: 'Verify clause 4.2 data liability', completed: true },
        { id: 'sub-od-2', title: 'Obtain digital signature', completed: false },
      ],
    },
    {
      id: 'task-2',
      title: 'Design Review & Feedback for Mobile Dashboard',
      description: 'Audit mobile touch ergonomics, bottom navigation layout, and thumb reach zones.',
      project: 'Product Design',
      priority: 'high',
      category: 'Review',
      dueDate: today,
      dueTime: '15:30',
      status: 'todo',
      pinned: false,
      reminderEnabled: true,
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub-4', title: 'Check 44px minimum touch targets', completed: false },
        { id: 'sub-5', title: 'Verify contrast on high brightness screens', completed: false },
      ],
    },
    {
      id: 'task-3',
      title: 'Weekly Standup & Cross-Team Sync',
      description: 'Cover blockers, active sprint deadlines, and daily progress digest alignment.',
      project: 'Team Operations',
      priority: 'medium',
      category: 'Meeting',
      dueDate: tomorrow,
      dueTime: '10:00',
      status: 'todo',
      pinned: false,
      reminderEnabled: true,
      createdAt: new Date().toISOString(),
      subtasks: [{ id: 'sub-6', title: 'Draft 3 bullet talking points', completed: false }],
    },
    {
      id: 'task-4',
      title: 'Backend API Contract & Authentication Audit',
      description: 'Ensure token expiration flows and offline cache invalidation rules are robust.',
      project: 'Core Engineering',
      priority: 'medium',
      category: 'Work',
      dueDate: inTwoDays,
      dueTime: '18:00',
      status: 'todo',
      pinned: false,
      reminderEnabled: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
    },
    {
      id: 'task-5',
      title: 'Renew Cloud Hosting & Domain SSL Certs',
      description: 'Auto-renewal verification for production infrastructure.',
      project: 'DevOps & Infra',
      priority: 'low',
      category: 'Work',
      dueDate: inFourDays,
      dueTime: '12:00',
      status: 'completed',
      completedAt: new Date().toISOString(),
      pinned: false,
      reminderEnabled: false,
      createdAt: new Date().toISOString(),
      subtasks: [{ id: 'sub-7', title: 'Check DNS validation status', completed: true }],
    },
  ];
}

export function useTasks(soundEnabled = true, vibrationEnabled = true) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return getSampleTasks();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    const sample = getSampleTasks();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    } catch {}
    return sample;
  });

  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'syncing'>('synced');
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const saveTimeout = useRef<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      setSyncStatus('syncing');
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = window.setTimeout(() => {
        setSyncStatus('synced');
      }, 400);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
      setSyncStatus('local');
    }
  }, [tasks]);

  const addTask = (
    partial: Omit<Task, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Task => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const id = partial.id || `task_${Date.now()}_${randomSuffix}`;
    const newTask: Task = {
      ...partial,
      id,
      dueDate: partial.dueDate || formatDateKey(),
      createdAt: partial.createdAt || new Date().toISOString(),
      status: partial.status || 'todo',
      subtasks: partial.subtasks || [],
      pinned: !!partial.pinned,
      reminderEnabled: partial.reminderEnabled !== undefined ? partial.reminderEnabled : true,
    };

    setTasks((prev) => [newTask, ...prev]);
    setLastAddedTaskId(id);
    playClickTone(soundEnabled);
    triggerHaptic(30, vibrationEnabled);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.status === 'completed' && t.status !== 'completed') {
            updated.completedAt = new Date().toISOString();
          } else if (updates.status && updates.status !== 'completed') {
            updated.completedAt = undefined;
          }
          return updated;
        }
        return t;
      })
    );
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const willComplete = t.status !== 'completed';
          if (willComplete) {
            playCompletionChime(soundEnabled);
            triggerHaptic(45, vibrationEnabled);
            fireConfetti();
          } else {
            playClickTone(soundEnabled);
            triggerHaptic(20, vibrationEnabled);
          }
          return {
            ...t,
            status: willComplete ? 'completed' : 'todo',
            completedAt: willComplete ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allCompleted =
            updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);

          if (allCompleted && t.status !== 'completed') {
            playCompletionChime(soundEnabled);
            triggerHaptic(45, vibrationEnabled);
            fireConfetti();
          } else {
            playClickTone(soundEnabled);
            triggerHaptic(20, vibrationEnabled);
          }

          return {
            ...t,
            subtasks: updatedSubtasks,
            status: allCompleted ? 'completed' : t.status,
            completedAt: allCompleted && !t.completedAt ? new Date().toISOString() : t.completedAt,
          };
        }
        return t;
      })
    );
  };

  const togglePin = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
    playClickTone(soundEnabled);
    triggerHaptic(20, vibrationEnabled);
  };

  const rescheduleTask = (id: string, daysOffset: number, customDate?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          let newDate = customDate;
          if (!newDate) {
            const current = new Date(`${t.dueDate}T12:00:00`);
            current.setDate(current.getDate() + daysOffset);
            newDate = formatDateKey(current);
          }
          return { ...t, dueDate: newDate };
        }
        return t;
      })
    );
    playClickTone(soundEnabled);
    triggerHaptic(25, vibrationEnabled);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    playClickTone(soundEnabled);
    triggerHaptic(30, vibrationEnabled);
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
    playClickTone(soundEnabled);
    triggerHaptic(35, vibrationEnabled);
  };

  const resetSampleTasks = () => {
    const sample = getSampleTasks();
    setTasks(sample);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    } catch {}
    playClickTone(soundEnabled);
  };

  const importTasks = (importedTasks: Task[]) => {
    if (Array.isArray(importedTasks) && importedTasks.length > 0) {
      setTasks(importedTasks);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(importedTasks));
      } catch {}
      playClickTone(soundEnabled);
    }
  };

  return {
    tasks,
    syncStatus,
    lastAddedTaskId,
    addTask,
    updateTask,
    toggleTaskStatus,
    toggleSubtask,
    togglePin,
    rescheduleTask,
    deleteTask,
    clearCompleted,
    resetSampleTasks,
    importTasks,
  };
}
