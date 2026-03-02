import React from 'react';
import { Clock, X, CheckCircle2, Circle, Calendar, Layout } from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onUpdateTask: (id: string, data: Partial<Task>) => void;
}

export default function UpdatesModal({ 
  isOpen, 
  onClose, 
  tasks, 
  onUpdateTask 
}: UpdatesModalProps) {
  const unfinishedTasks = tasks.filter(t => t.completed === 0).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-end pt-[8vh] pr-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className="relative w-full max-w-md bg-bg-sidebar border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-blue" />
                <h2 className="font-bold text-text-primary">Pending Updates</h2>
                <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue text-[10px] font-bold rounded-full border border-accent-blue/20">
                  {unfinishedTasks.length}
                </span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {unfinishedTasks.length === 0 ? (
                <div className="py-20 text-center text-text-muted">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm">All caught up! No pending tasks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unfinishedTasks.map(task => (
                    <div 
                      key={task.id}
                      className="group bg-bg-secondary border border-border-main rounded-xl p-4 hover:border-accent-blue/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => onUpdateTask(task.id, { completed: 1 })}
                          className="mt-1 shrink-0 text-text-muted hover:text-accent-blue transition-colors"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-accent-blue transition-colors">
                            {task.title}
                          </h4>
                          
                          <div className="flex flex-wrap gap-3 mt-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase tracking-widest">
                              <Calendar className="w-3 h-3" />
                              <span>{format(parseISO(task.date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase tracking-widest">
                              <Layout className="w-3 h-3" />
                              <span className="capitalize">{task.category}</span>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-text-muted mt-2 line-clamp-2 leading-relaxed italic">
                              "{task.description}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-bg-sidebar border-t border-border-main text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                Stay focused, stay productive
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
