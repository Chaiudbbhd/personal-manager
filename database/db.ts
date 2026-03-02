import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../notion.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT NOT NULL,
    content TEXT,
    parentId TEXT,
    icon TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Not Started',
    priority TEXT DEFAULT 'Medium',
    date TEXT,
    startTime TEXT,
    endTime TEXT,
    category TEXT,
    tags TEXT,
    assignedTo TEXT,
    parentId TEXT,
    sortOrder INTEGER DEFAULT 0,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (parentId) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    userId TEXT,
    taskId TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS task_attachments (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS week_plans (
    id TEXT PRIMARY KEY,
    userId TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT DEFAULT 'User',
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    theme TEXT DEFAULT 'dark',
    primaryColor TEXT DEFAULT '#6366f1',
    accentColor TEXT DEFAULT '#818cf8',
    sidebarColor TEXT DEFAULT '#202020',
    backgroundOpacity INTEGER DEFAULT 100,
    backgroundImage TEXT,
    sidebarCollapsed INTEGER DEFAULT 0,
    fontSize TEXT DEFAULT 'medium',
    fontFamily TEXT DEFAULT 'Inter',
    compactMode INTEGER DEFAULT 0,
    animations INTEGER DEFAULT 1,
    taskReminders INTEGER DEFAULT 1,
    dailyReminders INTEGER DEFAULT 1,
    weeklyReminders INTEGER DEFAULT 1,
    soundNotifications INTEGER DEFAULT 1,
    visualNotifications INTEGER DEFAULT 1,
    autoSave INTEGER DEFAULT 1,
    autoStart INTEGER DEFAULT 0,
    offlineMode INTEGER DEFAULT 0,
    shortcutsEnabled INTEGER DEFAULT 1,
    customShortcuts TEXT
  );

  CREATE TABLE IF NOT EXISTS user_tokens (
    id TEXT PRIMARY KEY DEFAULT 'default',
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_expiry_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    googleId TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    visibility TEXT DEFAULT 'private',
    ownerId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS workspace_members (
    workspaceId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspaceId, userId),
    FOREIGN KEY (workspaceId) REFERENCES workspaces(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    content TEXT,
    icon TEXT,
    isFavorite INTEGER DEFAULT 0,
    isFeatured INTEGER DEFAULT 0,
    lastUsed DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    pageId TEXT,
    taskId TEXT,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    inlineData TEXT,
    parentId TEXT,
    resolved INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pageId) REFERENCES pages(id),
    FOREIGN KEY (taskId) REFERENCES tasks(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (parentId) REFERENCES comments(id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    userId TEXT NOT NULL,
    actionType TEXT NOT NULL,
    targetId TEXT,
    targetType TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspaceId) REFERENCES workspaces(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS career_hub_settings (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE,
    coverImage TEXT,
    coverReposition INTEGER DEFAULT 0,
    icon TEXT DEFAULT '💼',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    tags TEXT,
    size INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    userId TEXT,
    companyName TEXT NOT NULL,
    roleTitle TEXT NOT NULL,
    companyLogo TEXT,
    jobLink TEXT,
    location TEXT,
    salaryRange TEXT,
    appliedDate TEXT,
    interviewDate TEXT,
    stage TEXT DEFAULT 'Wishlist',
    priority TEXT DEFAULT 'Medium',
    notes TEXT,
    interviewPrep TEXT,
    companyResearch TEXT,
    checklist TEXT,
    archived INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS opportunity_attachments (
    id TEXT PRIMARY KEY,
    opportunityId TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunityId) REFERENCES opportunities(id)
  );
`);

// Add columns to tasks if they don't exist
const tablesToUpdate = ['pages', 'tasks', 'subtasks', 'week_plans', 'resumes', 'opportunities', 'career_hub_settings'];
tablesToUpdate.forEach(table => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN userId TEXT`).run();
  } catch (e) {}
});

try {
  db.prepare('ALTER TABLE tasks ADD COLUMN parentId TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT "Not Started"').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT "Medium"').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN tags TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN assignedTo TEXT').run();
} catch (e) {}

// Add taskId to comments if it doesn't exist
try {
  db.prepare('ALTER TABLE comments ADD COLUMN taskId TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE comments MODIFY COLUMN pageId TEXT').run(); // SQLite doesn't support MODIFY COLUMN directly
} catch (e) {
  // SQLite doesn't support changing NOT NULL constraint easily. 
  // We'll just assume it's fine for now or handle it if it fails.
}

try {
  db.prepare('ALTER TABLE users ADD COLUMN googleId TEXT UNIQUE').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE users MODIFY COLUMN email TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE users MODIFY COLUMN password TEXT').run();
} catch (e) {}

// Initialize default user if none exists
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const userId = 'user-1';
  db.prepare('INSERT INTO users (id, email, password, name, avatar) VALUES (?, ?, ?, ?, ?)').run(
    userId, 
    'user@example.com', 
    '$2a$10$6Rz6k6z6k6z6k6z6k6z6k.6z6k6z6k6z6k6z6k6z6k6z6k6z6k6z6', // password: password
    'Default User', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  );
}

