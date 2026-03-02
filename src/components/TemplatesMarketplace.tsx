import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Star, Clock, Plus, 
  Layout, CheckCircle2, Briefcase, TrendingUp, 
  Sparkles, Download, Trash2, Eye, Copy, X,
  ArrowRight, Heart, HeartOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTemplates } from '../contexts/TemplateContext';
import { Template } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = [
  'All Templates',
  'Study Planner Templates',
  'Task Management Templates',
  'Project Tracker Templates',
  'Job Tracker Templates',
  'Habit Tracker Templates'
];

interface TemplatesMarketplaceProps {
  onApply: (template: Template) => void;
}

export default function TemplatesMarketplace({ onApply }: TemplatesMarketplaceProps) {
  const { templates, loading, toggleFavorite, deleteTemplate, markAsUsed } = useTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Templates');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All Templates' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const featuredTemplates = useMemo(() => {
    return templates.filter(t => t.isFeatured).slice(0, 3);
  }, [templates]);

  const recentlyUsed = useMemo(() => {
    return templates
      .filter(t => t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, 4);
  }, [templates]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-primary overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-8 bg-gradient-to-b from-accent-blue/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-accent-blue" />
                Template Marketplace
              </h1>
              <p className="text-text-muted">Boost your productivity with pre-built workspace structures.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-bg-secondary border border-border-main rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all w-64"
                />
              </div>
            </div>
          </div>

          {/* Featured Section */}
          {featuredTemplates.length > 0 && !searchQuery && selectedCategory === 'All Templates' && (
            <div className="mb-12">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star className="w-3 h-3 text-accent-orange" />
                Featured Templates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredTemplates.map(t => (
                  <FeaturedCard 
                    key={t.id} 
                    template={t} 
                    onPreview={() => setPreviewTemplate(t)}
                    onApply={() => onApply(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recently Used */}
          {recentlyUsed.length > 0 && !searchQuery && selectedCategory === 'All Templates' && (
            <div className="mb-12">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-3 h-3 text-accent-blue" />
                Recently Used
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentlyUsed.map(t => (
                  <RecentCard 
                    key={t.id} 
                    template={t} 
                    onApply={() => onApply(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Marketplace Grid */}
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <div className="w-64 shrink-0 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Categories</h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                        selectedCategory === cat 
                          ? "bg-accent-blue/10 text-accent-blue font-medium" 
                          : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl">
                <h4 className="text-sm font-bold text-accent-blue mb-2">Custom Templates</h4>
                <p className="text-xs text-text-muted mb-4">Save your own workspace structures as templates to reuse them later.</p>
                <button className="w-full py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-3 h-3" />
                  Create Template
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">
                  {selectedCategory}
                  <span className="ml-2 text-sm font-normal text-text-muted">({filteredTemplates.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(t => (
                  <TemplateCard 
                    key={t.id} 
                    template={t}
                    onPreview={() => setPreviewTemplate(t)}
                    onApply={() => onApply(t)}
                    onToggleFavorite={() => toggleFavorite(t.id)}
                    onDelete={t.userId ? () => deleteTemplate(t.id) : undefined}
                  />
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-text-muted" />
                  </div>
                  <h3 className="text-text-secondary font-bold mb-1">No templates found</h3>
                  <p className="text-text-muted text-sm">Try adjusting your search or category filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewTemplate(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl h-[80vh] bg-bg-sidebar border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-secondary">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center text-2xl">
                    {previewTemplate.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{previewTemplate.title}</h3>
                    <p className="text-sm text-text-muted">{previewTemplate.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPreviewTemplate(null)}
                    className="p-2 hover:bg-bg-hover rounded-lg text-text-muted transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Description</h4>
                    <p className="text-text-secondary leading-relaxed">{previewTemplate.description}</p>
                  </div>

                  <div className="p-6 bg-bg-secondary border border-border-main rounded-2xl">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Template Structure Preview</h4>
                    <div className="prose prose-invert max-w-none text-sm text-text-muted">
                      {JSON.parse(previewTemplate.content).type === 'page' ? (
                        <div dangerouslySetInnerHTML={{ __html: JSON.parse(previewTemplate.content).content }} />
                      ) : (
                        <div className="space-y-2">
                          <p>This template will create a task board with the following columns:</p>
                          <div className="flex gap-2">
                            {JSON.parse(previewTemplate.content).items.map((item: any, i: number) => (
                              <div key={i} className="px-3 py-1 bg-bg-hover rounded-lg text-xs font-medium border border-border-main">
                                {item.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border-main bg-bg-secondary flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created {new Date(previewTemplate.createdAt).toLocaleDateString()}
                  </div>
                  {previewTemplate.userId && (
                    <div className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-full font-bold uppercase tracking-wider">
                      Custom Template
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPreviewTemplate(null)}
                    className="px-6 py-2 text-sm font-bold text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      onApply(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    className="px-8 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-accent-blue/20 transition-all flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate to Workspace
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeaturedCard({ template, onPreview, onApply }: { template: Template, onPreview: () => void, onApply: () => void }) {
  return (
    <div className="group relative bg-bg-secondary border border-border-main rounded-2xl p-6 hover:border-accent-blue/50 transition-all overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Sparkles className="w-5 h-5 text-accent-blue" />
      </div>
      <div className="text-4xl mb-4">{template.icon}</div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{template.title}</h3>
      <p className="text-sm text-text-muted mb-6 line-clamp-2">{template.description}</p>
      <div className="flex items-center gap-3">
        <button 
          onClick={onApply}
          className="flex-1 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Copy className="w-3.5 h-3.5" />
          Use Template
        </button>
        <button 
          onClick={onPreview}
          className="p-2 bg-bg-hover hover:bg-bg-hover/80 text-text-muted hover:text-text-secondary rounded-xl transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function RecentCard({ template, onApply }: { template: Template, onApply: () => void }) {
  return (
    <button 
      onClick={onApply}
      className="flex items-center gap-3 p-3 bg-bg-secondary border border-border-main rounded-xl hover:border-accent-blue/30 transition-all text-left group"
    >
      <div className="w-10 h-10 bg-bg-hover rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
        {template.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-text-secondary truncate">{template.title}</h4>
        <p className="text-[10px] text-text-muted truncate">Used {new Date(template.lastUsed!).toLocaleDateString()}</p>
      </div>
    </button>
  );
}

function TemplateCard({ 
  template, 
  onPreview, 
  onApply, 
  onToggleFavorite,
  onDelete 
}: { 
  template: Template, 
  onPreview: () => void, 
  onApply: () => void,
  onToggleFavorite: () => void,
  onDelete?: () => void
}) {
  return (
    <div className="group bg-bg-secondary border border-border-main rounded-2xl p-4 hover:border-accent-blue/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-bg-hover rounded-xl flex items-center justify-center text-2xl">
            {template.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">{template.title}</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{template.category.split(' ')[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleFavorite}
            className={cn(
              "p-2 rounded-lg transition-colors",
              template.isFavorite ? "text-accent-orange" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {template.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
          </button>
          {onDelete && (
            <button 
              onClick={onDelete}
              className="p-2 text-text-muted hover:text-accent-red rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-xs text-text-muted mb-4 line-clamp-2 min-h-[32px]">
        {template.description}
      </p>

      <div className="flex items-center gap-2">
        <button 
          onClick={onApply}
          className="flex-1 py-1.5 bg-accent-blue/10 hover:bg-accent-blue text-accent-blue hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2"
        >
          <Copy className="w-3 h-3" />
          Duplicate
        </button>
        <button 
          onClick={onPreview}
          className="px-3 py-1.5 bg-bg-hover hover:bg-bg-hover/80 text-text-muted hover:text-text-secondary rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2"
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
      </div>
    </div>
  );
}
