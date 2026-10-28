import React, { useState, useEffect } from 'react';
import { X, Pin, Bell } from 'lucide-react';
import { Task, TaskPriority, TaskCategory } from '../types';
import { formatDateKey, calculatePrepDeadline, addDays } from '../utils/date';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  initialTask?: Task | null;
  prefilledDate?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  prefilledDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('General');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Deadline');
  const [dueDate, setDueDate] = useState(prefilledDate || formatDateKey());
  const [dueTime, setDueTime] = useState('');
  const [pinned, setPinned] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isImportantDate, setIsImportantDate] = useState(false);
  const [eventDate, setEventDate] = useState(
    prefilledDate ? addDays(prefilledDate, 7) : formatDateKey()
  );

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setProject(initialTask.project || 'General');
      setPriority(initialTask.priority);
      setCategory(initialTask.category || 'Deadline');
      setDueDate(initialTask.dueDate);
      setDueTime(initialTask.dueTime || '');
      setPinned(initialTask.pinned);
      setReminderEnabled(initialTask.reminderEnabled);
      setIsImportantDate(Boolean(initialTask.isImportantDate));
      setEventDate(
        initialTask.eventDate ||
          (initialTask.dueDate ? addDays(initialTask.dueDate, 7) : formatDateKey())
      );
    } else {
      setTitle('');
      setDescription('');
      setProject('General');
      setPriority('medium');
      setCategory('Deadline');
      setDueDate(prefilledDate || formatDateKey());
      setDueTime('');
      setPinned(false);
      setReminderEnabled(true);
      setIsImportantDate(false);
      setEventDate(prefilledDate ? addDays(prefilledDate, 7) : formatDateKey());
    }
  }, [initialTask, isOpen, prefilledDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDueDate = isImportantDate ? calculatePrepDeadline(eventDate, 7) : dueDate;

    onSave({
      id: initialTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      project: project.trim() || (isImportantDate ? 'Holidays' : 'General'),
      priority: isImportantDate ? 'urgent' : priority,
      category,
      dueDate: finalDueDate,
      dueTime: dueTime || undefined,
      status: initialTask?.status === 'completed' ? 'completed' : 'todo',
      subtasks: [],
      pinned,
      reminderEnabled: isImportantDate ? true : reminderEnabled,
      isImportantDate,
      eventDate: isImportantDate ? eventDate : undefined,
      eventName: isImportantDate ? title.trim() : undefined,
      leadDaysNotice: 7,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center safe-modal-overlay bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col safe-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Task Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                required
                disabled={isImportantDate}
                value={isImportantDate ? calculatePrepDeadline(eventDate, 7) : dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Due Time (Optional)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Priority & Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                List / Tag
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. Work, Personal"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note or link..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          {/* Optional Holiday / Event 7-Day Advance Toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Event / Holiday (7-Day Advance Deadline)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically sets the task due date 7 days before the event date.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isImportantDate}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsImportantDate(checked);
                  if (checked) {
                    setPriority('urgent');
                    setReminderEnabled(true);
                    setDueDate(calculatePrepDeadline(eventDate, 7));
                  }
                }}
                className="w-4 h-4 rounded text-indigo-600 shrink-0"
              />
            </label>

            {isImportantDate && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      setDueDate(calculatePrepDeadline(e.target.value, 7));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Due Date (7d Early)
                  </label>
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-mono font-semibold text-amber-800 dark:text-amber-300">
                    {calculatePrepDeadline(eventDate, 7)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pin to top</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Deadline alert</span>
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition active:scale-95"
            >
              {initialTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
