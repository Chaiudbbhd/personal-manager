import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, CheckCircle2, Circle, Calendar, 
  Clock, Tag, ChevronLeft, ChevronRight, MoreVertical,
  Edit2, Save, X, Layout
} from 'lucide-react';
import { Task, WeekPlan } from '../types';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdvancedPlannerProps {
  tasks: Task[];
  weekPlans: WeekPlan[];
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddWeekPlan: (startDate: string, endDate: string) => void;
}

const CATEGORIES = ['study', 'project', 'personal', 'work', 'health'];
const CATEGORY_COLORS: Record<string, string> = {
  study: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
  project: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
  personal: 'bg-accent-green/20 text-accent-green border-accent-green/30',
  work: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
  health: 'bg-accent-red/20 text-accent-red border-accent-red/30',
};

export default function AdvancedPlanner({ 
  tasks, 
  weekPlans, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask,
  onAddWeekPlan
}: AdvancedPlannerProps) {
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null); // date string
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  const safeWeekPlans = Array.isArray(weekPlans) ? weekPlans : [];

  // Set initial selected week
  React.useEffect(() => {
    if (safeWeekPlans.length > 0 && !selectedWeekId) {
      setSelectedWeekId(safeWeekPlans[0].id);
    }
  }, [safeWeekPlans, selectedWeekId]);

  const filteredTasks = useMemo(() => {
    let result = Array.isArray(tasks) ? tasks : [];
    
    // Only show root tasks in the planner
    result = result.filter(t => !t.parentId);
    
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }
    
    if (filterStatus === 'completed') {
      result = result.filter(t => t.completed === 1);
    } else if (filterStatus === 'pending') {
      result = result.filter(t => t.completed === 0);
    }
    
    return result;
  }, [tasks, filterCategory, filterStatus]);

  const selectedWeek = useMemo(() => 
    safeWeekPlans.find(w => w.id === selectedWeekId) || safeWeekPlans[0], 
  [safeWeekPlans, selectedWeekId]);

  const days = useMemo(() => {
    if (!selectedWeek) return [];
    return eachDayOfInterval({
      start: parseISO(selectedWeek.startDate),
      end: parseISO(selectedWeek.endDate)
    });
  }, [selectedWeek]);

  const handleCreateNextWeek = () => {
    if (safeWeekPlans.length === 0) return;
    const lastWeek = safeWeekPlans[0];
    const nextStart = addDays(parseISO(lastWeek.endDate), 1);
    const nextEnd = addDays(nextStart, 6);
    const nextStartStr = (nextStart instanceof Date && !isNaN(nextStart.getTime()) && typeof nextStart.toISOString === 'function') 
      ? (nextStart.toISOString() || '').split('T')[0] 
      : '';
    const nextEndStr = (nextEnd instanceof Date && !isNaN(nextEnd.getTime()) && typeof nextEnd.toISOString === 'function') 
      ? (nextEnd.toISOString() || '').split('T')[0] 
      : '';
    if (nextStartStr && nextEndStr) {
      onAddWeekPlan(nextStartStr, nextEndStr);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6 text-accent-blue" />
            Study Planner
          </h1>
          <p className="text-sm text-text-muted mt-1">Manage your weekly routine and track progress.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-bg-secondary rounded-lg p-1 border border-border-main">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs font-medium text-text-muted focus:outline-none px-2 py-1 cursor-pointer hover:text-text-secondary transition-colors"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-border-main" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-text-muted focus:outline-none px-2 py-1 cursor-pointer hover:text-text-secondary transition-colors"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-center bg-bg-secondary rounded-lg p-1 border border-border-main">
            <button 
              onClick={() => {
                const idx = safeWeekPlans.findIndex(w => w.id === selectedWeekId);
                if (idx < safeWeekPlans.length - 1) setSelectedWeekId(safeWeekPlans[idx + 1].id);
              }}
              className="p-1.5 hover:bg-bg-hover rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 text-sm font-medium min-w-[200px] text-center text-text-secondary">
              {selectedWeek ? (
                `${format(parseISO(selectedWeek.startDate), 'MMM d')} - ${format(parseISO(selectedWeek.endDate), 'MMM d, yyyy')}`
              ) : 'No week selected'}
            </div>
            <button 
              onClick={() => {
                const idx = safeWeekPlans.findIndex(w => w.id === selectedWeekId);
                if (idx > 0) setSelectedWeekId(safeWeekPlans[idx - 1].id);
              }}
              className="p-1.5 hover:bg-bg-hover rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleCreateNextWeek}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent-blue/20"
          >
            <Plus className="w-4 h-4" />
            Next Week
          </button>
        </div>
      </div>

      {/* Planner Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {days.map(day => {
            const dayIso = day instanceof Date && !isNaN(day.getTime()) ? day.toISOString() : null;
            if (!dayIso) return null;
            
            return (
              <DayColumn 
                key={dayIso}
                day={day}
                tasks={filteredTasks.filter(t => isSameDay(parseISO(t.date), day))}
                onAddTask={() => setIsAddingTask(dayIso)}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onEditTask={(id) => setEditingTaskId(id)}
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingTask || editingTaskId) && (
          <TaskFormModal 
            task={editingTaskId ? tasks.find(t => t.id === editingTaskId) : undefined}
            defaultDate={isAddingTask ? isAddingTask : undefined}
            onClose={() => {
              setIsAddingTask(null);
              setEditingTaskId(null);
            }}
            onSave={(data) => {
              if (editingTaskId) {
                onUpdateTask(editingTaskId, data);
              } else {
                onAddTask(data);
              }
              setIsAddingTask(null);
              setEditingTaskId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface DayColumnProps {
  day: Date;
  tasks: Task[];
  onAddTask: () => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string) => void;
}

function DayColumn({ day, tasks, onAddTask, onUpdateTask, onDeleteTask, onEditTask }: DayColumnProps) {
  const isToday = isSameDay(day, new Date());

  return (
    <div className={cn(
      "w-80 flex flex-col bg-bg-sidebar border border-border-main rounded-xl overflow-hidden",
      isToday && "ring-2 ring-accent-blue/50 border-accent-blue/50"
    )}>
      <div className={cn(
        "p-4 border-b border-border-main flex items-center justify-between",
        isToday ? "bg-accent-blue/10" : "bg-bg-secondary"
      )}>
        <div>
          <h3 className="font-bold text-text-primary">{format(day, 'EEEE')}</h3>
          <p className="text-xs text-text-muted">{format(day, 'MMM d')}</p>
        </div>
        <button 
          onClick={onAddTask}
          className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {tasks.length > 0 ? (
          <Reorder.Group 
            axis="y" 
            values={tasks} 
            onReorder={(newTasks) => {
              newTasks.forEach((t, i) => {
                if (t.sortOrder !== i) onUpdateTask(t.id, { sortOrder: i });
              });
            }}
            className="space-y-3"
          >
            {tasks.map(task => (
              <Reorder.Item 
                key={task.id} 
                value={task}
                className="cursor-grab active:cursor-grabbing"
              >
                <TaskCard 
                  task={task} 
                  onToggle={() => onUpdateTask(task.id, { completed: task.completed ? 0 : 1 })}
                  onDelete={() => onDeleteTask(task.id)}
                  onEdit={() => onEditTask(task.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg text-text-muted">
            <Clock className="w-6 h-6 mb-2 opacity-20" />
            <span className="text-xs">No tasks scheduled</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit }: { 
  task: Task, 
  onToggle: () => void, 
  onDelete: () => void,
  onEdit: () => void
}) {
  return (
    <div className={cn(
      "group bg-bg-secondary border border-border-main rounded-lg p-3 hover:border-border-strong transition-all",
      task.completed && "opacity-60 grayscale-[0.5]"
    )}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {task.completed ? (
            <CheckCircle2 className="w-4 h-4 text-accent-blue" />
          ) : (
            <Circle className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-medium truncate text-text-primary",
            task.completed && "line-through text-text-muted"
          )}>
            {task.title}
          </h4>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock className="w-3 h-3" />
              <span>{task.startTime} - {task.endTime}</span>
            </div>
            <div className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
              CATEGORY_COLORS[task.category] || CATEGORY_COLORS.personal
            )}>
              {task.category}
            </div>
          </div>

          {task.description && (
            <p className="text-[11px] text-text-muted mt-2 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
          <button onClick={onEdit} className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-accent-red">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskFormModal({ task, defaultDate, onClose, onSave }: {
  task?: Task,
  defaultDate?: string,
  onClose: () => void,
  onSave: (data: Partial<Task>) => void
}) {
  const [formData, setFormData] = useState<Partial<Task>>(task || {
    title: '',
    description: '',
    date: (() => {
      if (defaultDate) {
        try {
          const parsed = parseISO(defaultDate);
          if (parsed instanceof Date && !isNaN(parsed.getTime()) && typeof parsed.toISOString === 'function') {
            const iso = parsed.toISOString();
            if (iso && typeof iso.split === 'function') {
              return iso.split('T')[0];
            }
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
      const now = new Date();
      const nowIso = now.toISOString();
      return (nowIso && typeof nowIso.split === 'function') ? nowIso.split('T')[0] : '';
    })(),
    startTime: '09:00',
    endTime: '10:00',
    category: 'study',
    completed: 0
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-bg-sidebar border border-border-main rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">{task ? 'Edit Task' : 'New Task'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-lg text-text-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Title</label>
              <input
                autoFocus
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
                className="w-full bg-bg-secondary border border-border-main rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-main rounded-lg pl-10 pr-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-main rounded-lg pl-10 pr-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      formData.category === cat 
                        ? CATEGORY_COLORS[cat]
                        : "bg-bg-secondary border-border-main text-text-muted hover:border-border-strong"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add more details..."
                rows={3}
                className="w-full bg-bg-secondary border border-border-main rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-blue transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-bg-secondary border-t border-border-main flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.title}
            className="px-6 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 shadow-lg shadow-accent-blue/20"
          >
            <Save className="w-4 h-4" />
            Save Task
          </button>
        </div>
      </motion.div>
    </div>
  );
}
