import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowUpDown,
  Tag,
  AlertCircle,
  FolderKanban,
  Download,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';
import { isPastCelebrationTask } from '../utils/date';
import { TaskCard } from './TaskCard';

interface WorklistViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number, customDate?: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
  onOpenQuickAdd: () => void;
  onClearCompleted: () => void;
}

export const WorklistView: React.FC<WorklistViewProps> = ({
  tasks,
  onToggleStatus,
  onToggleSubtask,
  onDelete,
  onReschedule,
  onTogglePin,
  onEdit,
  onOpenQuickAdd,
  onClearCompleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'priority' | 'project'>('none');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('dueDate');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter (passed Persediaan Sambutan tasks are left quietly in 'all' rather than nagging in 'active')
      if (statusFilter === 'active' && (task.status === 'completed' || isPastCelebrationTask(task))) return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;

      // Category filter
      if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== 'All' && task.priority !== selectedPriority.toLowerCase()) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesProject = task.project.toLowerCase().includes(q);
        const matchesSubtasks = task.subtasks.some((st) => st.title.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesProject && !matchesSubtasks) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      if (sortBy === 'dueDate') {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        const weight: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, statusFilter, selectedCategory, selectedPriority, searchQuery, sortBy]);

  const categories: string[] = ['All', 'Work', 'Meeting', 'Review', 'Deadline', 'Personal'];
  const priorities: string[] = ['All', 'Urgent', 'High', 'Medium', 'Low'];

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const activeCount = tasks.filter(
    (t) => t.status !== 'completed' && !isPastCelebrationTask(t)
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across worklists, projects, deliverables..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Done ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({tasks.length})
            </button>
          </div>

          {/* Sort & Group by */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="created">Sort by Date Created</option>
              </select>
            </div>

            {completedCount > 0 && statusFilter !== 'active' && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-medium"
                title="Clear completed tasks"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Done</span>
              </button>
            )}
          </div>
        </div>

        {/* Category & Priority Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">
            Priority:
          </span>
          {priorities.map((pri) => (
            <button
              key={pri}
              type="button"
              onClick={() => setSelectedPriority(pri)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                selectedPriority === pri
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* Task Stream List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No tasks match your filters
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try resetting your search query or switching filters to view your full worklist.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedPriority('All');
                  setStatusFilter('all');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
              >
                + Create New Task
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onToggleSubtask={onToggleSubtask}
                onDelete={onDelete}
                onReschedule={onReschedule}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
