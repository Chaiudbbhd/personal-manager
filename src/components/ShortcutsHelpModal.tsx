import React from 'react';
import Modal from './Modal';
import { useShortcuts } from '../contexts/ShortcutsContext';
import { Keyboard, Command, Shield, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function ShortcutsHelpModal() {
  const { shortcuts, isHelpOpen, setIsHelpOpen } = useShortcuts();

  const categories = ['Global', 'Editor'] as const;

  return (
    <Modal
      isOpen={isHelpOpen}
      onClose={() => setIsHelpOpen(false)}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-8">
        <div className="flex items-center gap-3 p-4 bg-accent-blue/10 rounded-2xl border border-accent-blue/20">
          <Zap className="w-5 h-5 text-accent-blue" />
          <p className="text-sm text-text-secondary">
            Boost your productivity with these powerful keyboard shortcuts. Most shortcuts use <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border-main rounded text-text-primary text-[10px] font-mono">Ctrl</kbd> or <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border-main rounded text-text-primary text-[10px] font-mono">⌘</kbd>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {categories.map(category => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 text-text-muted">
                {category === 'Global' ? <Keyboard className="w-4 h-4" /> : <Command className="w-4 h-4" />}
                <h3 className="text-xs font-bold uppercase tracking-widest">{category} Shortcuts</h3>
              </div>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map(shortcut => (
                    <div 
                      key={shortcut.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-hover transition-colors group"
                    >
                      <span className="text-sm text-text-muted group-hover:text-text-primary transition-colors">{shortcut.label}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.split('+').map((key, i) => (
                          <kbd 
                            key={i}
                            className="px-2 py-1 bg-bg-sidebar border border-border-main rounded text-[10px] font-mono text-text-muted shadow-sm min-w-[24px] text-center"
                          >
                            {key === 'Control' ? 'Ctrl' : key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border-main flex items-center justify-between text-[10px] text-text-muted">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Shortcuts can be customized in Settings</span>
          </div>
          <span>Press <kbd className="px-1 py-0.5 bg-bg-secondary rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </Modal>
  );
}
