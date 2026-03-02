import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AdvancedPlanner from './components/AdvancedPlanner';
import Modal from './components/Modal';
import SearchModal from './components/SearchModal';
import SettingsModal from './components/settings/SettingsModal';
import UpdatesModal from './components/UpdatesModal';
import MeetingsView from './components/MeetingsView';
import CollaborationDashboard from './components/CollaborationDashboard';
import TaskTrackerDashboard from './components/TaskTrackerDashboard';
import CareerHubDashboard from './components/CareerHubDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TemplatesMarketplace from './components/TemplatesMarketplace';
import AuthPage from './components/auth/AuthPage';
import { Page, Task, WeekPlan, Template } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertTriangle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import { ShortcutsProvider, useShortcuts } from './contexts/ShortcutsContext';
import { TemplateProvider, useTemplates } from './contexts/TemplateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ShortcutsHelpModal from './components/ShortcutsHelpModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AppContent() {
  const { user, token, logout, login, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isTodoActive, setIsTodoActive] = useState(false);
  const [isMeetingsActive, setIsMeetingsActive] = useState(false);
  const [isCollaborationActive, setIsCollaborationActive] = useState(false);
  const [isTaskTrackerActive, setIsTaskTrackerActive] = useState(false);
  const [isCareerHubActive, setIsCareerHubActive] = useState(false);
  const [isAnalyticsActive, setIsAnalyticsActive] = useState(false);
  const [isTemplatesActive, setIsTemplatesActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);

  const { profile, settings } = useSettings();
  const { isHelpOpen, setIsHelpOpen, isFocusMode, setIsFocusMode } = useShortcuts();
  const { markAsUsed } = useTemplates();

  // Theme management
  useEffect(() => {
    if (settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings?.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Default to dark if not specified or other themes
      document.documentElement.classList.add('dark');
    }
  }, [settings?.theme]);

  const handleApplyTemplate = async (template: Template) => {
    try {
      const content = JSON.parse(template.content);
      await markAsUsed(template.id);

      if (content.type === 'page') {
        const newPage = await handleAddPage(undefined, template.title, content.content);
        if (newPage) {
          // Explicitly set active page and switch view to ensure consistency
          setActivePageId(newPage.id);
          setIsTemplatesActive(false);
          setIsTodoActive(false);
          setIsAnalyticsActive(false);
          setIsCareerHubActive(false);
          setIsTaskTrackerActive(false);
          setIsCollaborationActive(false);
          setIsMeetingsActive(false);
        }
      } else if (content.type === 'tasks') {
        const newPage = await handleAddPage(undefined, template.title, `<h1>${template.title}</h1><p>Tasks from template added to tracker.</p>`);
        if (newPage) {
          for (const item of content.items) {
            await handleAddTask({
              title: item.title,
              status: item.status,
              date: new Date().toISOString().split('T')[0]
            });
          }
          setActivePageId(newPage.id);
          setIsTaskTrackerActive(true);
          setIsTemplatesActive(false);
        }
      }
    } catch (error) {
      console.error('App: Failed to apply template:', error);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAuthSuccess = (newUser: any, newToken: string) => {
    console.log('App: Auth success, logging in', { user: newUser });
    login(newUser, newToken);
  };

  const handleLogout = useCallback(() => {
    console.log('App: Logging out');
    logout();
  }, [logout]);

  // Fetch initial data
  useEffect(() => {
    if (!token) {
      console.log('App: No token, skipping data fetch');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      console.log('App: Token detected, fetching initial data');
      setIsLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [pagesRes, tasksRes, weeksRes, userRes] = await Promise.all([
          fetch('/api/pages', { headers }),
          fetch('/api/tasks', { headers }),
          fetch('/api/week-plans', { headers }),
          fetch('/api/auth/me', { headers })
        ]);

        if (userRes.status === 401) {
          console.warn('App: Token invalid (401), logging out');
          handleLogout();
          return;
        }

        const [pagesData, tasksData, weeksData, userData] = await Promise.all([
          pagesRes.ok ? pagesRes.json().catch(() => []) : Promise.resolve([]),
          tasksRes.ok ? tasksRes.json().catch(() => []) : Promise.resolve([]),
          weeksRes.ok ? weeksRes.json().catch(() => []) : Promise.resolve([]),
          userRes.ok ? userRes.json().catch(() => null) : Promise.resolve(null)
        ]);
        
        console.log('App: Initial data fetched successfully', { 
          pages: pagesData.length, 
          tasks: tasksData.length,
          user: userData?.name
        });

        setPages(Array.isArray(pagesData) ? pagesData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setWeekPlans(Array.isArray(weeksData) ? weeksData : []);
        
        if (Array.isArray(pagesData) && pagesData.length > 0) {
          setActivePageId(pagesData[0].id);
        }
      } catch (error) {
        console.error('App: Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token, handleLogout]);

  const handleSync = async () => {
    if (!token || !isOnline) return;
    setIsSyncing(true);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'pages', data: pages })
      });
      // Simulated success
      setTimeout(() => setIsSyncing(false), 1000);
    } catch (err) {
      console.error("Sync failed", err);
      setIsSyncing(false);
    }
  };

  // Auto-sync
  useEffect(() => {
    if (isOnline && token && pages.length > 0) {
      const timer = setTimeout(handleSync, 30000); // Sync every 30s if changes
      return () => clearTimeout(timer);
    }
  }, [pages, isOnline, token]);

  // Page Actions
  const handleAddPage = async (parentId?: string, title: string = 'Untitled', content: string = '') => {
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, parentId })
      });
      const newPage = await res.json();
      setPages(prev => [newPage, ...prev]);
      setActivePageId(newPage.id);
      setIsTodoActive(false);
      setIsMeetingsActive(false);
      setIsCollaborationActive(false);
      setIsTaskTrackerActive(false);
      setIsCareerHubActive(false);
      setIsAnalyticsActive(false);
      setIsTemplatesActive(false);
      return newPage;
    } catch (error) {
      console.error('Failed to add page:', error);
    }
  };

  const handleUpdatePage = useCallback(async (id: string, data: Partial<Page>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to update page:', error);
    }
  }, [token]);

  const confirmDeletePage = (id: string) => {
    setPageToDelete(id);
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    const id = pageToDelete;
    console.log('App: Deleting page:', id);
    try {
      const res = await fetch(`/api/pages/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to delete page: ${res.statusText}`);
      }

      console.log('App: Page deleted successfully on server');
      
      // Remove the page and all its descendants from local state
      setPages(prev => {
        const toDelete = new Set([id]);
        let changed = true;
        while (changed) {
          changed = false;
          prev.forEach(p => {
            if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) {
              toDelete.add(p.id);
              changed = true;
            }
          });
        }
        return prev.filter(p => !toDelete.has(p.id));
      });

      if (activePageId === id) {
        const remainingPages = pages.filter(p => p.id !== id);
        setActivePageId(remainingPages.length > 0 ? remainingPages[0].id : null);
      }
      
      setPageToDelete(null);
    } catch (error) {
      console.error('App: Failed to delete page:', error);
      // Still close the modal to avoid getting stuck, but maybe show an alert
      setPageToDelete(null);
      alert('Failed to delete page. Please try again.');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleShortcut = (e: any) => {
      const id = e.detail;
      switch (id) {
        case 'new-page':
          handleAddPage();
          break;
        case 'new-task':
          setIsTodoActive(true);
          setActivePageId(null);
          // Focus task input if possible (would need a ref)
          break;
        case 'new-planner':
          // Logic for new planner? Maybe just switch to it
          setIsTodoActive(false);
          setIsMeetingsActive(false);
          setIsCollaborationActive(false);
          setIsTaskTrackerActive(false);
          setIsCareerHubActive(false);
          setIsAnalyticsActive(false);
          setActivePageId(null);
          break;
        case 'search':
          setIsSearchOpen(true);
          break;
        case 'analytics':
          setIsAnalyticsActive(true);
          setIsTodoActive(false);
          setIsMeetingsActive(false);
          setIsCollaborationActive(false);
          setIsTaskTrackerActive(false);
          setIsCareerHubActive(false);
          setActivePageId(null);
          break;
        case 'focus-mode':
          setIsFocusMode(!isFocusMode);
          break;
        case 'settings':
          setIsSettingsOpen(true);
          break;
        case 'help':
          setIsHelpOpen(true);
          break;
      }
    };
    window.addEventListener('app_shortcut', handleShortcut);
    return () => window.removeEventListener('app_shortcut', handleShortcut);
  }, [handleAddPage, isFocusMode]);

  // Task Actions
  const handleAddTask = async (taskData: Partial<Task>) => {
    console.log('App: Adding task:', taskData.title);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to add task: ${res.statusText}`);
      }
      
      const newTask = await res.json();
      console.log('App: Task added successfully:', newTask.id);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (error) {
      console.error('App: Failed to add task:', error);
    }
  };

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    console.log('App: Updating task:', id, data);
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update task: ${res.statusText}`);
      }
      
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error('App: Failed to update task:', error);
    }
  };

  const confirmDeleteTask = (id: string) => {
    setTaskToDelete(id);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete;
    console.log('App: Deleting task:', id);
    
    try {
      const res = await fetch(`/api/tasks/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to delete task: ${res.statusText}`);
      }

      console.log('App: Task deleted successfully on server');
      
      setTasks(prev => {
        // Recursively remove from local state
        const toDelete = new Set([id]);
        let changed = true;
        while (changed) {
          changed = false;
          prev.forEach(t => {
            if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
              toDelete.add(t.id);
              changed = true;
            }
          });
        }
        return prev.filter(t => !toDelete.has(t.id));
      });
      
      setTaskToDelete(null);
    } catch (error) {
      console.error('App: Failed to delete task:', error);
      setTaskToDelete(null);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleAddWeekPlan = async (startDate: string, endDate: string) => {
    try {
      const res = await fetch('/api/week-plans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ startDate, endDate })
      });
      const newPlan = await res.json();
      setWeekPlans(prev => [newPlan, ...prev]);
    } catch (error) {
      console.error('Failed to add week plan:', error);
    }
  };

  const activePage = pages.find(p => p.id === activePageId);
  const pageBeingDeleted = pages.find(p => p.id === pageToDelete);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-500 text-sm font-medium animate-pulse">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('App: Not authenticated, rendering AuthPage');
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (isLoading || !settings || !profile) {
    console.log('App: Authenticated but loading data', { isLoading, hasSettings: !!settings, hasProfile: !!profile });
    return (
      <div className="h-screen w-screen bg-[#191919] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  console.log('App: Rendering main dashboard');

  const appStyles = {
    '--primary-color': settings.primaryColor,
    '--accent-color': settings.accentColor,
    '--sidebar-color': settings.sidebarColor,
    '--font-family': settings.fontFamily,
    '--font-size-base': settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px',
  } as React.CSSProperties;

  return (
    <div 
      className={cn(
        "flex h-screen w-screen overflow-hidden text-[#EBEBEB] transition-all duration-500",
        settings.theme === 'light' ? "bg-white text-gray-900" : "bg-[#191919]"
      )}
      style={{ 
        ...appStyles,
        fontFamily: settings.fontFamily,
        fontSize: appStyles['--font-size-base']
      }}
    >
      {/* Background Image Layer */}
      {settings.backgroundImage && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700"
          style={{ 
            backgroundImage: `url(${settings.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: (settings.backgroundOpacity ?? 100) / 100
          }}
        />
      )}

      <div className="relative z-10 flex h-full w-full overflow-hidden">
        {!isFocusMode && (
          <Sidebar 
            pages={pages}
          activePageId={activePageId}
          onPageSelect={(id) => {
            setActivePageId(id);
            setIsTodoActive(false);
            setIsMeetingsActive(false);
            setIsCollaborationActive(false);
            setIsTaskTrackerActive(false);
            setIsCareerHubActive(false);
            setIsAnalyticsActive(false);
          }}
          onAddPage={handleAddPage}
          onDeletePage={confirmDeletePage}
          onSelectTodo={() => {
            setIsTodoActive(true);
            setActivePageId(null);
            setIsMeetingsActive(false);
            setIsCollaborationActive(false);
            setIsTaskTrackerActive(false);
            setIsCareerHubActive(false);
            setIsAnalyticsActive(false);
          }}
          onSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUpdates={() => setIsUpdatesOpen(true)}
          onSelectMeetings={() => {
            setIsMeetingsActive(true);
            setIsTodoActive(false);
            setIsCollaborationActive(false);
            setIsTaskTrackerActive(false);
            setIsCareerHubActive(false);
            setIsAnalyticsActive(false);
            setActivePageId(null);
          }}
          onSelectCollaboration={() => {
            setIsCollaborationActive(true);
            setIsMeetingsActive(false);
            setIsTodoActive(false);
            setIsTaskTrackerActive(false);
            setIsCareerHubActive(false);
            setIsAnalyticsActive(false);
            setActivePageId(null);
          }}
          onSelectTaskTracker={() => {
            setIsTaskTrackerActive(true);
            setIsCollaborationActive(false);
            setIsMeetingsActive(false);
            setIsTodoActive(false);
            setIsCareerHubActive(false);
            setIsAnalyticsActive(false);
            setActivePageId(null);
          }}
          onSelectCareerHub={() => {
            setIsCareerHubActive(true);
            setIsTaskTrackerActive(false);
            setIsCollaborationActive(false);
            setIsMeetingsActive(false);
            setIsTodoActive(false);
            setIsAnalyticsActive(false);
            setActivePageId(null);
          }}
          onSelectAnalytics={() => {
            setIsAnalyticsActive(true);
            setIsCareerHubActive(false);
            setIsTaskTrackerActive(false);
            setIsCollaborationActive(false);
            setIsMeetingsActive(false);
            setIsTodoActive(false);
            setIsTemplatesActive(false);
            setActivePageId(null);
          }}
          onSelectTemplates={() => {
            setIsTemplatesActive(true);
            setIsAnalyticsActive(false);
            setIsCareerHubActive(false);
            setIsTaskTrackerActive(false);
            setIsCollaborationActive(false);
            setIsMeetingsActive(false);
            setIsTodoActive(false);
            setActivePageId(null);
          }}
          isTodoActive={isTodoActive}
          isMeetingsActive={isMeetingsActive}
          isCollaborationActive={isCollaborationActive}
          isTaskTrackerActive={isTaskTrackerActive}
          isCareerHubActive={isCareerHubActive}
          isAnalyticsActive={isAnalyticsActive}
          isTemplatesActive={isTemplatesActive}
          profile={(user as any) || profile}
          settings={settings}
          unfinishedTasksCount={tasks.filter(t => t.completed === 0).length}
        />
        )}

        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Sync Indicator */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
              {isOnline ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {isOnline && (
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={cn(
                  "p-1.5 rounded-full bg-[#202020] border border-[#2F2F2F] text-gray-500 hover:text-white transition-all",
                  isSyncing && "animate-spin text-indigo-500"
                )}
                title="Sync Now"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-[#202020] border border-[#2F2F2F] text-gray-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              Logout
            </button>
          </div>
          <AnimatePresence mode="wait">
            {isTemplatesActive ? (
              <TemplatesMarketplace key="templates" onApply={handleApplyTemplate} />
            ) : isAnalyticsActive ? (
              <AnalyticsDashboard key="analytics" tasks={tasks} weekPlans={weekPlans} />
            ) : isCareerHubActive ? (
              <CareerHubDashboard key="career-hub" profile={profile} />
            ) : isTaskTrackerActive ? (
              <TaskTrackerDashboard 
                key="task-tracker" 
                profile={profile} 
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={confirmDeleteTask}
              />
            ) : isCollaborationActive ? (
              <CollaborationDashboard key="collab-dashboard" />
            ) : isMeetingsActive ? (
              <MeetingsView key="meetings-view" />
            ) : isTodoActive ? (
              <AdvancedPlanner 
                key="advanced-planner"
                tasks={tasks}
                weekPlans={weekPlans}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={confirmDeleteTask}
                onAddWeekPlan={handleAddWeekPlan}
              />
            ) : activePage ? (
              <Editor 
                key={activePage.id}
                page={activePage}
                onUpdate={handleUpdatePage}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-gray-500"
              >
                <p>Select a page or create a new one to get started.</p>
                <button 
                  onClick={() => handleAddPage()}
                  className="mt-4 px-4 py-2 bg-[#2A2A2A] hover:bg-[#373737] rounded-lg text-sm text-gray-300 transition-colors"
                >
                  Create your first page
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Shortcuts Help Modal */}
      <ShortcutsHelpModal />

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pages={pages}
        tasks={tasks}
        onPageSelect={(id) => {
          setActivePageId(id);
          setIsTodoActive(false);
        }}
        onTaskSelect={() => {
          setIsTodoActive(true);
          setActivePageId(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Updates Modal */}
      <UpdatesModal 
        isOpen={isUpdatesOpen}
        onClose={() => setIsUpdatesOpen(false)}
        tasks={tasks}
        onUpdateTask={handleUpdateTask}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!pageToDelete}
        onClose={() => setPageToDelete(null)}
        title="Delete Page"
        confirmLabel="Delete"
        onConfirm={handleDeletePage}
        variant="danger"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-gray-200 font-medium mb-1">Are you sure you want to delete this page?</p>
            <p className="text-sm text-gray-500">
              You are about to delete <span className="text-gray-300 font-semibold">"{pageBeingDeleted?.title || 'Untitled'}"</span>. 
              This action cannot be undone and all nested pages will also be lost.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Task Confirmation */}
      <Modal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        confirmLabel="Delete"
        onConfirm={handleDeleteTask}
        variant="danger"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-gray-200 font-medium mb-1">Are you sure you want to delete this task?</p>
            <p className="text-sm text-gray-500">
              This will permanently remove the task and all its subtasks. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ShortcutsProvider>
          <CollaborationProvider>
            <TemplateProvider>
              <AppContent />
            </TemplateProvider>
          </CollaborationProvider>
        </ShortcutsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
