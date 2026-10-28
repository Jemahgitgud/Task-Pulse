export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'Work' | 'Meeting' | 'Review' | 'Deadline' | 'Personal';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM (24-hour format)
  status: TaskStatus;
  subtasks: Subtask[];
  pinned: boolean;
  reminderEnabled: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface UserSettings {
  morningDigestTime: string; // '08:30'
  eveningSummaryTime: string; // '18:00'
  urgentAlertHoursBefore: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  permission: NotificationPermission | 'default';
  enabled: boolean;
}

export interface TaskAlert {
  id: string;
  taskId: string;
  title: string;
  message: string;
  urgency: 'critical' | 'warning' | 'info';
  timestamp: number;
}

export interface DailyDigest {
  headline: string;
  narrative: string;
  completionRate: number;
  completedToday: number;
  overdueCount: number;
  dueTodayCount: number;
  urgentCount: number;
  totalActive: number;
  streakDays: number;
}
