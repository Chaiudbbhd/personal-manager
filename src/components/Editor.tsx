import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Page } from '../types';
import CommandMenu from './CommandMenu';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Share2, X, Users, Clock, Loader2 } from 'lucide-react';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useShortcuts } from '../contexts/ShortcutsContext';
import { format } from 'date-fns';

interface EditorProps {
  page: Page;
  onUpdate: (id: string, data: Partial<Page>) => void;
}

interface Comment {
  id: string;
  content: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  resolved: boolean;
}

export default function Editor({ page, onUpdate }: EditorProps) {
  const { activeUsers, joinRoom, sendCursor, sendEdit } = useCollaboration();
  const { profile, settings } = useSettings();
  const { isFocusMode, setIsFocusMode } = useShortcuts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [commandMenuPos, setCommandMenuPos] = useState({ x: 0, y: 0 });
  const token = localStorage.getItem('lpk_token');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline
    ],
    content: page.content || '',
    editorProps: {
      attributes: {
        class: `prose ${settings?.theme === 'dark' ? 'prose-invert' : ''} max-w-none focus:outline-none min-h-[500px] notion-editor text-text-primary`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only update if content actually changed to avoid infinite loops or unnecessary saves
      if (html !== page.content) {
        onUpdate(page.id, { content: html });
        sendEdit(html);
      }

      // Check for / to open command menu
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;
      const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 1), $from.parentOffset, undefined, "\0");
      
      if (textBefore === '/') {
        const coords = editor.view.coordsAtPos($from.pos);
        setCommandMenuPos({ x: coords.left, y: coords.bottom + 10 });
        setIsCommandMenuOpen(true);
      } else if (isCommandMenuOpen) {
        setIsCommandMenuOpen(false);
      }
    },
  });

  // Update editor content when page changes or collab edit happens
  useEffect(() => {
    if (editor && page.content !== undefined && page.content !== editor.getHTML()) {
      editor.commands.setContent(page.content || '');
    }
  }, [page.id, page.content, editor]);

  useEffect(() => {
    joinRoom('default-workspace', page.id);
    fetchComments();

    const handleCollabEdit = (e: any) => {
      if (e.detail.pageId === page.id && editor) {
        editor.commands.setContent(e.detail.content);
      }
    };
    window.addEventListener('collab_edit', handleCollabEdit);

    const handleShortcut = (e: any) => {
      if (!editor) return;
      const id = e.detail;
      switch (id) {
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'underline':
          editor.chain().focus().toggleUnderline().run();
          break;
        case 'command-menu':
          if (editor) {
            const { selection } = editor.state;
            const coords = editor.view.coordsAtPos(selection.from);
            setCommandMenuPos({ x: coords.left, y: coords.bottom + 10 });
            setIsCommandMenuOpen(true);
          }
          break;
      }
    };
    window.addEventListener('app_shortcut', handleShortcut);

    return () => {
      window.removeEventListener('collab_edit', handleCollabEdit);
      window.removeEventListener('app_shortcut', handleShortcut);
    };
  }, [page.id, joinRoom, editor]);

  const fetchComments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/pages/${page.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;
    try {
      const res = await fetch(`/api/pages/${page.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    sendCursor(e.clientX, e.clientY);
  };

  const handleCommandSelect = (commandId: string) => {
    if (!editor) return;

    // Delete the / character
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 1), $from.parentOffset, undefined, "\0");
    
    if (textBefore === '/') {
      editor.chain().focus().deleteRange({ from: selection.from - 1, to: selection.from }).run();
    }

    switch (commandId) {
      case 'h1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case 'h2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'h3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList': editor.chain().focus().toggleOrderedList().run(); break;
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break;
      case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break;
    }
    setIsCommandMenuOpen(false);
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-bg-primary relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <CommandMenu 
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onSelect={handleCommandSelect}
        position={commandMenuPos}
      />
      {/* Top Bar with Active Users */}
      <div className="h-14 border-b border-border-main flex items-center justify-between px-6 bg-bg-sidebar">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {activeUsers.map(user => (
              <div 
                key={user.clientId} 
                className="w-7 h-7 rounded-full border-2 border-bg-sidebar bg-bg-secondary overflow-hidden group relative"
              >
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {user.name}
                </div>
              </div>
            ))}
          </div>
          <div className="h-4 w-px bg-border-main" />
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-secondary truncate max-w-[200px]">{page.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors relative",
              isCommentsOpen ? "bg-accent-blue/10 text-accent-blue" : "text-text-muted hover:bg-bg-hover"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            {comments.filter(c => !c.resolved).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-blue rounded-full" />
            )}
          </button>
          <button className="p-2 text-text-muted hover:bg-bg-hover rounded-lg transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={page.id}
          className="flex-1 overflow-y-auto px-20 py-20 custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="mb-10 group">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-7xl hover:bg-bg-hover p-2 rounded-xl cursor-pointer transition-colors">
                  {page.icon || '📄'}
                </span>
              </div>
              <input
                type="text"
                value={page.title || ''}
                onChange={(e) => onUpdate(page.id, { title: e.target.value })}
                placeholder="Untitled"
                className="w-full text-5xl font-bold bg-transparent border-none focus:outline-none placeholder-text-muted/30 text-text-primary"
              />
            </div>

            {/* Rich Text Editor */}
            {!editor ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
              </div>
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </motion.div>

        {/* Comments Sidebar */}
        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 border-l border-border-main bg-bg-sidebar flex flex-col"
            >
              <div className="p-4 border-b border-border-main flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">Comments</h3>
                <button onClick={() => setIsCommentsOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="py-20 text-center text-text-muted">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-10" />
                    <p className="text-xs">No comments yet</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-bg-secondary border border-border-main rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <img src={comment.userAvatar} alt={comment.userName} className="w-5 h-5 rounded-full bg-bg-hover" />
                        <span className="text-[10px] font-bold text-text-secondary">{comment.userName}</span>
                        <span className="text-[9px] text-text-muted">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddComment} className="p-4 border-t border-border-main">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-bg-secondary border border-border-main rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Cursors */}
      {activeUsers
        .filter(user => user.cursor && user.id !== profile?.name)
        .map(user => (
          <motion.div 
            key={user.clientId}
            className="fixed pointer-events-none z-[1000] flex flex-col items-start"
            animate={{ x: user.cursor!.x, y: user.cursor!.y }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 0.5L16.7839 15.5406L12.3673 15.6538L12.3673 15.6538L5.65376 12.3673Z" fill="var(--accent-blue)" stroke="white"/>
            </svg>
            <div className="mt-1 px-2 py-1 bg-accent-blue text-[10px] font-bold text-white rounded shadow-lg whitespace-nowrap">
              {user.name}
            </div>
          </motion.div>
        )
      )}

      {/* Focus Mode Indicator */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsFocusMode(false)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-accent-blue/90 hover:bg-accent-blue text-white text-xs font-bold rounded-full shadow-xl backdrop-blur-sm flex items-center gap-2 group transition-all z-50"
          >
            <Clock className="w-4 h-4" />
            <span>Focus Mode Active</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Ctrl+Shift+F to exit</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
