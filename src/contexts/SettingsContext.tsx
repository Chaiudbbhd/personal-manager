import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserSettings } from '../types';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  profile: UserProfile | null;
  settings: UserSettings | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (data: any) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    console.log('SettingsContext: Fetching profile and settings');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [pRes, sRes] = await Promise.all([
        fetch('/api/profile', { headers }),
        fetch('/api/settings', { headers })
      ]);
      
      if (pRes.status === 401 || sRes.status === 401) {
        console.warn('SettingsContext: Unauthorized access to settings');
        return;
      }

      const pData = await pRes.json();
      const sData = await sRes.json();
      
      console.log('SettingsContext: Data received', { profile: !!pData, settings: !!sData });
      setProfile(pData);
      setSettings(sData);
    } catch (error) {
      console.error('SettingsContext: Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setProfile(null);
      setSettings(null);
    }
  }, [isAuthenticated, fetchData]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile || !token) return;
    const updated = { ...profile, ...data };
    setProfile(updated);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!settings || !token) return;
    const updated = { ...settings, ...data };
    setSettings(updated);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const clearAllData = async () => {
    try {
      await fetch('/api/data/clear', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const exportData = async () => {
    try {
      const res = await fetch('/api/data/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lpk-notion-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const importData = async (data: any) => {
    try {
      await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      profile, 
      settings, 
      updateProfile, 
      updateSettings, 
      refreshData: fetchData,
      clearAllData,
      exportData,
      importData
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
