import { useState, useEffect, useRef } from 'react';
import { Task, TaskPriority, TaskCategory, TaskStatus, P2PSyncStats } from '../types';
import { formatDateKey, addDays, calculatePrepDeadline, isCelebrationTask } from '../utils/date';
import { getMalaysianHolidays } from '../utils/malaysiaHolidays';
import { playCompletionChime, playClickTone, triggerHaptic, fireConfetti } from '../utils/audio';
import { p2pService } from '../services/webrtcService';

const STORAGE_KEY = 'taskpulse_tasks_v2';
const AUTOLOGGED_HOLIDAYS_KEY = 'taskpulse_autologged_holidays_v1';
const PROJECT_START_DATE = '2026-10-01';
const UPCOMING_HOLIDAY_LOOKAHEAD_DAYS = 60;

/**
 * Removes Persediaan Sambutan / holiday tasks from before October 2026 (project creation month),
 * while leaving all October 2026+ celebration tasks intact even after their date passes.
 */
function cleanPreOctoberCelebrations(list: Task[]): Task[] {
  return list.filter((t) => {
    if (!isCelebrationTask(t)) return true;
    const targetDate = t.eventDate || t.dueDate;
    return !targetDate || targetDate >= PROJECT_START_DATE;
  });
}

function getAutoLoggedHolidayMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(AUTOLOGGED_HOLIDAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAutoLoggedHolidayMap(map: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTOLOGGED_HOLIDAYS_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Automatically logs upcoming Malaysian public holidays (Cuti Umum) within the next 60 days
 * with a T-7 preparation deadline. Remembers logged holidays so manual deletions are respected.
 */
function ensureUpcomingHolidaysAutoLogged(currentTasks: Task[]): {
  mergedTasks: Task[];
  newlyCreated: Task[];
} {
  const today = formatDateKey();
  const horizon = addDays(today, UPCOMING_HOLIDAY_LOOKAHEAD_DAYS);
  const currentYear = new Date().getFullYear();
  const candidateHolidays = [
    ...getMalaysianHolidays(currentYear),
    ...getMalaysianHolidays(currentYear + 1),
  ].filter(
    (h) =>
      h.isPublicHoliday &&
      h.date >= PROJECT_START_DATE &&
      h.date >= today &&
      h.date <= horizon
  );

  const loggedMap = getAutoLoggedHolidayMap();
  let mapChanged = false;

  // Record any existing celebration eventDates so deleting one later won't re-create it
  for (const t of currentTasks) {
    if (t.eventDate && !loggedMap[t.eventDate]) {
      loggedMap[t.eventDate] = true;
      mapChanged = true;
    }
  }

  const existingEventDates = new Set(
    currentTasks.filter((t) => t.eventDate).map((t) => t.eventDate!)
  );
  const newlyCreated: Task[] = [];
  const nowIso = new Date().toISOString();

  for (const h of candidateHolidays) {
    if (existingEventDates.has(h.date) || loggedMap[h.date]) {
      if (!loggedMap[h.date]) {
        loggedMap[h.date] = true;
        mapChanged = true;
      }
      continue;
    }

    const prepDueDate = calculatePrepDeadline(h.date, 7);
    const slug = h.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);

    const newTask: Task = {
      id: `holiday_prep_${h.date}_${slug}`,
      title: `Persediaan Sambutan: ${h.name}`,
      description: h.description || `Persiapan rasmi 7 hari sebelum ${h.name}.`,
      project: 'Perayaan & Cuti',
      priority: 'urgent',
      category: 'Deadline',
      dueDate: prepDueDate,
      dueTime: '09:00',
      status: 'todo',
      pinned: false,
      reminderEnabled: true,
      isImportantDate: true,
      eventDate: h.date,
      eventName: h.name,
      leadDaysNotice: 7,
      createdAt: nowIso,
      updatedAt: nowIso,
      subtasks: [
        {
          id: `st_${h.date}_1`,
          title: 'Sediakan perancangan sambutan & semakan jadual',
          completed: false,
        },
        {
          id: `st_${h.date}_2`,
          title: 'Selesaikan tugasan kerja sebelum tarikh cuti',
          completed: false,
        },
      ],
    };

    newlyCreated.push(newTask);
    existingEventDates.add(h.date);
    loggedMap[h.date] = true;
    mapChanged = true;
  }

  if (mapChanged) {
    saveAutoLoggedHolidayMap(loggedMap);
  }

  return {
    mergedTasks: newlyCreated.length > 0 ? [...newlyCreated, ...currentTasks] : currentTasks,
    newlyCreated,
  };
}

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
          const cleaned = cleanPreOctoberCelebrations(parsed);
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {}
    return getSampleTasks();
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [connectedDevices, setConnectedDevices] = useState<number>(1);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const isInitialFetch = useRef(true);

  // Maintain tasksRef so WebRTC callbacks always get the newest tasks
  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  // WebRTC Peer-to-Peer direct browser sync state
  const [p2pStats, setP2pStats] = useState<P2PSyncStats>(() => ({
    state: 'connecting',
    roomId: p2pService.getRoomId(),
    peerId: p2pService.getPeerId(),
    connectedPeersCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
  }));

  // 1. Initial Fetch & Server Synchronization + WebRTC P2P Data Channel setup
  useEffect(() => {
    let active = true;

    // Register WebRTC callbacks
    p2pService.registerCallbacks(
      (incomingTasks, action) => {
        if (!active) return;
        const cleaned = cleanPreOctoberCelebrations(incomingTasks);
        setTasks(cleaned);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        } catch {}
        setSyncStatus('synced');
      },
      (newStats) => {
        if (!active) return;
        setP2pStats(newStats);
        if (newStats.connectedPeersCount > 0) {
          setConnectedDevices((prev) => Math.max(prev, newStats.connectedPeersCount + 1));
        }
      },
      () => tasksRef.current
    );

    // Connect to WebRTC signaling server
    p2pService.connect();

    async function syncWithServer() {
      try {
        setSyncStatus('syncing');
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Server unreachable');
        const data = await res.json();

        if (!active) return;

        if (Array.isArray(data.tasks) && data.tasks.length > 0) {
          const cleaned = cleanPreOctoberCelebrations(data.tasks);
          const { mergedTasks, newlyCreated } = ensureUpcomingHolidaysAutoLogged(cleaned);
          setTasks(mergedTasks);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedTasks));
          } catch {}
          if (newlyCreated.length > 0) {
            p2pService.broadcastMutation('bulk', undefined, mergedTasks);
            for (const created of newlyCreated) {
              fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(created),
              }).catch(() => {});
            }
          }
        } else {
          // If server database is empty, seed it with initial tasks + upcoming 60-day holidays
          const baseInitial = tasks.length > 0 ? cleanPreOctoberCelebrations(tasks) : getSampleTasks();
          const { mergedTasks: initial } = ensureUpcomingHolidaysAutoLogged(baseInitial);
          setTasks(initial);
          await fetch('/api/tasks/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: initial }),
          });
        }
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Backend sync fallback to local storage:', err);
        setSyncStatus('offline');
      }
    }

    if (isInitialFetch.current) {
      isInitialFetch.current = false;
      syncWithServer();
    }

    // 2. Connect to Server-Sent Events (SSE) for 2-Device Instant Sync
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('task_change', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (Array.isArray(payload.tasks)) {
            const cleaned = cleanPreOctoberCelebrations(payload.tasks);
            setTasks(cleaned);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            } catch {}
            setSyncStatus('synced');
          }
        } catch {}
      });

      eventSource.addEventListener('device_count', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (typeof payload.connectedDevices === 'number') {
            setConnectedDevices(payload.connectedDevices);
          }
        } catch {}
      });

      eventSource.addEventListener('connected', (e: MessageEvent) => {
        setSyncStatus('synced');
        try {
          const payload = JSON.parse(e.data);
          if (typeof payload.connectedDevices === 'number') {
            setConnectedDevices(payload.connectedDevices);
          }
        } catch {}
      });

      eventSource.onerror = () => {
        setSyncStatus('offline');
      };
    } catch {}

    // Periodic sync on window focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      if (eventSource) eventSource.close();
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const addTask = (
    partial: Omit<Task, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Task => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const id = partial.id || `task_${Date.now()}_${randomSuffix}`;
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      ...partial,
      id,
      dueDate: partial.dueDate || formatDateKey(),
      createdAt: partial.createdAt || nowIso,
      updatedAt: nowIso,
      status: partial.status || 'todo',
      subtasks: partial.subtasks || [],
      pinned: !!partial.pinned,
      reminderEnabled: partial.reminderEnabled !== undefined ? partial.reminderEnabled : true,
    };

    const nextTasks = [newTask, ...tasks];

    // Optimistic local update
    setTasks(nextTasks);
    setLastAddedTaskId(id);
    playClickTone(soundEnabled);
    triggerHaptic(30, vibrationEnabled);

    // Direct WebRTC P2P broadcast
    p2pService.broadcastMutation('add', newTask, nextTasks);

    // Broadcast to server
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    }).catch(() => setSyncStatus('offline'));

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    let updatedTask: Task | null = null;
    const nowIso = new Date().toISOString();
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        const updated = { ...t, ...updates, updatedAt: nowIso };
        if (updates.status === 'completed' && t.status !== 'completed') {
          updated.completedAt = nowIso;
        } else if (updates.status && updates.status !== 'completed') {
          updated.completedAt = undefined;
        }
        updatedTask = updated;
        return updated;
      }
      return t;
    });

    setTasks(nextTasks);

    if (updatedTask) {
      p2pService.broadcastMutation('update', updatedTask, nextTasks);
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => setSyncStatus('offline'));
    }
  };

  const toggleTaskStatus = (id: string) => {
    let updated: Task | null = null;
    const nowIso = new Date().toISOString();
    const nextTasks = tasks.map((t) => {
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
        updated = {
          ...t,
          status: willComplete ? 'completed' : 'todo',
          completedAt: willComplete ? nowIso : undefined,
          updatedAt: nowIso,
        };
        return updated;
      }
      return t;
    });

    setTasks(nextTasks);

    if (updated) {
      p2pService.broadcastMutation('toggle', updated, nextTasks);
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => setSyncStatus('offline'));
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    let updated: Task | null = null;
    const nowIso = new Date().toISOString();
    const nextTasks = tasks.map((t) => {
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

        updated = {
          ...t,
          subtasks: updatedSubtasks,
          status: allCompleted ? 'completed' : t.status,
          completedAt: allCompleted && !t.completedAt ? nowIso : t.completedAt,
          updatedAt: nowIso,
        };
        return updated;
      }
      return t;
    });

    setTasks(nextTasks);

    if (updated) {
      p2pService.broadcastMutation('update', updated, nextTasks);
      fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => setSyncStatus('offline'));
    }
  };

  const togglePin = (id: string) => {
    let updated: Task | null = null;
    const nowIso = new Date().toISOString();
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        updated = { ...t, pinned: !t.pinned, updatedAt: nowIso };
        return updated;
      }
      return t;
    });

    setTasks(nextTasks);
    playClickTone(soundEnabled);
    triggerHaptic(20, vibrationEnabled);

    if (updated) {
      p2pService.broadcastMutation('update', updated, nextTasks);
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => setSyncStatus('offline'));
    }
  };

  const rescheduleTask = (id: string, daysOffset: number, customDate?: string) => {
    let updated: Task | null = null;
    const nowIso = new Date().toISOString();
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        let newDate = customDate;
        if (!newDate) {
          const current = new Date(`${t.dueDate}T12:00:00`);
          current.setDate(current.getDate() + daysOffset);
          newDate = formatDateKey(current);
        }
        updated = { ...t, dueDate: newDate, updatedAt: nowIso };
        return updated;
      }
      return t;
    });

    setTasks(nextTasks);
    playClickTone(soundEnabled);
    triggerHaptic(25, vibrationEnabled);

    if (updated) {
      p2pService.broadcastMutation('update', updated, nextTasks);
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => setSyncStatus('offline'));
    }
  };

  const deleteTask = (id: string) => {
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    playClickTone(soundEnabled);
    triggerHaptic(30, vibrationEnabled);

    // Direct WebRTC broadcast
    p2pService.broadcastMutation('delete', undefined, remaining, id);

    fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    }).catch(() => setSyncStatus('offline'));
  };

  const clearCompleted = () => {
    const remaining = tasks.filter((t) => t.status !== 'completed');
    setTasks(remaining);
    playClickTone(soundEnabled);
    triggerHaptic(35, vibrationEnabled);

    // WebRTC broadcast
    p2pService.broadcastMutation('bulk', undefined, remaining);

    fetch('/api/tasks/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: remaining }),
    }).catch(() => setSyncStatus('offline'));
  };

  const resetSampleTasks = () => {
    const sample = getSampleTasks();
    setTasks(sample);
    playClickTone(soundEnabled);

    // WebRTC broadcast
    p2pService.broadcastMutation('bulk', undefined, sample);

    fetch('/api/tasks/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: sample }),
    }).catch(() => setSyncStatus('offline'));
  };

  const importTasks = (importedTasks: Task[]) => {
    if (Array.isArray(importedTasks) && importedTasks.length > 0) {
      setTasks(importedTasks);
      playClickTone(soundEnabled);

      // WebRTC broadcast
      p2pService.broadcastMutation('bulk', undefined, importedTasks);

      fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: importedTasks }),
      }).catch(() => setSyncStatus('offline'));
    }
  };

  return {
    tasks,
    syncStatus,
    connectedDevices,
    lastAddedTaskId,
    p2pStats,
    changeP2PRoom: (newRoom: string) => p2pService.setRoomId(newRoom),
    syncP2PNow: () => p2pService.triggerFullSync(tasks),
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
