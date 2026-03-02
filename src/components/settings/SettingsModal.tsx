import React, { useState } from 'react';
import { 
  User, Palette, Monitor, Bell, Database, 
  Settings as SettingsIcon, X, Upload, Check,
  Image as ImageIcon, Type, Layout, Sparkles,
  Shield, Trash2, Download, RefreshCw, Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../../contexts/SettingsContext';
import { useShortcuts } from '../../contexts/ShortcutsContext';
import { useAuth } from '../../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { LogOut } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
];

const DEFAULT_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1434725039720-aaad6dd32dee?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000',
];

const THEMES = [
  { id: 'dark', name: 'Dark', primary: '#3B82F6', accent: '#8B5CF6', sidebar: '#1F1F1F' },
  { id: 'light', name: 'Light', primary: '#37352F', accent: '#3B82F6', sidebar: '#FBFBFA' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const { profile, settings, updateProfile, updateSettings, clearAllData, exportData, importData } = useSettings();
  const { shortcuts, updateShortcut, toggleShortcut } = useShortcuts();
  const { logout } = useAuth();

  if (!isOpen || !profile || !settings) return null;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'appearance', name: 'Appearance', icon: Monitor },
    { id: 'themes', name: 'Themes', icon: Palette },
    { id: 'background', name: 'Background', icon: ImageIcon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'shortcuts', name: 'Shortcuts', icon: Keyboard },
    { id: 'data', name: 'Data', icon: Database },
    { id: 'advanced', name: 'Advanced', icon: SettingsIcon },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'avatar') updateProfile({ avatar: base64String });
        else updateSettings({ backgroundImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-4xl h-[80vh] bg-bg-primary border border-border-main rounded-xl shadow-2xl overflow-hidden flex transition-colors duration-150"
      >
        {/* Sidebar */}
        <div className="w-64 bg-bg-sidebar border-r border-border-main flex flex-col">
          <div className="p-6">
            <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted uppercase tracking-widest">
              <SettingsIcon className="w-4 h-4 text-accent-blue" />
              Settings
            </h2>
          </div>
          
          <nav className="flex-1 px-3 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                  activeTab === tab.id 
                    ? "bg-bg-hover text-text-primary" 
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border-main space-y-2">
            <div className="flex items-center gap-3 px-2">
              <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded bg-bg-hover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{profile.name}</p>
                <p className="text-[10px] text-text-muted truncate">Free Plan</p>
              </div>
            </div>
            <button 
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-accent-red hover:bg-accent-red/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
          <div className="p-4 border-b border-border-main flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {tabs.find(t => t.id === activeTab)?.name}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-12">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-12"
                >
                  <section>
                    <h4 className="text-sm font-bold text-text-primary mb-4">Display Name</h4>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => updateProfile({ name: e.target.value })}
                      className="w-full max-w-md bg-bg-secondary border border-border-main rounded-md px-4 py-2 text-sm focus:outline-none focus:border-accent-blue transition-colors text-text-primary"
                    />
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-text-primary mb-4">Profile Picture</h4>
                    <div className="flex flex-wrap gap-6">
                      <div className="relative group">
                        <img src={profile.avatar} alt="Current" className="w-24 h-24 rounded-lg bg-bg-secondary border border-border-main" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'avatar')} />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_AVATARS.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => updateProfile({ avatar: url })}
                            className={cn(
                              "w-12 h-12 rounded border-2 transition-all overflow-hidden",
                              profile.avatar === url ? "border-accent-blue scale-105" : "border-transparent hover:border-border-main"
                            )}
                          >
                            <img src={url} alt={`Avatar ${i}`} className="w-full h-full" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-12"
                >
                  <section className="grid grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary mb-4">Font Size</h4>
                      <div className="flex gap-2">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            onClick={() => updateSettings({ fontSize: size as any })}
                            className={cn(
                              "flex-1 py-2 rounded-md text-xs font-medium border transition-all capitalize",
                              settings.fontSize === size 
                                ? "bg-accent-blue/10 border-accent-blue text-accent-blue" 
                                : "bg-bg-secondary border-border-main text-text-secondary hover:border-text-muted"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary mb-4">Font Family</h4>
                      <select
                        value={settings.fontFamily}
                        onChange={e => updateSettings({ fontFamily: e.target.value })}
                        className="w-full bg-bg-secondary border border-border-main rounded-md px-4 py-2 text-sm focus:outline-none focus:border-accent-blue transition-colors text-text-primary"
                      >
                        <option value="Inter">Inter (Sans)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                        <option value="Georgia">Georgia (Serif)</option>
                        <option value="system-ui">System UI</option>
                      </select>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-main">
                      <div className="flex items-center gap-3">
                        <Layout className="w-5 h-5 text-accent-blue" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">Compact Mode</p>
                          <p className="text-xs text-text-muted">Reduce padding and font sizes for a denser layout.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          settings.compactMode ? "bg-accent-blue" : "bg-border-main"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          settings.compactMode ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-main">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-accent-blue" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">Animations</p>
                          <p className="text-xs text-text-muted">Enable smooth transitions and UI effects.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSettings({ animations: !settings.animations })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          settings.animations ? "bg-accent-blue" : "bg-border-main"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          settings.animations ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'themes' && (
                <motion.div
                  key="themes"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-12"
                >
                  <section>
                    <h4 className="text-sm font-bold text-text-primary mb-4">Workspace Theme</h4>
                    <div className="grid grid-cols-2 gap-6">
                      {THEMES.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => updateSettings({ 
                            theme: theme.id as any,
                            primaryColor: theme.primary,
                            accentColor: theme.accent,
                            sidebarColor: theme.sidebar
                          })}
                          className={cn(
                            "p-6 rounded-xl border-2 text-left transition-all group",
                            settings.theme === theme.id ? "border-accent-blue bg-accent-blue/5" : "border-border-main hover:border-text-muted"
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-text-primary">{theme.name}</span>
                            {settings.theme === theme.id && <Check className="w-4 h-4 text-accent-blue" />}
                          </div>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded border border-border-main" style={{ backgroundColor: theme.primary }} />
                            <div className="w-8 h-8 rounded border border-border-main" style={{ backgroundColor: theme.accent }} />
                            <div className="w-8 h-8 rounded border border-border-main" style={{ backgroundColor: theme.sidebar }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-sm font-bold text-text-primary">Custom Colors</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Primary Color</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            value={settings.primaryColor} 
                            onChange={e => updateSettings({ primaryColor: e.target.value, theme: 'custom' })}
                            className="w-10 h-10 rounded bg-transparent cursor-pointer border border-border-main"
                          />
                          <input 
                            type="text" 
                            value={settings.primaryColor} 
                            onChange={e => updateSettings({ primaryColor: e.target.value, theme: 'custom' })}
                            className="flex-1 bg-bg-secondary border border-border-main rounded-md px-3 text-xs font-mono text-text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Accent Color</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            value={settings.accentColor} 
                            onChange={e => updateSettings({ accentColor: e.target.value, theme: 'custom' })}
                            className="w-10 h-10 rounded bg-transparent cursor-pointer border border-border-main"
                          />
                          <input 
                            type="text" 
                            value={settings.accentColor} 
                            onChange={e => updateSettings({ accentColor: e.target.value, theme: 'custom' })}
                            className="flex-1 bg-bg-secondary border border-border-main rounded-md px-3 text-xs font-mono text-text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'background' && (
                <motion.div
                  key="background"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-12"
                >
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-bold text-text-primary">Workspace Background</h4>
                      <button 
                        onClick={() => updateSettings({ backgroundImage: '' })}
                        className="text-xs text-accent-blue hover:text-accent-blue/80 font-medium"
                      >
                        Reset to Default
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <label className="aspect-video rounded-xl border-2 border-dashed border-border-main hover:border-accent-blue flex flex-col items-center justify-center cursor-pointer transition-all group bg-bg-secondary">
                        <Upload className="w-6 h-6 text-text-muted group-hover:text-accent-blue mb-2" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Upload Custom</span>
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'background')} />
                      </label>
                      
                      {DEFAULT_BACKGROUNDS.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => updateSettings({ backgroundImage: url })}
                          className={cn(
                            "aspect-video rounded-xl border-2 transition-all overflow-hidden relative group",
                            settings.backgroundImage === url ? "border-accent-blue" : "border-transparent hover:border-border-main"
                          )}
                        >
                          <img src={url} alt={`Background ${i}`} className="w-full h-full object-cover" />
                          {settings.backgroundImage === url && (
                            <div className="absolute inset-0 bg-accent-blue/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-text-primary">Background Opacity</h4>
                      <span className="text-xs font-mono text-text-muted">{settings.backgroundOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.backgroundOpacity}
                      onChange={e => updateSettings({ backgroundOpacity: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-accent-blue"
                    />
                  </section>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                >
                  {[
                    { id: 'taskReminders', name: 'Task Reminders', desc: 'Get notified when tasks are due.' },
                    { id: 'dailyReminders', name: 'Daily Study Reminders', desc: 'A morning summary of your study goals.' },
                    { id: 'weeklyReminders', name: 'Weekly Planner Reminders', desc: 'Review your progress every Sunday.' },
                    { id: 'soundNotifications', name: 'Sound Notifications', desc: 'Play a sound for alerts.' },
                    { id: 'visualNotifications', name: 'Visual Notifications', desc: 'Show desktop notifications.' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-main">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => updateSettings({ [item.id]: !settings[item.id as keyof typeof settings] })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          settings[item.id as keyof typeof settings] ? "bg-accent-blue" : "bg-border-main"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          settings[item.id as keyof typeof settings] ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'shortcuts' && (
                <motion.div
                  key="shortcuts"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-main">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Enable Shortcuts</p>
                      <p className="text-xs text-text-muted">Enable or disable all keyboard shortcuts.</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ shortcutsEnabled: !settings.shortcutsEnabled })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        settings.shortcutsEnabled ? "bg-accent-blue" : "bg-border-main"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.shortcutsEnabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Customize Shortcuts</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {shortcuts.map(shortcut => (
                        <div 
                          key={shortcut.id}
                          className="flex items-center justify-between p-3 bg-bg-secondary border border-border-main rounded-lg group"
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleShortcut(shortcut.id)}
                              className={cn(
                                "w-4 h-4 rounded border transition-colors flex items-center justify-center",
                                shortcut.enabled ? "bg-accent-blue border-accent-blue" : "border-border-main hover:border-text-muted"
                              )}
                            >
                              {shortcut.enabled && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{shortcut.label}</p>
                              <p className="text-[10px] text-text-muted uppercase tracking-widest">{shortcut.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={shortcut.keys}
                              onChange={(e) => updateShortcut(shortcut.id, e.target.value)}
                              className="w-32 bg-bg-primary border border-border-main rounded px-2 py-1 text-[10px] font-mono text-accent-blue focus:outline-none focus:border-accent-blue"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={exportData}
                      className="p-8 bg-bg-secondary border border-border-main rounded-xl hover:border-accent-blue transition-all text-left group"
                    >
                      <Download className="w-8 h-8 text-accent-blue mb-4 group-hover:scale-110 transition-transform" />
                      <h5 className="text-sm font-bold text-text-primary mb-1">Export Data</h5>
                      <p className="text-xs text-text-muted">Download all your pages and tasks as a JSON file.</p>
                    </button>
                    
                    <label className="p-8 bg-bg-secondary border border-border-main rounded-xl hover:border-accent-blue transition-all text-left group cursor-pointer">
                      <RefreshCw className="w-8 h-8 text-accent-green mb-4 group-hover:rotate-180 transition-transform duration-500" />
                      <h5 className="text-sm font-bold text-text-primary mb-1">Import Data</h5>
                      <p className="text-xs text-text-muted">Restore your workspace from a backup file.</p>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".json" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const text = await file.text();
                            try {
                              const data = JSON.parse(text);
                              if (confirm('This will replace all current data. Continue?')) {
                                importData(data);
                              }
                            } catch (err) {
                              alert('Invalid backup file');
                            }
                          }
                        }} 
                      />
                    </label>
                  </div>

                  <div className="p-8 bg-accent-red/5 border border-accent-red/20 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <Shield className="w-6 h-6 text-accent-red" />
                      <h5 className="text-sm font-bold text-accent-red">Danger Zone</h5>
                    </div>
                    <p className="text-xs text-text-muted mb-6">Once you clear your data, there is no going back. Please be certain.</p>
                    <button 
                      onClick={() => {
                        if (confirm('Are you absolutely sure you want to clear all data? This cannot be undone.')) {
                          clearAllData();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-accent-red hover:bg-accent-red/90 text-white rounded-md text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                >
                  {[
                    { id: 'autoSave', name: 'Auto-Save', desc: 'Automatically save changes as you type.' },
                    { id: 'autoStart', name: 'Auto-Start', desc: 'Launch LPK Notion on system startup.' },
                    { id: 'offlineMode', name: 'Offline Mode', desc: 'Cache data for offline access.' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-main">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => updateSettings({ [item.id]: !settings[item.id as keyof typeof settings] })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          settings[item.id as keyof typeof settings] ? "bg-accent-blue" : "bg-border-main"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          settings[item.id as keyof typeof settings] ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
