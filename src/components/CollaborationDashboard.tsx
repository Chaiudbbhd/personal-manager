import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Plus, Settings, Share2, MessageSquare, 
  Activity, Shield, UserPlus, Trash2, LogOut,
  ChevronRight, MoreVertical, CheckCircle2, Clock, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AuthModal from './AuthModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'public';
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface ActivityLog {
  id: string;
  actionType: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
}

export default function CollaborationDashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lpk_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('lpk_user') || 'null'));

  // Form states
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '', visibility: 'private' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const fetchWorkspaces = useCallback(async () => {
    if (!token) {
      setIsAuthModalOpen(true);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0 && !activeWorkspace) {
          setActiveWorkspace(data[0]);
        }
      } else if (res.status === 401) {
        setIsAuthModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, activeWorkspace]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const fetchWorkspaceDetails = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const [membersRes, activityRes] = await Promise.all([
        fetch(`/api/workspaces/${id}/members`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/workspaces/${id}/activity`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (membersRes.ok) setMembers(await membersRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
    } catch (err) {
      console.error('Failed to fetch workspace details', err);
    }
  }, [token]);

  useEffect(() => {
    if (activeWorkspace) {
      fetchWorkspaceDetails(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchWorkspaceDetails]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWorkspace)
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(prev => [...prev, { ...data, role: 'owner' }]);
        setActiveWorkspace({ ...data, role: 'owner' });
        setIsCreateModalOpen(false);
        setNewWorkspace({ name: '', description: '', visibility: 'private' });
      }
    } catch (err) {
      console.error('Failed to create workspace', err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !token) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (res.ok) {
        fetchWorkspaceDetails(activeWorkspace.id);
        setIsInviteModalOpen(false);
        setInviteEmail('');
      } else {
        alert('User not found or already in workspace');
      }
    } catch (err) {
      console.error('Failed to invite member', err);
    }
  };

  const handleAuthSuccess = (u: any, t: string) => {
    setUser(u);
    setToken(t);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('lpk_token');
    localStorage.removeItem('lpk_user');
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
    setIsAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <Clock className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Collaboration Dashboard</h2>
            <p className="text-sm text-text-muted">Manage your shared workspaces and team members</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 px-4 py-2 bg-bg-secondary rounded-xl border border-border-main">
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
              <span className="text-sm font-bold text-text-secondary">{user.name}</span>
              <button onClick={handleLogout} className="p-1 hover:text-accent-red transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent-blue/20"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Workspace List */}
        <div className="w-80 border-r border-border-main flex flex-col bg-bg-sidebar">
          <div className="p-4 border-b border-border-main">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Your Workspaces</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                  activeWorkspace?.id === ws.id ? "bg-accent-blue/10 text-accent-blue" : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    activeWorkspace?.id === ws.id ? "bg-accent-blue text-white" : "bg-bg-secondary text-text-muted"
                  )}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-bold truncate">{ws.name}</p>
                    <p className="text-[10px] uppercase tracking-tighter opacity-60">{ws.role}</p>
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", activeWorkspace?.id === ws.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100")} />
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Details */}
        {activeWorkspace ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
              <div>
                <h3 className="text-2xl font-bold text-text-primary mb-1">{activeWorkspace.name}</h3>
                <p className="text-sm text-text-muted">{activeWorkspace.description || 'No description provided.'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-bg-hover rounded-lg text-text-muted transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-hover text-text-secondary rounded-xl text-sm font-bold transition-all border border-border-main"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 custom-scrollbar">
              {/* Members Section */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border-main flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text-secondary flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-blue" />
                      Team Members
                    </h4>
                    <span className="text-xs text-text-muted font-mono">{members.length} members</span>
                  </div>
                  <div className="divide-y divide-border-main">
                    {members.map(member => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-bg-hover transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full bg-bg-hover" />
                          <div>
                            <p className="text-sm font-bold text-text-secondary">{member.name}</p>
                            <p className="text-xs text-text-muted">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            member.role === 'owner' ? "bg-accent-blue/20 text-accent-blue" : "bg-text-muted/10 text-text-muted"
                          )}>
                            {member.role}
                          </span>
                          {activeWorkspace.role === 'owner' && member.role !== 'owner' && (
                            <button className="p-1 hover:bg-accent-red/10 rounded text-text-muted hover:text-accent-red transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-bg-secondary border border-border-main rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-accent-green" />
                      </div>
                      <h4 className="text-sm font-bold text-text-secondary">Workspace Stats</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Total Pages</span>
                        <span className="text-sm font-bold text-text-secondary">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Active Tasks</span>
                        <span className="text-sm font-bold text-text-secondary">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Comments</span>
                        <span className="text-sm font-bold text-text-secondary">24</span>
                      </div>
                    </div>
                  </section>

                  <section className="bg-bg-secondary border border-border-main rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent-orange" />
                      </div>
                      <h4 className="text-sm font-bold text-text-secondary">Permissions</h4>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mb-4">
                      You are an <span className="text-accent-blue font-bold uppercase">{activeWorkspace.role}</span> in this workspace.
                    </p>
                    <button className="w-full py-2 bg-bg-sidebar hover:bg-bg-hover text-text-muted rounded-lg text-xs font-bold transition-all border border-border-main">
                      View Role Details
                    </button>
                  </section>
                </div>
              </div>

              {/* Activity Log */}
              <div className="space-y-6">
                <section className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden flex flex-col h-full">
                  <div className="p-4 border-b border-border-main flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent-blue" />
                    <h4 className="text-sm font-bold text-text-secondary">Recent Activity</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {activity.length === 0 ? (
                      <div className="py-10 text-center text-text-muted">
                        <p className="text-xs italic">No recent activity</p>
                      </div>
                    ) : (
                      activity.map(log => (
                        <div key={log.id} className="flex gap-3">
                          <img src={log.userAvatar} alt={log.userName} className="w-8 h-8 rounded-full bg-bg-hover shrink-0" />
                          <div>
                            <p className="text-xs text-text-muted">
                              <span className="font-bold text-text-primary">{log.userName}</span>
                              {' '}
                              <span className="text-text-muted">performed</span>
                              {' '}
                              <span className="text-accent-blue font-medium">{log.actionType.replace('_', ' ')}</span>
                            </p>
                            <p className="text-[10px] text-text-muted/50 mt-1">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-primary">
            <Users className="w-16 h-16 text-text-muted/20 mb-6" />
            <h3 className="text-xl font-bold text-text-muted mb-2">No Workspace Selected</h3>
            <p className="text-sm text-text-muted/60 max-w-xs">Select a workspace from the list or create a new one to start collaborating.</p>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-sidebar border border-border-main rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCreateWorkspace} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-text-primary">New Workspace</h3>
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Workspace Name</label>
                    <input
                      required
                      type="text"
                      value={newWorkspace.name}
                      onChange={e => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-bg-secondary border border-border-main rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                      placeholder="e.g. Design Team"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Description</label>
                    <textarea
                      value={newWorkspace.description}
                      onChange={e => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-bg-secondary border border-border-main rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors h-24 resize-none"
                      placeholder="What is this workspace for?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Visibility</label>
                    <div className="flex gap-2">
                      {['private', 'public'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setNewWorkspace(prev => ({ ...prev, visibility: v as any }))}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize",
                            newWorkspace.visibility === v ? "bg-accent-blue/10 border-accent-blue text-accent-blue" : "bg-bg-secondary border-border-main text-text-muted"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent-blue/20"
                >
                  Create Workspace
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-sidebar border border-border-main rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleInvite} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-text-primary">Invite Member</h3>
                  <button type="button" onClick={() => setIsInviteModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Email Address</label>
                    <input
                      required
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full bg-bg-secondary border border-border-main rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full bg-bg-secondary border border-border-main rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent-blue/20"
                >
                  Send Invitation
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
