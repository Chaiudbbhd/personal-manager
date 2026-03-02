import React, { useState, useMemo } from 'react';
import { Search, FileText, Layout, X } from 'lucide-react';
import { Page, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
  tasks: Task[];
  onPageSelect: (id: string) => void;
  onTaskSelect: () => void;
}

export default function SearchModal({ 
  isOpen, 
  onClose, 
  pages, 
  tasks, 
  onPageSelect, 
  onTaskSelect 
}: SearchModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { pages: [], tasks: [] };
    
    const lowerQuery = query.toLowerCase();
    
    const filteredPages = pages.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) || 
      p.content.toLowerCase().includes(lowerQuery)
    );
    
    const filteredTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) || 
      t.description.toLowerCase().includes(lowerQuery)
    );
    
    return { pages: filteredPages, tasks: filteredTasks };
  }, [query, pages, tasks]);

  const hasResults = results.pages.length > 0 || results.tasks.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-bg-sidebar border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-4 border-b border-border-main flex items-center gap-3">
              <Search className="w-5 h-5 text-text-muted" />
              <input
                autoFocus
                type="text"
                placeholder="Search pages and tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-text-primary placeholder-text-muted/50"
              />
              <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {!query.trim() ? (
                <div className="p-10 text-center text-text-muted">
                  <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  <p>Type to start searching...</p>
                </div>
              ) : !hasResults ? (
                <div className="p-10 text-center text-text-muted">
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.pages.length > 0 && (
                    <div>
                      <h3 className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-widest">Pages</h3>
                      <div className="space-y-1">
                        {results.pages.map(page => (
                          <button
                            key={page.id}
                            onClick={() => {
                              onPageSelect(page.id);
                              onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover text-left transition-colors group"
                          >
                            <span className="text-xl shrink-0">{page.icon || '📄'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-text-primary truncate">{page.title}</div>
                              <div className="text-xs text-text-muted truncate opacity-60">
                                {page.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.tasks.length > 0 && (
                    <div>
                      <h3 className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-widest">Tasks</h3>
                      <div className="space-y-1">
                        {results.tasks.map(task => (
                          <button
                            key={task.id}
                            onClick={() => {
                              onTaskSelect();
                              onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover text-left transition-colors group"
                          >
                            <div className="w-8 h-8 bg-accent-blue/10 rounded flex items-center justify-center shrink-0">
                              <Layout className="w-4 h-4 text-accent-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-text-primary truncate">{task.title}</div>
                              <div className="text-xs text-text-muted truncate opacity-60">
                                {task.date} • {task.category}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-bg-sidebar border-t border-border-main flex items-center justify-between text-[10px] text-text-muted">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="px-1 bg-bg-secondary rounded border border-border-main">↵</kbd> to select</span>
                <span className="flex items-center gap-1"><kbd className="px-1 bg-bg-secondary rounded border border-border-main">esc</kbd> to close</span>
              </div>
              <div>{results.pages.length + results.tasks.length} results</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
