import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Shortcut } from '../types';
import { useSettings } from './SettingsContext';

interface ShortcutsContextType {
  shortcuts: Shortcut[];
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  updateShortcut: (id: string, keys: string) => void;
  toggleShortcut: (id: string) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'new-page', label: 'New Page', keys: 'Control+n', enabled: true, category: 'Global' },
  { id: 'new-task', label: 'New Task', keys: 'Control+t', enabled: true, category: 'Global' },
  { id: 'new-planner', label: 'New Weekly Planner', keys: 'Control+w', enabled: true, category: 'Global' },
  { id: 'search', label: 'Search', keys: 'Control+k', enabled: true, category: 'Global' },
  { id: 'analytics', label: 'Open Analytics', keys: 'Control+Shift+A', enabled: true, category: 'Global' },
  { id: 'focus-mode', label: 'Focus Mode', keys: 'Control+Shift+F', enabled: true, category: 'Global' },
  { id: 'settings', label: 'Open Settings', keys: 'Control+,', enabled: true, category: 'Global' },
  { id: 'bold', label: 'Bold', keys: 'Control+b', enabled: true, category: 'Editor' },
  { id: 'italic', label: 'Italic', keys: 'Control+i', enabled: true, category: 'Editor' },
  { id: 'underline', label: 'Underline', keys: 'Control+u', enabled: true, category: 'Editor' },
  { id: 'command-menu', label: 'Command Menu', keys: 'Control+/', enabled: true, category: 'Editor' },
  { id: 'help', label: 'Show Shortcuts Help', keys: 'Control+?', enabled: true, category: 'Global' },
];

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    if (settings?.customShortcuts) {
      try {
        const custom = JSON.parse(settings.customShortcuts);
        setShortcuts(custom);
      } catch (e) {
        console.error('Failed to parse custom shortcuts', e);
      }
    }
  }, [settings?.customShortcuts]);

  const saveShortcuts = useCallback((newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    updateSettings({ customShortcuts: JSON.stringify(newShortcuts) });
  }, [updateSettings]);

  const updateShortcut = (id: string, keys: string) => {
    const newShortcuts = shortcuts.map(s => s.id === id ? { ...s, keys } : s);
    saveShortcuts(newShortcuts);
  };

  const toggleShortcut = (id: string) => {
    const newShortcuts = shortcuts.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    saveShortcuts(newShortcuts);
  };

  useEffect(() => {
    if (!settings?.shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger global shortcuts if typing in an input, unless it's a specific modifier combo
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;
      
      const pressedKeys = [];
      if (e.ctrlKey || e.metaKey) pressedKeys.push('Control');
      if (e.shiftKey) pressedKeys.push('Shift');
      if (e.altKey) pressedKeys.push('Alt');
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        pressedKeys.push(e.key === ' ' ? 'Space' : e.key);
      }

      const keyCombo = pressedKeys.join('+');
      
      const shortcut = shortcuts.find(s => s.keys.toLowerCase() === keyCombo.toLowerCase() && s.enabled);
      
      if (shortcut) {
        // If in input, only allow certain shortcuts or if it's a complex combo
        if (isInput && shortcut.category === 'Global' && !['search', 'help', 'settings'].includes(shortcut.id)) {
          return;
        }

        if (shortcut.category === 'Global' || !isInput) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('app_shortcut', { detail: shortcut.id }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, settings?.shortcutsEnabled]);

  return (
    <ShortcutsContext.Provider value={{ 
      shortcuts, 
      isHelpOpen, 
      setIsHelpOpen, 
      updateShortcut, 
      toggleShortcut,
      isFocusMode,
      setIsFocusMode
    }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (context === undefined) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
}
