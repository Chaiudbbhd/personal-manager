import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Template } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TemplateContextType {
  templates: Template[];
  loading: boolean;
  createTemplate: (template: Partial<Template>) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  markAsUsed: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('lpk_token');

  const refreshTemplates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch templates', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  const createTemplate = async (template: Partial<Template>) => {
    if (!token) return;
    const id = uuidv4();
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...template, id })
      });
      if (res.ok) {
        const newTemplate = await res.json();
        setTemplates(prev => [newTemplate, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create template', err);
    }
  };

  const toggleFavorite = async (id: string) => {
    if (!token) return;
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const newFavorite = !template.isFavorite;
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorite: newFavorite } : t));

    try {
      await fetch(`/api/templates/${id}/favorite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFavorite: newFavorite })
      });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const markAsUsed = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/templates/${id}/last-used`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, lastUsed: new Date().toISOString() } : t));
    } catch (err) {
      console.error('Failed to mark template as used', err);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  return (
    <TemplateContext.Provider value={{
      templates,
      loading,
      createTemplate,
      toggleFavorite,
      markAsUsed,
      deleteTemplate,
      refreshTemplates
    }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}
