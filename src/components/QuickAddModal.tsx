import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  Pin,
  Bell,
  Tag,
  Check,
  Loader2,
} from 'lucide-react';
import { Task, TaskPriority, TaskCategory, Subtask } from '../types';
import { formatDateKey, calculatePrepDeadline, addDays } from '../utils/date';
import { decomposeTaskAI } from '../services/geminiService';

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
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [dueDate, setDueDate] = useState(prefilledDate || formatDateKey());
  const [dueTime, setDueTime] = useState('');
  const [pinned, setPinned] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isImportantDate, setIsImportantDate] = useState(false);
  const [eventDate, setEventDate] = useState(prefilledDate ? addDays(prefilledDate, 7) : formatDateKey());

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setProject(initialTask.project);
      setPriority(initialTask.priority);
      setCategory(initialTask.category);
      setDueDate(initialTask.dueDate);
      setDueTime(initialTask.dueTime || '');
      setPinned(initialTask.pinned);
      setReminderEnabled(initialTask.reminderEnabled);
      setSubtasks(initialTask.subtasks || []);
      setIsImportantDate(initialTask.isImportantDate || false);
      setEventDate(initialTask.eventDate || (initialTask.dueDate ? addDays(initialTask.dueDate, 7) : formatDateKey()));
    } else {
      setTitle('');
      setDescription('');
      setProject('General');
      setPriority('medium');
      setCategory('Work');
      setDueDate(prefilledDate || formatDateKey());
      setDueTime('');
      setPinned(false);
      setReminderEnabled(true);
      setSubtasks([]);
      setIsImportantDate(false);
      setEventDate(prefilledDate ? addDays(prefilledDate, 7) : formatDateKey());
    }
  }, [initialTask, isOpen, prefilledDate]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleAIDecompose = async () => {
    if (!title.trim() || isDecomposing) return;
    setIsDecomposing(true);
    try {
      const generated = await decomposeTaskAI(title, project);
      setSubtasks((prev) => [...prev, ...generated]);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDueDate = isImportantDate ? calculatePrepDeadline(eventDate, 7) : dueDate;

    onSave({
      id: initialTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      project: project.trim() || (isImportantDate ? 'Perayaan & Cuti' : 'General'),
      priority: isImportantDate ? 'urgent' : priority,
      category,
      dueDate: finalDueDate,
      dueTime: dueTime || undefined,
      status: initialTask?.status || 'todo',
      subtasks,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {initialTask ? 'Edit Task Details' : 'Create New Deliverable'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Submit Q4 Client Deliverables & Milestone Report"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Description & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, links, requirements, or acceptance criteria..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          {/* Project & Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Project / Worklist
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. Core Engineering"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Work">Work</option>
                <option value="Meeting">Meeting</option>
                <option value="Review">Review</option>
                <option value="Deadline">Deadline</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          {/* Important Date / Celebration Toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🇲🇾</span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                    Tarikh Penting / Perayaan (Auto Dateline 7 Hari Sebelum)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sistem akan menetapkan dateline tugasan dan amaran notifikasi tepat 7 hari sebelum acara.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {isImportantDate && (
              <div className="pt-2 border-t border-amber-200 dark:border-amber-900/40 space-y-2 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                      Tarikh Acara / Sambutan Sebenar (Event Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => {
                        setEventDate(e.target.value);
                        setDueDate(calculatePrepDeadline(e.target.value, 7));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                      Dateline Persediaan (Auto 7 Hari Sebelum)
                    </label>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>{calculatePrepDeadline(eventDate, 7)}</span>
                      <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.2 rounded font-bold">
                        T-7 Dateline
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>Notifikasi amaran akan dihantar tepat 7 hari sebelum ({calculatePrepDeadline(eventDate, 7)}).</span>
                </div>
              </div>
            )}
          </div>

          {/* Priority & Deadline Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-semibold"
              >
                <option value="urgent">🚨 Urgent</option>
                <option value="high">⚠️ High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">🌱 Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Checklist / Subtasks Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Checklist Subtasks ({subtasks.length})
              </label>

              <button
                type="button"
                onClick={handleAIDecompose}
                disabled={!title.trim() || isDecomposing}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition"
              >
                {isDecomposing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Decomposing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>✨ Break down with AI</span>
                  </>
                )}
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                  >
                    <span className="text-xs text-slate-800 dark:text-slate-200 truncate flex-1">
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add sub-deliverable step..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Toggles (Pinned, Reminder) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pin to top</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Deadline Alerts</span>
              </span>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
