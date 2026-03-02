import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, ExternalLink, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  hangoutLink?: string;
}

function MeetingsView() {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setIsConnected(data.connected);
      if (data.connected) {
        fetchEvents();
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Status check failed:', err);
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else if (res.status === 401) {
        setIsConnected(false);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError('An error occurred while fetching events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        setIsConnected(true);
        fetchEvents();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err) {
      console.error('Failed to get auth URL:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      setIsConnected(false);
      setEvents([]);
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  if (isConnected === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-primary">
        <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center mb-6">
          <Calendar className="w-8 h-8 text-accent-blue" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Google Calendar</h2>
        <p className="text-text-muted max-w-md mb-8 leading-relaxed">
          Sync your meetings and events directly into your workspace. Stay on top of your schedule without switching tabs.
        </p>
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent-blue/20 active:scale-95"
        >
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Upcoming Meetings</h2>
            <p className="text-xs text-text-muted">Your schedule from Google Calendar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={isLoading}
            className="p-2 hover:bg-bg-hover rounded-lg text-text-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          <button
            onClick={handleDisconnect}
            className="p-2 hover:bg-accent-red/10 rounded-lg text-text-muted hover:text-accent-red transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-accent-blue animate-spin mb-4" />
            <p className="text-text-muted text-sm">Fetching your meetings...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-accent-red">
            <AlertCircle className="w-8 h-8 mb-4" />
            <p className="text-sm">{error}</p>
            <button onClick={fetchEvents} className="mt-4 text-accent-blue hover:underline text-sm">Try again</button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Calendar className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm">No upcoming meetings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const start = event.start.dateTime ? parseISO(event.start.dateTime) : (event.start.date ? parseISO(event.start.date) : new Date());
              const isToday = format(start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-secondary border border-border-main rounded-2xl p-5 hover:border-accent-blue/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      isToday ? "bg-accent-blue/20 text-accent-blue" : "bg-text-muted/10 text-text-muted"
                    )}>
                      {isToday ? 'Today' : format(start, 'MMM d')}
                    </div>
                    {event.hangoutLink && (
                      <a
                        href={event.hangoutLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20"
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <h3 className="font-bold text-text-secondary mb-2 group-hover:text-text-primary transition-colors line-clamp-1">
                    {event.summary}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {event.start.dateTime ? format(start, 'h:mm a') : 'All Day'}
                        {event.end.dateTime && ` - ${format(parseISO(event.end.dateTime), 'h:mm a')}`}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-text-muted italic line-clamp-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="mt-4 text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetingsView;
