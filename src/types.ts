export interface Page {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  icon: string;
  updatedAt: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  tags: string | null; // JSON string of tags
  assignedTo: string | null;
  parentId: string | null;
  sortOrder: number;
  lastUpdated: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: number;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface CareerHubSettings {
  id: string;
  coverImage: string | null;
  coverReposition: number;
  icon: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  name: string;
  url: string;
  type: string;
  tags: string | null; // JSON string
  size: number;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  companyName: string;
  roleTitle: string;
  companyLogo: string | null;
  jobLink: string | null;
  location: string | null;
  salaryRange: string | null;
  appliedDate: string | null;
  interviewDate: string | null;
  stage: 'Wishlist' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High';
  notes: string | null;
  interviewPrep: string | null;
  companyResearch: string | null;
  checklist: string | null; // JSON string
  archived: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityAttachment {
  id: string;
  opportunityId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface WeekPlan {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'blue' | 'purple' | 'green' | 'custom';
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  backgroundOpacity: number;
  backgroundImage: string;
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  compactMode: boolean;
  animations: boolean;
  taskReminders: boolean;
  dailyReminders: boolean;
  weeklyReminders: boolean;
  soundNotifications: boolean;
  visualNotifications: boolean;
  autoSave: boolean;
  autoStart: boolean;
  offlineMode: boolean;
  shortcutsEnabled: boolean;
  customShortcuts: string; // JSON string of Shortcut[]
}

export interface Shortcut {
  id: string;
  label: string;
  keys: string;
  enabled: boolean;
  category: 'Global' | 'Editor';
}

export interface AppState {
  profile: UserProfile;
  settings: UserSettings;
}

export interface Template {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  category: string;
  content: string; // JSON string
  icon: string;
  isFavorite: boolean;
  isFeatured: boolean;
  lastUsed: string | null;
  createdAt: string;
}
