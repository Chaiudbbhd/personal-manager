import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Plus, Search, Filter, ArrowUpDown, 
  MoreHorizontal, Calendar, Layout, List, Clock, 
  User, Tag, AlertCircle, ChevronRight, X, 
  Paperclip, MessageSquare, History, CheckSquare,
  Trash2, Copy, Download, Upload, Archive,
  BarChart3, ChevronDown, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Task, Subtask, TaskAttachment, TaskComment, UserProfile } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewType = 'table' | 'board' | 'calendar' | 'timeline';

interface TaskTrackerDashboardProps {
  profile: UserProfile;
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => Promise<any>;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskTrackerDashboard({ 
  profile, 
  tasks: initialTasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask 
}: TaskTrackerDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<ViewType>('table');
  
  // Sync local state with props
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<keyof Task>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleCreateTask = async (title = 'New Task', parentId: string | null = null) => {
    const newTask = await onAddTask({ title, parentId });
    if (newTask && !parentId) {
      setSelectedTask(newTask);
      setIsDetailsOpen(true);
    }
    return newTask;
  };

  const handleUpdateTaskLocal = async (id: string, updates: Partial<Task>) => {
    onUpdateTask(id, updates);
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteTaskLocal = async (id: string) => {
    onDeleteTask(id);
    if (selectedTask?.id === id) {
      setIsDetailsOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) return;
    for (const id of selectedTaskIds) {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    }
    setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
    setSelectedTaskIds([]);
  };

  const handleDuplicateTask = async (task: Task) => {
    const { id, createdAt, lastUpdated, ...rest } = task;
    handleCreateTask(task.title + ' (Copy)');
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        // Only show root tasks in main views
        if (t.parentId) return false;
        
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(t.status);
        const matchesPriority = filterPriority.length === 0 || filterPriority.includes(t.priority);
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [tasks, searchQuery, filterStatus, filterPriority, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, pending, percentage };
  }, [tasks]);

  const chartData = [
    { name: 'Completed', value: stats.completed, color: 'var(--accent-green)' },
    { name: 'In Progress', value: stats.inProgress, color: 'var(--accent-blue)' },
    { name: 'Not Started', value: tasks.filter(t => t.status === 'Not Started').length, color: 'var(--text-muted)' },
    { name: 'On Hold', value: tasks.filter(t => t.status === 'On Hold').length, color: 'var(--accent-amber)' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-border-main bg-bg-sidebar">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Task Tracker</h2>
              <p className="text-sm text-text-secondary">Manage, track and collaborate on your team tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleCreateTask()}
              className="flex items-center gap-2 px-4 py-2 bg-accent-green hover:bg-accent-green/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent-green/20"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">Total Tasks</p>
              <h3 className="text-2xl font-bold text-text-primary">{stats.total}</h3>
            </div>
            <BarChart3 className="w-8 h-8 text-text-muted/30" />
          </div>
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">Completed</p>
              <h3 className="text-2xl font-bold text-accent-green">{stats.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-accent-green/20 border-t-accent-green flex items-center justify-center text-[10px] font-bold text-accent-green">
              {stats.percentage}%
            </div>
          </div>
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">In Progress</p>
              <h3 className="text-2xl font-bold text-accent-blue">{stats.inProgress}</h3>
            </div>
            <Clock className="w-8 h-8 text-accent-blue/20" />
          </div>
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">Pending</p>
              <h3 className="text-2xl font-bold text-accent-amber">{stats.pending}</h3>
            </div>
            <AlertCircle className="w-8 h-8 text-accent-amber/20" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl border border-border-main">
            <button 
              onClick={() => setView('table')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'table' ? "bg-accent-blue text-white shadow-lg" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
            <button 
              onClick={() => setView('board')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'board' ? "bg-accent-blue text-white shadow-lg" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Layout className="w-3.5 h-3.5" />
              Board
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'calendar' ? "bg-accent-blue text-white shadow-lg" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button 
              onClick={() => setView('timeline')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'timeline' ? "bg-accent-blue text-white shadow-lg" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-bg-secondary border border-border-main rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent-blue transition-colors w-64 text-text-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-bg-secondary border border-border-main rounded-xl text-text-muted hover:text-text-primary transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 bg-bg-secondary border border-border-main rounded-xl text-text-muted hover:text-text-primary transition-colors">
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <div className="h-6 w-px bg-border-main mx-1" />
              <button 
                onClick={handleBulkDelete}
                disabled={selectedTaskIds.length === 0}
                className="p-2 bg-bg-secondary border border-border-main rounded-xl text-text-muted hover:text-accent-red transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="p-2 bg-bg-secondary border border-border-main rounded-xl text-text-muted hover:text-text-primary transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {view === 'table' && (
              <TableView 
                tasks={filteredTasks} 
                onSelect={(t) => { setSelectedTask(t); setIsDetailsOpen(true); }}
                onUpdate={handleUpdateTaskLocal}
                selectedIds={selectedTaskIds}
                onToggleSelect={(id) => setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                onSelectAll={() => setSelectedTaskIds(selectedTaskIds.length === filteredTasks.length ? [] : filteredTasks.map(t => t.id))}
              />
            )}
            {view === 'board' && (
              <BoardView 
                tasks={filteredTasks} 
                onUpdate={handleUpdateTaskLocal}
                onSelect={(t) => { setSelectedTask(t); setIsDetailsOpen(true); }}
              />
            )}
            {view === 'calendar' && (
              <CalendarView 
                tasks={filteredTasks} 
                onSelect={(t) => { setSelectedTask(t); setIsDetailsOpen(true); }}
              />
            )}
            {view === 'timeline' && (
              <TimelineView 
                tasks={filteredTasks} 
                onSelect={(t) => { setSelectedTask(t); setIsDetailsOpen(true); }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Details Panel */}
        <AnimatePresence>
          {isDetailsOpen && selectedTask && (
            <TaskDetailsPanel 
              task={selectedTask}
              onClose={() => setIsDetailsOpen(false)}
              onUpdate={handleUpdateTaskLocal}
              onDelete={handleDeleteTaskLocal}
              onDuplicate={handleDuplicateTask}
              profile={profile}
              allTasks={tasks}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-components ---

function TableView({ tasks, onSelect, onUpdate, selectedIds, onToggleSelect, onSelectAll }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden"
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-main bg-bg-sidebar">
            <th className="p-4 w-10">
              <input 
                type="checkbox" 
                checked={tasks.length > 0 && selectedIds.length === tasks.length}
                onChange={onSelectAll}
                className="rounded border-border-main bg-bg-secondary text-accent-blue focus:ring-accent-blue" 
              />
            </th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Task Name</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Priority</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Assignee</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Due Date</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Tags</th>
            <th className="p-4 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main">
          {tasks.map((task: Task) => (
            <tr 
              key={task.id} 
              className={cn(
                "hover:bg-bg-hover transition-colors group cursor-pointer",
                selectedIds.includes(task.id) && "bg-accent-blue/5"
              )}
              onClick={() => onSelect(task)}
            >
              <td className="p-4" onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  className="rounded border-border-main bg-bg-secondary text-accent-blue focus:ring-accent-blue" 
                />
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">{task.title}</span>
                  {isPast(new Date(task.date)) && task.status !== 'Completed' && (
                    <span className="text-[10px] font-bold text-accent-red bg-accent-red/10 px-1.5 py-0.5 rounded uppercase">Overdue</span>
                  )}
                </div>
              </td>
              <td className="p-4">
                <StatusBadge status={task.status} />
              </td>
              <td className="p-4">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-[10px] font-bold text-accent-blue">
                    {task.assignedTo ? task.assignedTo[0].toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                  <span className="text-xs text-text-secondary">{task.assignedTo || 'Unassigned'}</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.date), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {JSON.parse(task.tags || '[]').map((tag: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 bg-bg-primary text-text-muted rounded text-[10px] font-medium border border-border-main">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-4">
                <button className="p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="p-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-text-muted">No tasks found</h4>
          <p className="text-sm text-text-muted/60">Try adjusting your filters or create a new task</p>
        </div>
      )}
    </motion.div>
  );
}

function BoardView({ tasks, onUpdate, onSelect }: any) {
  const columns = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-6 h-full overflow-x-auto pb-4"
    >
      {columns.map(status => (
        <div key={status} className="w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest">{status}</h4>
              <span className="px-2 py-0.5 bg-bg-secondary rounded-full text-[10px] font-bold text-text-muted">
                {tasks.filter((t: Task) => t.status === status).length}
              </span>
            </div>
            <button className="p-1 hover:bg-bg-secondary rounded text-text-muted hover:text-text-primary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 space-y-3">
            {tasks.filter((t: Task) => t.status === status).map((task: Task) => (
              <motion.div
                layoutId={task.id}
                key={task.id}
                onClick={() => onSelect(task)}
                className="bg-bg-secondary border border-border-main rounded-xl p-4 hover:border-accent-blue/50 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <PriorityBadge priority={task.priority} />
                  <button className="p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <h5 className="text-sm font-bold text-text-primary mb-2">{task.title}</h5>
                <p className="text-xs text-text-secondary line-clamp-2 mb-4">{task.description || 'No description'}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-border-main">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.date), 'MMM d')}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-[10px] font-bold text-accent-blue">
                    {task.assignedTo ? task.assignedTo[0].toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function CalendarView({ tasks, onSelect }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const start = startOfWeek(currentDate);
  const end = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start, end });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden flex flex-col h-full"
    >
      <div className="p-4 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <h3 className="text-sm font-bold text-text-primary">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1.5 hover:bg-bg-hover rounded text-text-muted">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-bg-primary rounded text-xs font-bold text-text-secondary border border-border-main">Today</button>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1.5 hover:bg-bg-hover rounded text-text-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-7 divide-x divide-border-main">
        {days.map(day => (
          <div key={day.toString()} className="flex flex-col min-h-[400px]">
            <div className={cn(
              "p-3 text-center border-b border-border-main",
              isToday(day) ? "bg-accent-blue/10" : "bg-bg-sidebar"
            )}>
              <p className="text-[10px] font-bold text-text-muted uppercase mb-1">{format(day, 'EEE')}</p>
              <p className={cn(
                "text-lg font-bold",
                isToday(day) ? "text-accent-blue" : "text-text-secondary"
              )}>{format(day, 'd')}</p>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {tasks.filter((t: Task) => isSameDay(new Date(t.date), day)).map((task: Task) => (
                <div 
                  key={task.id}
                  onClick={() => onSelect(task)}
                  className="p-2 bg-bg-primary border border-border-main rounded-lg cursor-pointer hover:border-accent-blue transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      task.priority === 'Urgent' ? "bg-accent-red" : 
                      task.priority === 'High' ? "bg-accent-amber" : "bg-accent-blue"
                    )} />
                    <p className="text-[10px] font-bold text-text-primary truncate">{task.title}</p>
                  </div>
                  <p className="text-[9px] text-text-muted">{task.status}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TimelineView({ tasks, onSelect }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-bg-secondary border border-border-main rounded-2xl p-20 text-center"
    >
      <Clock className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
      <h4 className="text-lg font-bold text-text-muted">Timeline View</h4>
      <p className="text-sm text-text-muted/60">Coming soon in the next update!</p>
    </motion.div>
  );
}

function TaskDetailsPanel({ task, onClose, onUpdate, onDelete, onDuplicate, profile, allTasks }: any) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  
  useEffect(() => {
    // Filter subtasks from the central tasks list
    const subs = allTasks.filter((t: Task) => t.parentId === task.id);
    setSubtasks(subs);
    fetchComments();
  }, [task.id, allTasks]);

  const fetchComments = async () => {
    const token = localStorage.getItem('lpk_token');
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setComments(await res.json());
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim() || isCreatingSubtask) return;
    
    setIsCreatingSubtask(true);
    console.log('TaskDetails: Creating subtask for parent:', task.id);
    
    try {
      const token = localStorage.getItem('lpk_token');
      const res = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newSubtask, 
          parentId: task.id,
          category: task.category,
          date: task.date
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('TaskDetails: Subtask created successfully:', data.id);
        // We don't need to manually update subtasks state because it's derived from allTasks via useEffect
        // But we need to ensure the parent component updates allTasks
        // In this implementation, TaskTrackerDashboard's handleCreateTask already updates tasks state
        // However, we are calling fetch directly here. Let's use a callback instead for better sync.
        setNewSubtask('');
      }
    } catch (err) {
      console.error('TaskDetails: Failed to create subtask', err);
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  const handleToggleSubtask = async (sub: Task) => {
    const token = localStorage.getItem('lpk_token');
    const res = await fetch(`/api/tasks/${sub.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ completed: !sub.completed, status: !sub.completed ? 'Completed' : 'In Progress' })
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(sub.id, updated);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const token = localStorage.getItem('lpk_token');
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: newComment })
    });
    if (res.ok) {
      const data = await res.json();
      setComments(prev => [...prev, data]);
      setNewComment('');
    }
  };

  const progress = subtasks.length > 0 
    ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-[450px] border-l border-border-main bg-bg-primary flex flex-col shadow-2xl z-50"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onUpdate(task.id, { completed: !task.completed, status: !task.completed ? 'Completed' : 'In Progress' })}
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
              task.completed ? "bg-accent-green border-accent-green text-white" : "border-border-main hover:border-text-muted"
            )}
          >
            {task.completed && <CheckSquare className="w-4 h-4" />}
          </button>
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Task Details</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDuplicate(task)} className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-all">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border-main mx-1" />
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Title & Description */}
        <div className="space-y-4">
          <input 
            type="text"
            value={task.title}
            onChange={e => onUpdate(task.id, { title: e.target.value })}
            className="w-full bg-transparent text-2xl font-bold text-text-primary border-none focus:outline-none placeholder-text-muted/30"
            placeholder="Task Title"
          />
          <textarea 
            value={task.description || ''}
            onChange={e => onUpdate(task.id, { description: e.target.value })}
            className="w-full bg-transparent text-sm text-text-secondary border-none focus:outline-none placeholder-text-muted/30 resize-none min-h-[100px]"
            placeholder="Add a description..."
          />
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-6 py-6 border-y border-border-main">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Status
            </label>
            <select 
              value={task.status}
              onChange={e => onUpdate(task.id, { status: e.target.value as any, completed: e.target.value === 'Completed' ? 1 : 0 })}
              className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Priority
            </label>
            <select 
              value={task.priority}
              onChange={e => onUpdate(task.id, { priority: e.target.value as any })}
              className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Due Date
            </label>
            <input 
              type="date"
              value={task.date}
              onChange={e => onUpdate(task.id, { date: e.target.value })}
              className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> Assignee
            </label>
            <div className="flex items-center gap-2 p-2 bg-bg-secondary border border-border-main rounded-lg">
              <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center text-[10px] font-bold text-accent-blue">
                {task.assignedTo ? task.assignedTo[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="text-xs text-text-secondary">{task.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-accent-green" />
              Subtasks
            </h4>
            <span className="text-[10px] font-bold text-text-muted">{progress}%</span>
          </div>
          
          <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-accent-green"
            />
          </div>

          <div className="space-y-2">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 group pl-4 border-l-2 border-border-main/30 ml-2">
                <button 
                  onClick={() => handleToggleSubtask(sub)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    sub.completed ? "bg-accent-green border-accent-green text-white" : "border-border-main hover:border-text-muted"
                  )}
                >
                  {sub.completed && <CheckSquare className="w-3 h-3" />}
                </button>
                <span className={cn("text-xs transition-all", sub.completed ? "text-text-muted line-through" : "text-text-secondary")}>
                  {sub.title}
                </span>
                <button 
                  onClick={() => onDelete(sub.id)}
                  className="p-1 text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-3 mt-4 pl-4">
              <Plus className="w-4 h-4 text-text-muted" />
              <input 
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder={isCreatingSubtask ? "Creating..." : "Add a subtask..."}
                disabled={isCreatingSubtask}
                className="flex-1 bg-transparent text-xs text-text-secondary border-none focus:outline-none placeholder-text-muted/30"
              />
            </form>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent-blue" />
            Comments
          </h4>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full bg-bg-secondary shrink-0" />
                <div className="flex-1 bg-bg-secondary border border-border-main rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-text-secondary">{comment.userName}</span>
                    <span className="text-[9px] text-text-muted">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
            <form onSubmit={handleAddComment} className="flex gap-3">
              <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded-full bg-bg-secondary shrink-0" />
              <input 
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-bg-secondary border border-border-main rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              />
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Not Started': 'bg-text-muted/10 text-text-muted',
    'In Progress': 'bg-accent-blue/10 text-accent-blue',
    'Completed': 'bg-accent-green/10 text-accent-green',
    'On Hold': 'bg-accent-amber/10 text-accent-amber',
  };
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", colors[status] || colors['Not Started'])}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    'Low': 'bg-blue-500/10 text-blue-400',
    'Medium': 'bg-accent-green/10 text-accent-green',
    'High': 'bg-accent-amber/10 text-accent-amber',
    'Urgent': 'bg-accent-red/10 text-accent-red',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap border border-transparent", colors[priority] || colors['Medium'])}>
      {priority}
    </span>
  );
}
