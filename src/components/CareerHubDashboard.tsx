import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Briefcase, Plus, Search, Filter, ArrowUpDown, 
  MoreHorizontal, Calendar, Layout, List, Clock, 
  User, Tag, AlertCircle, ChevronRight, X, 
  Paperclip, MessageSquare, History, CheckSquare,
  Trash2, Copy, Download, Upload, Archive,
  BarChart3, ChevronDown, GripVertical, FileText,
  ExternalLink, MapPin, DollarSign, Building2,
  Image as ImageIcon, Move, Trash, FileDown, Database,
  Camera, TrendingUp, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  Opportunity, Resume, CareerHubSettings, 
  OpportunityAttachment, UserProfile 
} from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewType = 'board' | 'table' | 'calendar' | 'timeline' | 'resumes';

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920', // Office
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1920', // Laptop desk
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920', // Corporate
  'https://images.unsplash.com/photo-1518655061710-5ccf392c275a?auto=format&fit=crop&q=80&w=1920', // Minimal
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1920', // Abstract
];

export default function CareerHubDashboard({ profile }: { profile: UserProfile }) {
  const [settings, setSettings] = useState<CareerHubSettings | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [view, setView] = useState<ViewType>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('lpk_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
      const [settingsRes, oppsRes, resumesRes] = await Promise.all([
        fetch('/api/career/settings', { headers }),
        fetch('/api/career/opportunities', { headers }),
        fetch('/api/career/resumes', { headers })
      ]);
      
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (oppsRes.ok) setOpportunities(await oppsRes.json());
      if (resumesRes.ok) setResumes(await resumesRes.json());
    } catch (err) {
      console.error('Failed to fetch career hub data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<CareerHubSettings>) => {
    const token = localStorage.getItem('lpk_token');
    try {
      const res = await fetch('/api/career/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...settings, ...updates })
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const handleCreateOpportunity = async (data: Partial<Opportunity>) => {
    const token = localStorage.getItem('lpk_token');
    try {
      const res = await fetch('/api/career/opportunities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newOpp = await res.json();
        setOpportunities(prev => [newOpp, ...prev]);
        setSelectedOpp(newOpp);
        setIsDetailsOpen(true);
      }
    } catch (err) {
      console.error('Failed to create opportunity', err);
    }
  };

  const handleUpdateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    const token = localStorage.getItem('lpk_token');
    try {
      const res = await fetch(`/api/career/opportunities/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities(prev => prev.map(o => o.id === id ? updated : o));
        if (selectedOpp?.id === id) setSelectedOpp(updated);
      }
    } catch (err) {
      console.error('Failed to update opportunity', err);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    const token = localStorage.getItem('lpk_token');
    try {
      const res = await fetch(`/api/career/opportunities/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOpportunities(prev => prev.filter(o => o.id !== id));
        if (selectedOpp?.id === id) setIsDetailsOpen(false);
      }
    } catch (err) {
      console.error('Failed to delete opportunity', err);
    }
  };

  const stats = useMemo(() => {
    const total = opportunities.length;
    const interviews = opportunities.filter(o => o.stage === 'Interview').length;
    const offers = opportunities.filter(o => o.stage === 'Offer').length;
    const rejections = opportunities.filter(o => o.stage === 'Rejected').length;
    const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;
    
    return { total, interviews, offers, rejections, successRate };
  }, [opportunities]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(o => 
      o.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [opportunities, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <Clock className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden relative custom-scrollbar">
      {/* Cover Image Section */}
      <div className="relative h-64 group">
        {settings?.coverImage ? (
          <img 
            src={settings.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${settings.coverReposition}%` }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-bg-secondary" />
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
        
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button 
            onClick={() => setIsCoverMenuOpen(!isCoverMenuOpen)}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Change Cover
          </button>
          {settings?.coverImage && (
            <button 
              onClick={() => handleUpdateSettings({ coverImage: null })}
              className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2"
            >
              <Trash className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>

        {/* Cover Selection Menu */}
        <AnimatePresence>
          {isCoverMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 right-4 w-80 bg-bg-sidebar border border-border-main rounded-2xl p-4 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Default Covers</h4>
                <button onClick={() => setIsCoverMenuOpen(false)}><X className="w-4 h-4 text-text-muted" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DEFAULT_COVERS.map((url, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      handleUpdateSettings({ coverImage: url });
                      setIsCoverMenuOpen(false);
                    }}
                    className="h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-accent-blue transition-all"
                  >
                    <img src={url} alt={`Cover ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Custom Image</p>
                <input 
                  type="text" 
                  placeholder="Paste image URL..."
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateSettings({ coverImage: (e.target as HTMLInputElement).value });
                      setIsCoverMenuOpen(false);
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page Header */}
      <div className="px-12 -mt-12 relative z-10">
        <div className="flex items-end gap-6 mb-8">
          <div className="w-24 h-24 bg-bg-primary rounded-3xl border-4 border-bg-primary shadow-2xl flex items-center justify-center text-5xl">
            {settings?.icon || '💼'}
          </div>
          <div className="pb-2">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Career & Opportunity Hub</h1>
            <p className="text-text-secondary text-sm">Track your professional growth and job opportunities</p>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-5 gap-4 mb-12">
          <StatCard label="Total Applications" value={stats.total} icon={<FileText className="w-4 h-4" />} color="indigo" />
          <StatCard label="Interviews" value={stats.interviews} icon={<Calendar className="w-4 h-4" />} color="amber" />
          <StatCard label="Offers" value={stats.offers} icon={<CheckSquare className="w-4 h-4" />} color="emerald" />
          <StatCard label="Rejections" value={stats.rejections} icon={<X className="w-4 h-4" />} color="red" />
          <StatCard label="Success Rate" value={`${stats.successRate}%`} icon={<BarChart3 className="w-4 h-4" />} color="indigo" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border-main mb-8">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            <TabButton active={view === 'board'} onClick={() => setView('board')} label="Pipeline Board" icon={<Layout className="w-4 h-4" />} />
            <TabButton active={view === 'table'} onClick={() => setView('table')} label="All Opportunities" icon={<List className="w-4 h-4" />} />
            <TabButton active={view === 'calendar'} onClick={() => setView('calendar')} label="Calendar" icon={<Calendar className="w-4 h-4" />} />
            <TabButton active={view === 'timeline'} onClick={() => setView('timeline')} label="Timeline" icon={<Clock className="w-4 h-4" />} />
            <TabButton active={view === 'resumes'} onClick={() => setView('resumes')} label="Resumes" icon={<FileText className="w-4 h-4" />} />
          </div>
          <div className="flex items-center gap-4 pb-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text"
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-bg-secondary border border-border-main rounded-xl pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:border-accent-blue transition-colors w-64 text-text-primary"
              />
            </div>
            <button 
              onClick={() => handleCreateOpportunity({ companyName: 'New Company', roleTitle: 'New Role' })}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-accent-blue/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Opportunity
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="pb-20">
          <AnimatePresence mode="wait">
            {view === 'board' && (
              <PipelineBoard 
                key="board"
                opportunities={filteredOpps} 
                onUpdate={handleUpdateOpportunity}
                onSelect={(o) => { setSelectedOpp(o); setIsDetailsOpen(true); }}
              />
            )}
            {view === 'table' && (
              <OpportunityTable 
                key="table"
                opportunities={filteredOpps}
                onSelect={(o) => { setSelectedOpp(o); setIsDetailsOpen(true); }}
              />
            )}
            {view === 'calendar' && (
              <CalendarView 
                key="calendar"
                opportunities={opportunities.filter(o => o.interviewDate)}
                onSelect={(o) => { setSelectedOpp(o); setIsDetailsOpen(true); }}
              />
            )}
            {view === 'timeline' && (
              <TimelineView 
                key="timeline"
                opportunities={opportunities.filter(o => o.appliedDate).sort((a, b) => new Date(b.appliedDate!).getTime() - new Date(a.appliedDate!).getTime())}
                onSelect={(o) => { setSelectedOpp(o); setIsDetailsOpen(true); }}
              />
            )}
            {view === 'resumes' && (
              <ResumeManager 
                key="resumes"
                resumes={resumes}
                onUpdate={async () => {
                  const res = await fetch('/api/career/resumes');
                  if (res.ok) setResumes(await res.json());
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Details Panel Overlay */}
      <AnimatePresence>
        {isDetailsOpen && selectedOpp && (
          <OpportunityDetailsPanel 
            opportunity={selectedOpp}
            onClose={() => setIsDetailsOpen(false)}
            onUpdate={handleUpdateOpportunity}
            onDelete={handleDeleteOpportunity}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    indigo: 'text-accent-blue bg-accent-blue/10',
    amber: 'text-accent-amber bg-accent-amber/10',
    emerald: 'text-accent-green bg-accent-green/10',
    red: 'text-accent-red bg-accent-red/10',
  };
  
  return (
    <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 hover:bg-bg-hover transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("p-2 rounded-lg", colors[color])}>{icon}</div>
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-1 pb-4 text-sm font-bold transition-all relative",
        active ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue"
        />
      )}
    </button>
  );
}

function PipelineBoard({ opportunities, onUpdate, onSelect }: any) {
  const stages = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
  
  return (
    <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
      {stages.map(stage => (
        <div key={stage} className="w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">{stage}</h4>
              <span className="px-2 py-0.5 bg-bg-secondary rounded-full text-[10px] font-bold text-text-muted">
                {opportunities.filter((o: Opportunity) => o.stage === stage).length}
              </span>
            </div>
          </div>
          
          <div className="flex-1 space-y-3 min-h-[500px]">
            {opportunities.filter((o: Opportunity) => o.stage === stage).map((opp: Opportunity) => (
              <motion.div
                layoutId={opp.id}
                key={opp.id}
                onClick={() => onSelect(opp)}
                className="bg-bg-secondary border border-border-main rounded-xl p-4 hover:border-accent-blue/50 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  {opp.companyLogo ? (
                    <img src={opp.companyLogo} alt={opp.companyName} className="w-10 h-10 rounded-lg object-contain bg-white p-1" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold">
                      {opp.companyName[0]}
                    </div>
                  )}
                  <div>
                    <h5 className="text-sm font-bold text-text-primary line-clamp-1">{opp.companyName}</h5>
                    <p className="text-[11px] text-text-secondary line-clamp-1">{opp.roleTitle}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {opp.location && (
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <MapPin className="w-3 h-3" />
                      {opp.location}
                    </div>
                  )}
                  {opp.salaryRange && (
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <DollarSign className="w-3 h-3" />
                      {opp.salaryRange}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-main">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium">
                    <Clock className="w-3 h-3" />
                    {opp.appliedDate ? format(new Date(opp.appliedDate), 'MMM d') : 'No date'}
                  </div>
                  <PriorityBadge priority={opp.priority} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpportunityTable({ opportunities, onSelect }: any) {
  return (
    <div className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-main bg-bg-sidebar">
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Company</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Stage</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Priority</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Applied Date</th>
            <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main">
          {opportunities.map((opp: Opportunity) => (
            <tr 
              key={opp.id} 
              className="hover:bg-bg-hover transition-colors group cursor-pointer"
              onClick={() => onSelect(opp)}
            >
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {opp.companyLogo ? (
                    <img src={opp.companyLogo} alt={opp.companyName} className="w-6 h-6 rounded object-contain bg-white p-0.5" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-accent-blue/10 flex items-center justify-center text-[10px] text-accent-blue font-bold">
                      {opp.companyName[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-text-primary">{opp.companyName}</span>
                </div>
              </td>
              <td className="p-4 text-sm text-text-secondary">{opp.roleTitle}</td>
              <td className="p-4"><StageBadge stage={opp.stage} /></td>
              <td className="p-4"><PriorityBadge priority={opp.priority} /></td>
              <td className="p-4 text-xs text-text-muted">
                {opp.appliedDate ? format(new Date(opp.appliedDate), 'MMM d, yyyy') : '-'}
              </td>
              <td className="p-4 text-xs text-text-muted">{opp.location || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunityDetailsPanel({ opportunity, onClose, onUpdate, onDelete }: any) {
  const [activeTab, setActiveTab] = useState<'info' | 'prep' | 'resumes'>('info');
  
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-[600px] bg-bg-primary border-l border-border-main shadow-2xl z-50 flex flex-col"
    >
      <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-lg transition-all">
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
          <h3 className="text-lg font-bold text-text-primary">Opportunity Details</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDelete(opportunity.id)} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 border border-border-main flex items-center justify-center">
            {opportunity.companyLogo ? (
              <img src={opportunity.companyLogo} alt={opportunity.companyName} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-10 h-10 text-text-muted" />
            )}
          </div>
          <div className="flex-1">
            <input 
              type="text"
              value={opportunity.companyName}
              onChange={e => onUpdate(opportunity.id, { companyName: e.target.value })}
              className="text-2xl font-bold text-text-primary bg-transparent border-none focus:outline-none w-full mb-1"
            />
            <input 
              type="text"
              value={opportunity.roleTitle}
              onChange={e => onUpdate(opportunity.id, { roleTitle: e.target.value })}
              className="text-lg text-text-secondary bg-transparent border-none focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="flex gap-6 border-b border-border-main mb-8">
          <button 
            onClick={() => setActiveTab('info')}
            className={cn("pb-4 text-sm font-bold transition-all relative", activeTab === 'info' ? "text-text-primary" : "text-text-muted")}
          >
            Information
            {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />}
          </button>
          <button 
            onClick={() => setActiveTab('prep')}
            className={cn("pb-4 text-sm font-bold transition-all relative", activeTab === 'prep' ? "text-text-primary" : "text-text-muted")}
          >
            Interview Prep
            {activeTab === 'prep' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />}
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <DetailField label="Stage">
                <select 
                  value={opportunity.stage}
                  onChange={e => onUpdate(opportunity.id, { stage: e.target.value })}
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                >
                  <option value="Wishlist">Wishlist</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </DetailField>
              <DetailField label="Priority">
                <select 
                  value={opportunity.priority}
                  onChange={e => onUpdate(opportunity.id, { priority: e.target.value })}
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </DetailField>
              <DetailField label="Location">
                <input 
                  type="text"
                  value={opportunity.location || ''}
                  onChange={e => onUpdate(opportunity.id, { location: e.target.value })}
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                  placeholder="e.g. Remote, New York"
                />
              </DetailField>
              <DetailField label="Salary Range">
                <input 
                  type="text"
                  value={opportunity.salaryRange || ''}
                  onChange={e => onUpdate(opportunity.id, { salaryRange: e.target.value })}
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                  placeholder="e.g. $120k - $150k"
                />
              </DetailField>
              <DetailField label="Applied Date">
                <input 
                  type="date"
                  value={opportunity.appliedDate || ''}
                  onChange={e => onUpdate(opportunity.id, { appliedDate: e.target.value })}
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                />
              </DetailField>
              <DetailField label="Interview Date">
                <input 
                  type="date"
                  value={opportunity.interviewDate || ''}
                  onChange={e => onUpdate(opportunity.id, { interviewDate: e.target.value })}
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                />
              </DetailField>
            </div>
            
            <DetailField label="Job Link">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={opportunity.jobLink || ''}
                  onChange={e => onUpdate(opportunity.id, { jobLink: e.target.value })}
                  className="flex-1 bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                  placeholder="https://..."
                />
                {opportunity.jobLink && (
                  <a href={opportunity.jobLink} target="_blank" rel="noreferrer" className="p-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/90 transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </DetailField>

            <DetailField label="Notes">
              <textarea 
                value={opportunity.notes || ''}
                onChange={e => onUpdate(opportunity.id, { notes: e.target.value })}
                className="w-full bg-bg-secondary border border-border-main rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none min-h-[150px] resize-none"
                placeholder="Add any general notes about this opportunity..."
              />
            </DetailField>
          </div>
        )}

        {activeTab === 'prep' && (
          <div className="space-y-8">
            <DetailField label="Interview Preparation">
              <textarea 
                value={opportunity.interviewPrep || ''}
                onChange={e => onUpdate(opportunity.id, { interviewPrep: e.target.value })}
                className="w-full bg-bg-secondary border border-border-main rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none min-h-[200px] resize-none"
                placeholder="Questions to ask, key points to mention..."
              />
            </DetailField>
            <DetailField label="Company Research">
              <textarea 
                value={opportunity.companyResearch || ''}
                onChange={e => onUpdate(opportunity.id, { companyResearch: e.target.value })}
                className="w-full bg-bg-secondary border border-border-main rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none min-h-[200px] resize-none"
                placeholder="What does the company do? Recent news, culture..."
              />
            </DetailField>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DetailField({ label, children }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    'Wishlist': 'bg-text-muted/10 text-text-muted',
    'Applied': 'bg-accent-blue/10 text-accent-blue',
    'Interview': 'bg-accent-amber/10 text-accent-amber',
    'Offer': 'bg-accent-green/10 text-accent-green',
    'Rejected': 'bg-accent-red/10 text-accent-red',
  };
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", colors[stage] || colors['Wishlist'])}>
      {stage}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    'Low': 'bg-accent-blue/10 text-accent-blue',
    'Medium': 'bg-accent-green/10 text-accent-green',
    'High': 'bg-accent-amber/10 text-accent-amber',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap border border-transparent", colors[priority] || colors['Medium'])}>
      {priority}
    </span>
  );
}

function TimelineView({ opportunities, onSelect }: any) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="relative border-l-2 border-border-main ml-4 space-y-12">
        {opportunities.map((opp: Opportunity) => (
          <div key={opp.id} className="relative pl-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent-blue border-4 border-bg-primary" />
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              {opp.appliedDate ? format(new Date(opp.appliedDate), 'MMMM d, yyyy') : 'No Date'}
            </div>
            <div 
              onClick={() => onSelect(opp)}
              className="bg-bg-secondary border border-border-main rounded-2xl p-6 hover:border-accent-blue/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-bg-primary rounded-xl flex items-center justify-center text-text-muted group-hover:text-accent-blue transition-colors">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-text-primary">{opp.companyName}</h5>
                    <p className="text-xs text-text-secondary">{opp.roleTitle}</p>
                  </div>
                </div>
                <StageBadge stage={opp.stage} />
              </div>
              {opp.notes && (
                <p className="text-xs text-text-secondary line-clamp-2 italic">"{opp.notes}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarView({ opportunities, onSelect }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const start = startOfWeek(currentDate);
  const end = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <h4 className="text-sm font-bold text-text-primary">Interview Calendar</h4>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted"><ChevronRight className="w-4 h-4 rotate-180" /></button>
          <span className="text-xs font-bold text-text-secondary flex items-center px-2">{format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}</span>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 divide-x divide-border-main">
        {days.map(day => (
          <div key={day.toString()} className="min-h-[200px] flex flex-col">
            <div className={cn(
              "p-2 text-center border-b border-border-main text-[10px] font-bold uppercase tracking-widest",
              isToday(day) ? "text-accent-blue bg-accent-blue/5" : "text-text-muted"
            )}>
              {format(day, 'EEE d')}
            </div>
            <div className="flex-1 p-2 space-y-2">
              {opportunities.filter((o: Opportunity) => o.interviewDate && isSameDay(new Date(o.interviewDate), day)).map((opp: Opportunity) => (
                <div 
                  key={opp.id}
                  onClick={() => onSelect(opp)}
                  className="p-2 bg-accent-amber/10 border border-accent-amber/20 rounded-lg cursor-pointer hover:bg-accent-amber/20 transition-all"
                >
                  <p className="text-[10px] font-bold text-accent-amber truncate">{opp.companyName}</p>
                  <p className="text-[9px] text-accent-amber/70 truncate">{opp.roleTitle}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeManager({ resumes, onUpdate }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // In a real app, we'd upload to S3/Cloudinary. 
    // Here we'll simulate by using a placeholder URL.
    try {
      const token = localStorage.getItem('lpk_token');
      const res = await fetch('/api/career/resumes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: file.name,
          url: 'https://example.com/resume.pdf',
          type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
          size: file.size,
          tags: JSON.stringify(['Frontend'])
        })
      });
      if (res.ok) onUpdate();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resume?')) return;
    const token = localStorage.getItem('lpk_token');
    try {
      const res = await fetch(`/api/career/resumes/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onUpdate();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-text-primary uppercase tracking-widest">Your Resumes</h4>
        <label className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-accent-blue/20">
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload Resume'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {resumes.map((resume: Resume) => (
          <div key={resume.id} className="bg-bg-secondary border border-border-main rounded-2xl p-6 group hover:border-accent-blue/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-accent-blue/10 rounded-xl text-accent-blue">
                <FileText className="w-6 h-6" />
              </div>
              <button onClick={() => handleDelete(resume.id)} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h5 className="text-sm font-bold text-text-primary mb-1 truncate">{resume.name}</h5>
            <p className="text-[10px] text-text-muted mb-4 uppercase tracking-widest">{resume.type} • {(resume.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {JSON.parse(resume.tags || '[]').map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-bg-primary rounded-md text-[9px] font-bold text-text-muted uppercase tracking-tighter border border-border-main">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-bg-primary hover:bg-bg-hover text-text-secondary rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button className="px-3 py-2 bg-bg-primary hover:bg-bg-hover text-text-secondary rounded-lg text-xs font-bold transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
