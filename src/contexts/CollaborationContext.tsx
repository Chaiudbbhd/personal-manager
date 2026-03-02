import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSettings } from './SettingsContext';

interface User {
  id: string;
  clientId: string;
  name: string;
  avatar: string;
  cursor?: { x: number; y: number };
}

interface CollaborationContextType {
  activeUsers: User[];
  ws: WebSocket | null;
  joinRoom: (workspaceId: string, pageId: string) => void;
  sendCursor: (x: number, y: number) => void;
  sendEdit: (content: string) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const { profile } = useSettings();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'active_users':
          setActiveUsers(data.users);
          break;
        case 'cursor_move':
          setActiveUsers(prev => prev.map(u => u.clientId === data.clientId ? { ...u, cursor: data.cursor } : u));
          break;
        case 'content_change':
          // Handle content change in Editor component via window event or similar
          window.dispatchEvent(new CustomEvent('collab_edit', { detail: data }));
          break;
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const joinRoom = useCallback((workspaceId: string, pageId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN && profile) {
      ws.send(JSON.stringify({
        type: 'join',
        userId: profile.name, // Using name as ID for simplicity in this demo, should be real ID
        workspaceId,
        pageId,
        name: profile.name,
        avatar: profile.avatar
      }));
    }
  }, [ws, profile]);

  const sendCursor = useCallback((x: number, y: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'cursor', cursor: { x, y } }));
    }
  }, [ws]);

  const sendEdit = useCallback((content: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'edit', content }));
    }
  }, [ws]);

  return (
    <CollaborationContext.Provider value={{ activeUsers, ws, joinRoom, sendCursor, sendEdit }}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}
