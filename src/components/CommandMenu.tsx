import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, 
  Image as ImageIcon, Code, Quote,
  Search, Plus
} from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
  position: { x: number; y: number };
}

const COMMANDS = [
  { id: 'text', label: 'Text', icon: Type, description: 'Just start writing with plain text.' },
  { id: 'h1', label: 'Heading 1', icon: Heading1, description: 'Big section heading.' },
  { id: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading.' },
  { id: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small section heading.' },
  { id: 'bulletList', label: 'Bulleted list', icon: List, description: 'Create a simple bulleted list.' },
  { id: 'orderedList', label: 'Numbered list', icon: ListOrdered, description: 'Create a list with numbering.' },
  { id: 'taskList', label: 'To-do list', icon: CheckSquare, description: 'Track tasks with a to-do list.' },
  { id: 'blockquote', label: 'Quote', icon: Quote, description: 'Capture a quotation.' },
  { id: 'codeBlock', label: 'Code', icon: Code, description: 'Capture a code snippet.' },
];

export default function CommandMenu({ isOpen, onClose, onSelect, position }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(COMMANDS[selectedIndex].id);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="fixed z-[2000] w-72 bg-bg-sidebar border border-border-main rounded-xl shadow-2xl overflow-hidden"
        style={{ top: position.y, left: position.x }}
      >
        <div className="p-2 border-b border-border-main bg-bg-sidebar">
          <div className="flex items-center gap-2 px-2 py-1">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Filter commands..." 
              className="bg-transparent border-none outline-none text-xs text-text-primary w-full placeholder-text-muted/50"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-1 custom-scrollbar">
          <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Basic Blocks</p>
          {COMMANDS.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.id)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedIndex === i ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-muted hover:bg-bg-hover hover:text-text-secondary'
              }`}
            >
              <div className={`p-1.5 rounded-md border ${selectedIndex === i ? 'bg-accent-blue/20 border-accent-blue/30' : 'bg-bg-secondary border-border-main'}`}>
                <cmd.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cmd.label}</p>
                <p className="text-[10px] text-text-muted truncate">{cmd.description}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
