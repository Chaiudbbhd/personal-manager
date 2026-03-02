import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./database/db.ts";
import { v4 as uuidv4 } from 'uuid';
import { google } from "googleapis";
import cookieSession from "cookie-session";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'lpk-jwt-secret';

const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // WebSocket logic
  const clients = new Map<string, { ws: WebSocket; userId: string; workspaceId?: string; pageId?: string; name: string; avatar: string; cursor?: { x: number; y: number } }>();

  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    
    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'join':
          clients.set(clientId, { 
            ws, 
            userId: data.userId, 
            workspaceId: data.workspaceId, 
            pageId: data.pageId,
            name: data.name,
            avatar: data.avatar
          });
          broadcastToRoom(data.workspaceId, data.pageId, { type: 'user_joined', clientId, user: { id: data.userId, name: data.name, avatar: data.avatar } });
          sendActiveUsers(data.workspaceId, data.pageId);
          break;
          
        case 'cursor':
          const client = clients.get(clientId);
          if (client) {
            client.cursor = data.cursor;
            broadcastToRoom(client.workspaceId, client.pageId, { type: 'cursor_move', clientId, userId: client.userId, name: client.name, cursor: data.cursor }, clientId);
          }
          break;
          
        case 'edit':
          const editClient = clients.get(clientId);
          if (editClient) {
            broadcastToRoom(editClient.workspaceId, editClient.pageId, { type: 'content_change', pageId: data.pageId, content: data.content }, clientId);
          }
          break;
      }
    });

    ws.on('close', () => {
      const client = clients.get(clientId);
      if (client) {
        broadcastToRoom(client.workspaceId, client.pageId, { type: 'user_left', clientId });
        clients.delete(clientId);
        sendActiveUsers(client.workspaceId, client.pageId);
      }
    });
  });

  function broadcastToRoom(workspaceId: string | undefined, pageId: string | undefined, message: any, excludeClientId?: string) {
    clients.forEach((client, id) => {
      if (id !== excludeClientId && client.workspaceId === workspaceId && client.pageId === pageId) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  function sendActiveUsers(workspaceId: string | undefined, pageId: string | undefined) {
    const activeUsers: any[] = [];
    clients.forEach((client, id) => {
      if (client.workspaceId === workspaceId && client.pageId === pageId) {
        activeUsers.push({ clientId: id, id: client.userId, name: client.name, avatar: client.avatar });
      }
    });
    broadcastToRoom(workspaceId, pageId, { type: 'active_users', users: activeUsers });
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'lpk-secret-key'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: 'none'
  }));

  const getOAuth2Client = () => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL}/api/auth/google/callback`
    );
  };

  // API Routes
  
  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) return res.status(400).json({ error: "Email already exists" });

      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('INSERT INTO users (id, email, password, name, avatar) VALUES (?, ?, ?, ?, ?)').run(
        id, email, hashedPassword, name, `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      );
      
      const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, email, name } });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    const user = db.prepare('SELECT id, email, name, avatar FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.post('/api/auth/reset-password', (req, res) => {
    // Placeholder for password reset logic
    res.json({ message: "Password reset email sent (simulated)" });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    // Placeholder for email verification logic
    res.json({ message: "Verification email sent (simulated)" });
  });

  app.get('/api/auth/google/signin-url', (req, res) => {
    const client = getOAuth2Client();
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get('/api/auth/google/signin-callback', async (req, res) => {
    const { code } = req.query;
    const client = getOAuth2Client();
    try {
      const { tokens } = await client.getToken(code as string);
      client.setCredentials(tokens);
      
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();
      
      if (!data.email) return res.status(400).send('Email not provided by Google');

      let user: any = db.prepare('SELECT * FROM users WHERE googleId = ? OR email = ?').get(data.id, data.email);
      
      if (!user) {
        const id = uuidv4();
        db.prepare('INSERT INTO users (id, email, googleId, name, avatar) VALUES (?, ?, ?, ?, ?)').run(
          id, data.email, data.id, data.name, data.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`
        );
        user = { id, email: data.email, name: data.name, avatar: data.picture };
      } else if (!user.googleId) {
        db.prepare('UPDATE users SET googleId = ? WHERE id = ?').run(data.id, user.id);
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: 'google_signin', 
                  token: '${token}',
                  user: ${JSON.stringify({ id: user.id, email: user.email, name: user.name, avatar: user.avatar })}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Sync Route
  app.post('/api/sync', authenticate, async (req: any, res) => {
    const { type, data } = req.body;
    const userId = req.user.id;
    
    try {
      db.transaction(() => {
        if (type === 'pages') {
          data.forEach((page: any) => {
            db.prepare(`
              INSERT OR REPLACE INTO pages (id, userId, title, content, parentId, icon, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(page.id, userId, page.title, page.content, page.parentId, page.icon, page.updatedAt);
          });
        }
        // Add other types as needed
      })();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // Google Auth
  app.get('/api/auth/google/url', (req, res) => {
    const client = getOAuth2Client();
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const client = getOAuth2Client();
    try {
      const { tokens } = await client.getToken(code as string);
      db.prepare(`
        INSERT OR REPLACE INTO user_tokens (id, google_access_token, google_refresh_token, google_expiry_date)
        VALUES (?, ?, ?, ?)
      `).run('default', tokens.access_token, tokens.refresh_token, tokens.expiry_date);
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google Auth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/auth/google/status', (req, res) => {
    const tokens = db.prepare('SELECT google_access_token FROM user_tokens WHERE id = ?').get('default');
    res.json({ connected: !!tokens?.google_access_token });
  });

  app.post('/api/auth/google/disconnect', (req, res) => {
    db.prepare('UPDATE user_tokens SET google_access_token = NULL, google_refresh_token = NULL, google_expiry_date = NULL WHERE id = ?').run('default');
    res.json({ success: true });
  });

  // Calendar Events
  app.get('/api/calendar/events', async (req, res) => {
    const tokens = db.prepare('SELECT * FROM user_tokens WHERE id = ?').get('default');
    if (!tokens || !tokens.google_access_token) {
      return res.status(401).json({ error: 'Not connected to Google Calendar' });
    }

    const client = getOAuth2Client();
    client.setCredentials({
      access_token: tokens.google_access_token,
      refresh_token: tokens.google_refresh_token,
      expiry_date: tokens.google_expiry_date
    });

    // Handle token refresh if needed
    client.on('tokens', (newTokens) => {
      if (newTokens.access_token) {
        db.prepare('UPDATE user_tokens SET google_access_token = ?, google_expiry_date = ? WHERE id = ?')
          .run(newTokens.access_token, newTokens.expiry_date, 'default');
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      res.json(response.data.items);
    } catch (error) {
      console.error('Calendar API Error:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });
  
  // Pages
  app.get("/api/pages", authenticate, (req: any, res) => {
    try {
      const pages = db.prepare('SELECT * FROM pages WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.post("/api/pages", authenticate, (req: any, res) => {
    try {
      const { title, content, parentId, icon } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO pages (id, userId, title, content, parentId, icon) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, req.user.id, title || 'Untitled', content || '', parentId || null, icon || '📄'
      );
      const newPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
      res.json(newPage);
    } catch (error) {
      res.status(500).json({ error: "Failed to create page" });
    }
  });

  app.put("/api/pages/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, content, icon, parentId } = req.body;
      db.prepare('UPDATE pages SET title = ?, content = ?, icon = ?, parentId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?').run(
        title, content, icon, parentId, id, req.user.id
      );
      const updatedPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
      res.json(updatedPage);
    } catch (error) {
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  app.delete("/api/pages/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Recursive deletion helper
      const deletePageRecursive = (pageId: string) => {
        // Find children
        const children = db.prepare('SELECT id FROM pages WHERE parentId = ? AND userId = ?').all(pageId, req.user.id) as { id: string }[];
        
        // Delete children first
        children.forEach(child => deletePageRecursive(child.id));
        
        // Delete comments for this page
        db.prepare('DELETE FROM comments WHERE pageId = ?').run(pageId);
        
        // Delete the page itself
        db.prepare('DELETE FROM pages WHERE id = ? AND userId = ?').run(pageId, req.user.id);
      };

      deletePageRecursive(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Server: Failed to delete page:', error);
      res.status(500).json({ error: "Failed to delete page" });
    }
  });

  // Tasks
  app.get("/api/tasks", authenticate, (req: any, res) => {
    try {
      const tasks = db.prepare('SELECT * FROM tasks WHERE userId = ? ORDER BY sortOrder ASC, createdAt DESC').all(req.user.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticate, (req: any, res) => {
    try {
      const { title, description, date, startTime, endTime, category, sortOrder, status, priority, tags, assignedTo, parentId } = req.body;
      const id = uuidv4();
      db.prepare(`
        INSERT INTO tasks (id, userId, title, description, date, startTime, endTime, category, sortOrder, status, priority, tags, assignedTo, parentId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, req.user.id, title, description || '', date || new Date().toISOString().split('T')[0], 
        startTime || '09:00', endTime || '10:00', category || 'personal', sortOrder || 0,
        status || 'Not Started', priority || 'Medium', tags || '[]', assignedTo || null, parentId || null
      );
      const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      res.json(newTask);
    } catch (error) {
      console.error('Server: Failed to create task:', error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, description, completed, date, startTime, endTime, category, sortOrder, status, priority, tags, assignedTo } = req.body;
      db.prepare(`
        UPDATE tasks SET 
          title = ?, description = ?, completed = ?, date = ?, startTime = ?, endTime = ?, 
          category = ?, sortOrder = ?, status = ?, priority = ?, tags = ?, assignedTo = ?,
          lastUpdated = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(
        title, description, completed ? 1 : 0, date, startTime, endTime, 
        category, sortOrder, status, priority, tags, assignedTo, id, req.user.id
      );
      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      res.json(updatedTask);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleteTaskRecursive = (taskId: string) => {
        // Find children
        const children = db.prepare('SELECT id FROM tasks WHERE parentId = ? AND userId = ?').all(taskId, req.user.id) as { id: string }[];
        
        // Delete children first
        children.forEach(child => deleteTaskRecursive(child.id));
        
        // Delete subtasks from old table if any
        db.prepare('DELETE FROM subtasks WHERE taskId = ? AND userId = ?').run(taskId, req.user.id);
        
        // Delete attachments and comments
        db.prepare('DELETE FROM task_attachments WHERE taskId = ?').run(taskId);
        db.prepare('DELETE FROM comments WHERE taskId = ?').run(taskId);
        
        // Delete the task itself
        db.prepare('DELETE FROM tasks WHERE id = ? AND userId = ?').run(taskId, req.user.id);
      };

      deleteTaskRecursive(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Server: Failed to delete task:', error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Subtasks
  app.get("/api/tasks/:taskId/subtasks", authenticate, (req: any, res) => {
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE taskId = ? AND userId = ? ORDER BY createdAt ASC').all(req.params.taskId, req.user.id);
    res.json(subtasks);
  });

  app.post("/api/tasks/:taskId/subtasks", authenticate, (req: any, res) => {
    try {
      const { title } = req.body;
      const id = uuidv4();
      // Insert into tasks table with parentId for hierarchy
      db.prepare(`
        INSERT INTO tasks (id, userId, title, parentId, category, date) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id, req.user.id, title, req.params.taskId, 'personal', 
        new Date().toISOString().split('T')[0]
      );
      const newSubtask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      res.json(newSubtask);
    } catch (error) {
      console.error('Server: Failed to create subtask:', error);
      res.status(500).json({ error: "Failed to create subtask" });
    }
  });

  app.put("/api/subtasks/:id", authenticate, (req: any, res) => {
    const { title, completed } = req.body;
    db.prepare('UPDATE subtasks SET title = ?, completed = ? WHERE id = ? AND userId = ?').run(title, completed ? 1 : 0, req.params.id, req.user.id);
    res.json(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(req.params.id));
  });

  app.delete("/api/subtasks/:id", authenticate, (req: any, res) => {
    db.prepare('DELETE FROM subtasks WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Task Attachments
  app.get("/api/tasks/:taskId/attachments", (req, res) => {
    const attachments = db.prepare('SELECT * FROM task_attachments WHERE taskId = ?').all(req.params.taskId);
    res.json(attachments);
  });

  app.post("/api/tasks/:taskId/attachments", (req, res) => {
    const { name, url, type, size } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO task_attachments (id, taskId, name, url, type, size) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, req.params.taskId, name, url, type, size
    );
    res.json(db.prepare('SELECT * FROM task_attachments WHERE id = ?').get(id));
  });

  // Task Comments
  app.get("/api/tasks/:taskId/comments", (req, res) => {
    const comments = db.prepare(`
      SELECT c.*, u.name as userName, u.avatar as userAvatar 
      FROM comments c 
      JOIN users u ON c.userId = u.id 
      WHERE c.taskId = ? 
      ORDER BY c.createdAt ASC
    `).all(req.params.taskId);
    res.json(comments);
  });

  app.post("/api/tasks/:taskId/comments", authenticate, (req: any, res) => {
    const { content } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO comments (id, taskId, userId, content) VALUES (?, ?, ?, ?)').run(
      id, req.params.taskId, req.user.id, content
    );
    const comment = db.prepare(`
      SELECT c.*, u.name as userName, u.avatar as userAvatar 
      FROM comments c 
      JOIN users u ON c.userId = u.id 
      WHERE c.id = ?
    `).get(id);
    res.json(comment);
  });

  // Week Plans
  app.get("/api/week-plans", authenticate, (req: any, res) => {
    try {
      const plans = db.prepare('SELECT * FROM week_plans WHERE userId = ? ORDER BY startDate DESC').all(req.user.id);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch week plans" });
    }
  });

  app.post("/api/week-plans", authenticate, (req: any, res) => {
    try {
      const { startDate, endDate } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO week_plans (id, userId, startDate, endDate) VALUES (?, ?, ?, ?)').run(id, req.user.id, startDate, endDate);
      const newPlan = db.prepare('SELECT * FROM week_plans WHERE id = ?').get(id);
      res.json(newPlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to create week plan" });
    }
  });

  // Career Hub Settings
  app.get("/api/career/settings", authenticate, (req: any, res) => {
    try {
      let settings = db.prepare('SELECT * FROM career_hub_settings WHERE userId = ?').get(req.user.id);
      if (!settings) {
        const id = uuidv4();
        db.prepare('INSERT INTO career_hub_settings (id, userId) VALUES (?, ?)').run(id, req.user.id);
        settings = db.prepare('SELECT * FROM career_hub_settings WHERE id = ?').get(id);
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch career hub settings" });
    }
  });

  app.put("/api/career/settings", authenticate, (req: any, res) => {
    try {
      const { coverImage, coverReposition, icon } = req.body;
      db.prepare('UPDATE career_hub_settings SET coverImage = ?, coverReposition = ?, icon = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?').run(
        coverImage, coverReposition || 0, icon || '💼', req.user.id
      );
      const updated = db.prepare('SELECT * FROM career_hub_settings WHERE userId = ?').get(req.user.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update career hub settings" });
    }
  });

  // Resumes
  app.get("/api/career/resumes", authenticate, (req: any, res) => {
    try {
      const resumes = db.prepare('SELECT * FROM resumes WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resumes" });
    }
  });

  app.post("/api/career/resumes", authenticate, (req: any, res) => {
    try {
      const { name, url, type, tags, size } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO resumes (id, userId, name, url, type, tags, size) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        id, req.user.id, name, url, type, tags || '[]', size || 0
      );
      const newResume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id);
      res.json(newResume);
    } catch (error) {
      res.status(500).json({ error: "Failed to create resume" });
    }
  });

  app.put("/api/career/resumes/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, tags } = req.body;
      db.prepare('UPDATE resumes SET name = ?, tags = ? WHERE id = ? AND userId = ?').run(name, tags, id, req.user.id);
      const updated = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resume" });
    }
  });

  app.delete("/api/career/resumes/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM resumes WHERE id = ? AND userId = ?').run(id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resume" });
    }
  });

  // Opportunities
  app.get("/api/career/opportunities", authenticate, (req: any, res) => {
    try {
      const opportunities = db.prepare('SELECT * FROM opportunities WHERE userId = ? AND archived = 0 ORDER BY updatedAt DESC').all(req.user.id);
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.post("/api/career/opportunities", authenticate, (req: any, res) => {
    try {
      const { companyName, roleTitle, companyLogo, jobLink, location, salaryRange, appliedDate, interviewDate, stage, priority, notes } = req.body;
      const id = uuidv4();
      db.prepare(`
        INSERT INTO opportunities (
          id, userId, companyName, roleTitle, companyLogo, jobLink, location, salaryRange, 
          appliedDate, interviewDate, stage, priority, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, req.user.id, companyName, roleTitle, companyLogo, jobLink, location, salaryRange,
        appliedDate, interviewDate, stage || 'Wishlist', priority || 'Medium', notes || ''
      );
      const newOpp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
      res.json(newOpp);
    } catch (error) {
      res.status(500).json({ error: "Failed to create opportunity" });
    }
  });

  app.put("/api/career/opportunities/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      const { 
        companyName, roleTitle, companyLogo, jobLink, location, salaryRange, 
        appliedDate, interviewDate, stage, priority, notes, interviewPrep, 
        companyResearch, checklist, archived 
      } = req.body;
      
      db.prepare(`
        UPDATE opportunities SET 
          companyName = ?, roleTitle = ?, companyLogo = ?, jobLink = ?, 
          location = ?, salaryRange = ?, appliedDate = ?, interviewDate = ?, 
          stage = ?, priority = ?, notes = ?, interviewPrep = ?, 
          companyResearch = ?, checklist = ?, archived = ?, 
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(
        companyName, roleTitle, companyLogo, jobLink, location, salaryRange,
        appliedDate, interviewDate, stage, priority, notes, interviewPrep,
        companyResearch, checklist, archived ? 1 : 0, id, req.user.id
      );
      const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update opportunity" });
    }
  });

  app.delete("/api/career/opportunities/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      db.transaction(() => {
        db.prepare('DELETE FROM opportunity_attachments WHERE opportunityId = ?').run(id);
        db.prepare('DELETE FROM opportunities WHERE id = ? AND userId = ?').run(id, req.user.id);
      })();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete opportunity" });
    }
  });

  // Opportunity Attachments
  app.get("/api/career/opportunities/:id/attachments", authenticate, (req: any, res) => {
    try {
      const attachments = db.prepare('SELECT * FROM opportunity_attachments WHERE opportunityId = ?').all(req.params.id);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  app.post("/api/career/opportunities/:id/attachments", authenticate, (req: any, res) => {
    try {
      const { name, url, type, size } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO opportunity_attachments (id, opportunityId, name, url, type, size) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, req.params.id, name, url, type, size
      );
      const newAttachment = db.prepare('SELECT * FROM opportunity_attachments WHERE id = ?').get(id);
      res.json(newAttachment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create attachment" });
    }
  });

  app.delete("/api/career/attachments/:id", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM opportunity_attachments WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // Profile
  app.get("/api/profile", authenticate, (req: any, res) => {
    try {
      const profile = db.prepare('SELECT * FROM user_profile WHERE userId = ?').get(req.user.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticate, (req: any, res) => {
    try {
      const { name, avatar } = req.body;
      db.prepare('UPDATE user_profile SET name = ?, avatar = ? WHERE userId = ?').run(name, avatar, req.user.id);
      const updated = db.prepare('SELECT * FROM user_profile WHERE userId = ?').get(req.user.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Settings
  app.get("/api/settings", authenticate, (req: any, res) => {
    try {
      const settings = db.prepare('SELECT * FROM user_settings WHERE userId = ?').get(req.user.id);
      if (!settings) return res.json({});
      // Convert integers to booleans
      const formatted = {
        ...settings,
        sidebarCollapsed: !!settings.sidebarCollapsed,
        compactMode: !!settings.compactMode,
        animations: !!settings.animations,
        taskReminders: !!settings.taskReminders,
        dailyReminders: !!settings.dailyReminders,
        weeklyReminders: !!settings.weeklyReminders,
        soundNotifications: !!settings.soundNotifications,
        visualNotifications: !!settings.visualNotifications,
        autoSave: !!settings.autoSave,
        autoStart: !!settings.autoStart,
        offlineMode: !!settings.offlineMode,
        shortcutsEnabled: !!settings.shortcutsEnabled,
      };
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", authenticate, (req: any, res) => {
    try {
      const s = req.body;
      const query = `
        UPDATE user_settings SET 
          theme = ?, primaryColor = ?, accentColor = ?, sidebarColor = ?, 
          backgroundOpacity = ?, backgroundImage = ?, sidebarCollapsed = ?, 
          fontSize = ?, fontFamily = ?, compactMode = ?, animations = ?, 
          taskReminders = ?, dailyReminders = ?, weeklyReminders = ?, 
          soundNotifications = ?, visualNotifications = ?, autoSave = ?, 
          autoStart = ?, offlineMode = ?, shortcutsEnabled = ?, customShortcuts = ?
        WHERE userId = ?
      `;
      db.prepare(query).run(
        s.theme, s.primaryColor, s.accentColor, s.sidebarColor,
        s.backgroundOpacity, s.backgroundImage, s.sidebarCollapsed ? 1 : 0,
        s.fontSize, s.fontFamily, s.compactMode ? 1 : 0, s.animations ? 1 : 0,
        s.taskReminders ? 1 : 0, s.dailyReminders ? 1 : 0, s.weeklyReminders ? 1 : 0,
        s.soundNotifications ? 1 : 0, s.visualNotifications ? 1 : 0, s.autoSave ? 1 : 0,
        s.autoStart ? 1 : 0, s.offlineMode ? 1 : 0, s.shortcutsEnabled ? 1 : 0, s.customShortcuts, req.user.id
      );
      const updated = db.prepare('SELECT * FROM user_settings WHERE userId = ?').get(req.user.id);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Templates
  app.get("/api/templates", authenticate, (req: any, res) => {
    try {
      const templates = db.prepare('SELECT * FROM templates WHERE userId IS NULL OR userId = ?').all(req.user.id);
      const formatted = templates.map((t: any) => ({
        ...t,
        isFavorite: !!t.isFavorite,
        isFeatured: !!t.isFeatured
      }));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", authenticate, (req: any, res) => {
    try {
      const { id, title, description, category, content, icon } = req.body;
      db.prepare(`
        INSERT INTO templates (id, userId, title, description, category, content, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.user.id, title, description, category, content, icon);
      const newTemplate = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
      res.json({
        ...newTemplate,
        isFavorite: !!newTemplate.isFavorite,
        isFeatured: !!newTemplate.isFeatured
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id/favorite", authenticate, (req: any, res) => {
    try {
      const { isFavorite } = req.body;
      db.prepare('UPDATE templates SET isFavorite = ? WHERE id = ?').run(isFavorite ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update favorite status" });
    }
  });

  app.put("/api/templates/:id/last-used", authenticate, (req: any, res) => {
    try {
      db.prepare('UPDATE templates SET lastUsed = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update last used" });
    }
  });

  app.delete("/api/templates/:id", authenticate, (req: any, res) => {
    try {
      db.prepare('DELETE FROM templates WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Data Export/Import
  app.get("/api/data/export", authenticate, (req: any, res) => {
    try {
      const pages = db.prepare('SELECT * FROM pages WHERE userId = ?').all(req.user.id);
      const tasks = db.prepare('SELECT * FROM tasks WHERE userId = ?').all(req.user.id);
      const weekPlans = db.prepare('SELECT * FROM week_plans WHERE userId = ?').all(req.user.id);
      const profile = db.prepare('SELECT * FROM user_profile WHERE userId = ?').get(req.user.id);
      const settings = db.prepare('SELECT * FROM user_settings WHERE userId = ?').get(req.user.id);
      
      res.json({ pages, tasks, weekPlans, profile, settings });
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.post("/api/data/import", (req, res) => {
    try {
      const { pages, tasks, weekPlans, profile, settings } = req.body;
      
      db.transaction(() => {
        // Clear existing
        db.prepare('DELETE FROM pages').run();
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM week_plans').run();
        
        // Insert new
        pages.forEach((p: any) => {
          db.prepare('INSERT INTO pages (id, title, content, parentId, icon, updatedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            p.id, p.title, p.content, p.parentId, p.icon, p.updatedAt, p.createdAt
          );
        });
        
        tasks.forEach((t: any) => {
          db.prepare('INSERT INTO tasks (id, title, description, completed, date, startTime, endTime, category, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            t.id, t.title, t.description, t.completed, t.date, t.startTime, t.endTime, t.category, t.sortOrder, t.createdAt
          );
        });
        
        weekPlans.forEach((w: any) => {
          db.prepare('INSERT INTO week_plans (id, startDate, endDate, createdAt) VALUES (?, ?, ?, ?)').run(
            w.id, w.startDate, w.endDate, w.createdAt
          );
        });
        
        if (profile) {
          db.prepare('UPDATE user_profile SET name = ?, avatar = ? WHERE id = ?').run(profile.name, profile.avatar, 'default');
        }
        
        if (settings) {
          const s = settings;
          const query = `
            UPDATE user_settings SET 
              theme = ?, primaryColor = ?, accentColor = ?, sidebarColor = ?, 
              backgroundOpacity = ?, backgroundImage = ?, sidebarCollapsed = ?, 
              fontSize = ?, fontFamily = ?, compactMode = ?, animations = ?, 
              taskReminders = ?, dailyReminders = ?, weeklyReminders = ?, 
              soundNotifications = ?, visualNotifications = ?, autoSave = ?, 
              autoStart = ?, offlineMode = ?
            WHERE id = 'default'
          `;
          db.prepare(query).run(
            s.theme, s.primaryColor, s.accentColor, s.sidebarColor,
            s.backgroundOpacity, s.backgroundImage, s.sidebarCollapsed ? 1 : 0,
            s.fontSize, s.fontFamily, s.compactMode ? 1 : 0, s.animations ? 1 : 0,
            s.taskReminders ? 1 : 0, s.dailyReminders ? 1 : 0, s.weeklyReminders ? 1 : 0,
            s.soundNotifications ? 1 : 0, s.visualNotifications ? 1 : 0, s.autoSave ? 1 : 0,
            s.autoStart ? 1 : 0, s.offlineMode ? 1 : 0
          );
        }
      })();
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to import data" });
    }
  });

  app.post("/api/data/clear", (req, res) => {
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM pages').run();
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM week_plans').run();
        // Reset settings to default
        db.prepare('DELETE FROM user_settings').run();
        db.prepare('INSERT INTO user_settings (id) VALUES (?)').run('default');
        db.prepare('UPDATE user_profile SET name = "User", avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" WHERE id = "default"').run();
      })();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear data" });
    }
  });

  // Authentication
  // (Already defined above)

  // Workspaces
  app.get('/api/workspaces', authenticate, (req: any, res) => {
    const workspaces = db.prepare(`
      SELECT w.*, wm.role FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspaceId
      WHERE wm.userId = ?
    `).all(req.user.id);
    res.json(workspaces);
  });

  app.post('/api/workspaces', authenticate, (req: any, res) => {
    const { name, description, visibility } = req.body;
    const id = uuidv4();
    db.transaction(() => {
      db.prepare('INSERT INTO workspaces (id, name, description, visibility, ownerId) VALUES (?, ?, ?, ?, ?)').run(
        id, name, description, visibility, req.user.id
      );
      db.prepare('INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, ?)').run(
        id, req.user.id, 'owner'
      );
      db.prepare('INSERT INTO activity_log (id, workspaceId, userId, actionType) VALUES (?, ?, ?, ?)').run(
        uuidv4(), id, req.user.id, 'workspace_created'
      );
    })();
    res.json({ id, name, description, visibility });
  });

  app.post('/api/workspaces/:id/invite', authenticate, (req: any, res) => {
    const { email, role } = req.body;
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    try {
      db.prepare('INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, ?)').run(
        req.params.id, user.id, role
      );
      db.prepare('INSERT INTO activity_log (id, workspaceId, userId, actionType, targetId, targetType) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuidv4(), req.params.id, req.user.id, 'user_invited', user.id, 'user'
      );
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'User already in workspace' });
    }
  });

  app.get('/api/workspaces/:id/members', authenticate, (req: any, res) => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar, wm.role FROM users u
      JOIN workspace_members wm ON u.id = wm.userId
      WHERE wm.workspaceId = ?
    `).all(req.params.id);
    res.json(members);
  });

  // Comments
  app.get('/api/pages/:id/comments', authenticate, (req: any, res) => {
    const comments = db.prepare(`
      SELECT c.*, u.name as userName, u.avatar as userAvatar FROM comments c
      JOIN users u ON c.userId = u.id
      WHERE c.pageId = ?
      ORDER BY c.createdAt ASC
    `).all(req.params.id);
    res.json(comments);
  });

  app.post('/api/pages/:id/comments', authenticate, (req: any, res) => {
    const { content, inlineData, parentId } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO comments (id, pageId, userId, content, inlineData, parentId) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, req.params.id, req.user.id, content, inlineData, parentId
    );
    const newComment = db.prepare(`
      SELECT c.*, u.name as userName, u.avatar as userAvatar FROM comments c
      JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `).get(id);
    res.json(newComment);
  });

  // Activity Log
  app.get('/api/workspaces/:id/activity', authenticate, (req: any, res) => {
    const logs = db.prepare(`
      SELECT l.*, u.name as userName, u.avatar as userAvatar FROM activity_log l
      JOIN users u ON l.userId = u.id
      WHERE l.workspaceId = ?
      ORDER BY l.timestamp DESC
      LIMIT 50
    `).all(req.params.id);
    res.json(logs);
  });

  // Notifications
  app.get('/api/notifications', authenticate, (req: any, res) => {
    const notifications = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20').all(req.user.id);
    res.json(notifications);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  // Task Activity Log
  app.get("/api/tasks/:taskId/activity", (req, res) => {
    const activity = db.prepare(`
      SELECT a.*, u.name as userName, u.avatar as userAvatar 
      FROM activity_log a 
      JOIN users u ON a.userId = u.id 
      WHERE a.targetId = ? AND a.targetType = 'task'
      ORDER BY a.timestamp DESC
    `).all(req.params.taskId);
    res.json(activity);
  });

  // Task Notifications
  app.post("/api/tasks/:taskId/notify", authenticate, (req: any, res) => {
    const { userId, content, type } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO notifications (id, userId, content, type) VALUES (?, ?, ?, ?)').run(
      id, userId, content, type
    );
    res.json({ success: true });
  });

  // Update app.listen to server.listen
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