// Initialize default profile and settings
const profile = db.prepare('SELECT id FROM user_profile WHERE id = ?').get('default');
if (!profile) {
  db.prepare('INSERT INTO user_profile (id, name, avatar) VALUES (?, ?, ?)').run('default', 'User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
}

const settings = db.prepare('SELECT id FROM user_settings WHERE id = ?').get('default');
if (!settings) {
  db.prepare('INSERT INTO user_settings (id) VALUES (?)').run('default');
}

const careerSettings = db.prepare('SELECT id FROM career_hub_settings WHERE id = ?').get('default');
if (!careerSettings) {
  db.prepare('INSERT INTO career_hub_settings (id, coverImage) VALUES (?, ?)').run('default', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920');
}

// Migration for user_settings
try {
  db.prepare('ALTER TABLE user_settings ADD COLUMN shortcutsEnabled INTEGER DEFAULT 1').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE user_settings ADD COLUMN customShortcuts TEXT').run();
} catch (e) {}

// Insert a welcome page if none exists
const welcomePage = db.prepare('SELECT id FROM pages LIMIT 1').get();
if (!welcomePage) {
  const id = 'welcome-page';
  db.prepare('INSERT INTO pages (id, title, content, icon) VALUES (?, ?, ?, ?)').run(
    id,
    'Welcome to LPK Notion Manager',
    '<h1>Welcome!</h1><p>This is your new workspace. You can create pages, take notes, and manage your tasks here.</p>',
    '👋'
  );
}

// Insert a default week plan if none exists
const defaultWeek = db.prepare('SELECT id FROM week_plans LIMIT 1').get();
if (!defaultWeek) {
  const id = 'current-week';
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  
  const end = new Date(now);
  end.setDate(now.getDate() - dayOfWeek + 6);
  
  const startStr = (start instanceof Date && !isNaN(start.getTime()) && typeof start.toISOString === 'function') 
    ? (start.toISOString() || '').split('T')[0] 
    : (new Date().toISOString() || '').split('T')[0];
  const endStr = (end instanceof Date && !isNaN(end.getTime()) && typeof end.toISOString === 'function') 
    ? (end.toISOString() || '').split('T')[0] 
    : (new Date().toISOString() || '').split('T')[0];

  db.prepare('INSERT INTO week_plans (id, startDate, endDate) VALUES (?, ?, ?)').run(
    id,
    startStr,
    endStr
  );
}

// Insert default templates if none exist
const defaultTemplatesCheck = db.prepare('SELECT id FROM templates LIMIT 1').get();
if (!defaultTemplatesCheck) {
  const templates = [
    {
      id: 'study-planner-basic',
      title: 'Basic Study Planner',
      description: 'A simple layout for tracking your daily study sessions.',
      category: 'Study Planner Templates',
      icon: '📚',
      isFeatured: 1,
      content: JSON.stringify({
        type: 'page',
        title: 'My Study Plan',
        content: '<h1>Study Plan</h1><p>Focus areas for today:</p><ul><li>Subject 1: ...</li><li>Subject 2: ...</li></ul>'
      })
    },
    {
      id: 'task-mgmt-kanban',
      title: 'Kanban Task Board',
      description: 'Organize your tasks using a visual Kanban board structure.',
      category: 'Task Management Templates',
      icon: '📋',
      isFeatured: 1,
      content: JSON.stringify({
        type: 'tasks',
        items: [
          { title: 'To Do', status: 'Not Started' },
          { title: 'In Progress', status: 'In Progress' },
          { title: 'Done', status: 'Completed' }
        ]
      })
    },
    {
      id: 'project-tracker-pro',
      title: 'Professional Project Tracker',
      description: 'Comprehensive tracker for complex projects with milestones.',
      category: 'Project Tracker Templates',
      icon: '🚀',
      isFeatured: 0,
      content: JSON.stringify({
        type: 'page',
        title: 'Project Dashboard',
        content: '<h2>Project Overview</h2><p>Milestones:</p><ol><li>Phase 1: Research</li><li>Phase 2: Development</li><li>Phase 3: Launch</li></ol>'
      })
    },
    {
      id: 'job-tracker-simple',
      title: 'Job Application Tracker',
      description: 'Keep track of your job applications and interview status.',
      category: 'Job Tracker Templates',
      icon: '💼',
      isFeatured: 1,
      content: JSON.stringify({
        type: 'page',
        title: 'Job Hunt',
        content: '<table><thead><tr><th>Company</th><th>Role</th><th>Status</th></tr></thead><tbody><tr><td>Example Corp</td><td>Frontend Dev</td><td>Applied</td></tr></tbody></table>'
      })
    },
    {
      id: 'habit-tracker-daily',
      title: 'Daily Habit Tracker',
      description: 'Monitor your daily habits and build consistency.',
      category: 'Habit Tracker Templates',
      icon: '✨',
      isFeatured: 0,
      content: JSON.stringify({
        type: 'page',
        title: 'Habit Tracker',
        content: '<h3>Daily Habits</h3><ul><li>[ ] Drink 2L water</li><li>[ ] Read 20 mins</li><li>[ ] Exercise</li></ul>'
      })
    }
  ];

  const insert = db.prepare('INSERT INTO templates (id, title, description, category, icon, isFeatured, content) VALUES (?, ?, ?, ?, ?, ?, ?)');
  templates.forEach(t => {
    insert.run(t.id, t.title, t.description, t.category, t.icon, t.isFeatured, t.content);
  });
}

export default db;
