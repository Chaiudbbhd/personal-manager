import React from 'react';
import { Plus, FileText, ChevronDown, Trash2, Settings, Search, Clock, Layout, Video, Users, CheckCircle2, Briefcase, TrendingUp, Keyboard } from 'lucide-react';
import { Page, UserProfile, UserSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  pages: Page[];
  activePageId: string | null;
  onPageSelect: (id: string | null) => void;
  onAddPage: (parentId?: string) => void;
  onDeletePage: (id: string) => void;
  onSelectTodo: () => void;
  onSearch: () => void;
  onOpenSettings: () => void;
  onOpenUpdates: () => void;
  onSelectMeetings: () => void;
  onSelectCollaboration: () => void;
  onSelectTaskTracker: () => void;
  onSelectCareerHub: () => void;
  onSelectAnalytics: () => void;
  onSelectTemplates: () => void;
  isTodoActive: boolean;
  isMeetingsActive: boolean;
  isCollaborationActive: boolean;
  isTaskTrackerActive: boolean;
  isCareerHubActive: boolean;
  isAnalyticsActive: boolean;
  isTemplatesActive: boolean;
  profile: UserProfile;
  settings: UserSettings;
  unfinishedTasksCount: number;
}

export default function Sidebar({ 
  pages, 
  activePageId, 
  onPageSelect, 
  onAddPage, 
  onDeletePage,
  onSelectTodo,
  onSearch,
  onOpenSettings,
  onOpenUpdates,
  onSelectMeetings,
  onSelectCollaboration,
  onSelectTaskTracker,
  onSelectCareerHub,
  onSelectAnalytics,
  onSelectTemplates,
  isTodoActive,
  isMeetingsActive,
  isCollaborationActive,
  isTaskTrackerActive,
  isCareerHubActive,
  isAnalyticsActive,
  isTemplatesActive,
  profile,
  settings,
  unfinishedTasksCount
}: SidebarProps) {
  const rootPages = pages.filter(p => !p.parentId);

  return (
    <div 
      className="w-64 h-screen border-r border-border-main flex flex-col select-none transition-colors duration-150 bg-bg-sidebar"
    >
      {/* Header / Profile */}
      <div 
        onClick={onOpenSettings}
        className="p-4 flex items-center justify-between hover:bg-bg-hover cursor-pointer group transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <img 
            src={profile.avatar} 
            alt={profile.name} 
            className="w-6 h-6 rounded bg-accent-blue shrink-0 object-cover"
          />
          <span className="font-semibold truncate text-sm text-text-primary">{profile.name}'s Workspace</span>
        </div>
        <Settings className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Quick Actions */}
      <div className="px-2 py-2 space-y-0.5">
        <button 
          onClick={onSearch}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-hover text-sm text-text-secondary hover:text-text-primary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="font-medium">Search</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+K</span>
        </button>
        <button 
          onClick={onOpenUpdates}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-hover text-sm text-text-secondary hover:text-text-primary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Updates</span>
          </div>
          {unfinishedTasksCount > 0 && (
            <span className="px-1.5 py-0.5 bg-accent-red text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
              {unfinishedTasksCount}
            </span>
          )}
        </button>
        <button 
          onClick={onSelectMeetings}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors font-medium",
            isMeetingsActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <Video className="w-4 h-4" />
          <span>Meetings</span>
        </button>
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-hover text-sm text-text-secondary hover:text-text-primary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+,</span>
        </button>
        <button 
          onClick={onSelectTodo}
          className={cn(
            "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors group font-medium",
            isTodoActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span>Study Planner</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+W</span>
        </button>
        <button 
          onClick={onSelectTaskTracker}
          className={cn(
            "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors group font-medium",
            isTaskTrackerActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
            <span>Task Tracker</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+T</span>
        </button>
        <button 
          onClick={onSelectCareerHub}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors font-medium",
            isCareerHubActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <Briefcase className="w-4 h-4 text-accent-yellow" />
          <span>Career Hub</span>
        </button>
        <button 
          onClick={onSelectAnalytics}
          className={cn(
            "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors group font-medium",
            isAnalyticsActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-blue" />
            <span>Analytics</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+Shift+A</span>
        </button>
        <button 
          onClick={onSelectTemplates}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors font-medium",
            isTemplatesActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <Layout className="w-4 h-4 text-accent-purple" />
          <span>Templates</span>
        </button>
      </div>

      {/* Shared Section */}
      <div className="mt-4 px-2 py-2 space-y-0.5">
        <h3 className="px-2 mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">Shared</h3>
        <button 
          onClick={onSelectCollaboration}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors font-medium",
            isCollaborationActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Collaboration</span>
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="flex items-center justify-between px-2 mb-2 group">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Private</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+N</span>
            <button 
              onClick={() => onAddPage()}
              className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          {rootPages.map((page, index) => (
            <PageItem 
              key={page.id || `root-${index}`}
              page={page}
              allPages={pages}
              activePageId={activePageId}
              onPageSelect={onPageSelect}
              onAddPage={onAddPage}
              onDeletePage={onDeletePage}
              level={0}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border-main space-y-1">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('app_shortcut', { detail: 'help' }))}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-hover text-sm text-text-secondary hover:text-text-primary transition-colors group font-medium"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            <span>Shortcuts</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+?</span>
        </button>
        <button 
          onClick={() => onAddPage()}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-hover text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New page</span>
        </button>
      </div>
    </div>
  );
}

interface PageItemProps {
  page: Page;
  allPages: Page[];
  activePageId: string | null;
  onPageSelect: (id: string | null) => void;
  onAddPage: (parentId?: string) => void;
  onDeletePage: (id: string) => void;
  level: number;
}

function PageItem({ 
  page, 
  allPages, 
  activePageId, 
  onPageSelect, 
  onAddPage, 
  onDeletePage,
  level 
}: PageItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const children = allPages.filter(p => p.parentId === page.id);
  const isActive = activePageId === page.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div 
        onClick={() => onPageSelect(page.id)}
        className={cn(
          "group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer text-sm transition-colors font-medium",
          isActive ? "bg-bg-hover text-text-primary" : "hover:bg-bg-hover text-text-secondary hover:text-text-primary",
          level > 0 && "ml-4"
        )}
      >
        <div 
          onClick={handleToggle}
          className="p-0.5 hover:bg-bg-hover rounded transition-colors"
        >
          {children.length > 0 ? (
            <motion.div
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>
        <span className="mr-1.5 shrink-0">{page.icon || '📄'}</span>
        <span className="truncate flex-1">{page.title}</span>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
            className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-accent-red"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddPage(page.id); }}
            className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children.map((child, index) => (
              <PageItem 
                key={child.id || `child-${index}`}
                page={child}
                allPages={allPages}
                activePageId={activePageId}
                onPageSelect={onPageSelect}
                onAddPage={onAddPage}
                onDeletePage={onDeletePage}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
