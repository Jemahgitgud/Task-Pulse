import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import http from 'http';
import webpush from 'web-push';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'taskpulse-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate or load persistent VAPID keys for Web Push
let vapidKeys = {
  publicKey: '',
  privateKey: '',
};

const VAPID_PATH = path.join(DATA_DIR, 'vapid.json');
if (fs.existsSync(VAPID_PATH)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_PATH, 'utf8'));
  } catch {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_PATH, JSON.stringify(vapidKeys, null, 2));
  }
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_PATH, JSON.stringify(vapidKeys, null, 2));
}

try {
  webpush.setVapidDetails(
    'mailto:support@taskpulse.app',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (e) {
  console.warn('WebPush initialization warning:', e);
}

// Persistent Database Schema
interface ServerDatabase {
  tasks: any[];
  subscriptions: webpush.PushSubscription[];
  sentAlerts: Record<string, number>;
  appTitle: string;
}

function loadDatabase(): ServerDatabase {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (Array.isArray(data.tasks)) {
        return {
          tasks: data.tasks,
          subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
          sentAlerts: data.sentAlerts || {},
          appTitle: data.appTitle || "Jemah's TaskPulse",
        };
      }
    } catch (e) {
      console.error('Error loading database:', e);
    }
  }

  // Initial Seed
  const initialData: ServerDatabase = {
    tasks: [],
    subscriptions: [],
    sentAlerts: {},
    appTitle: "Jemah's TaskPulse",
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(db: ServerDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing database:', e);
  }
}

let db = loadDatabase();

// SSE Connected Clients for Real-Time 2-Device Sync
const sseClients = new Set<express.Response>();

function broadcastSSE(event: string, payload: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

const app = express();
app.use(express.json());

// API: Sync & Tasks
app.get('/api/tasks', (req, res) => {
  res.json({
    tasks: db.tasks,
    appTitle: db.appTitle,
    connectedDevices: sseClients.size,
  });
});

app.post('/api/tasks', (req, res) => {
  const newTask = req.body;
  if (!newTask || !newTask.id) {
    return res.status(400).json({ error: 'Task must have an id' });
  }

  // Prepend or update
  const idx = db.tasks.findIndex((t) => t.id === newTask.id);
  if (idx >= 0) {
    db.tasks[idx] = newTask;
  } else {
    db.tasks.unshift(newTask);
  }

  saveDatabase(db);
  broadcastSSE('task_change', { action: 'create', task: newTask, tasks: db.tasks });
  res.json({ success: true, task: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = db.tasks.findIndex((t) => t.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  db.tasks[idx] = { ...db.tasks[idx], ...updates };
  saveDatabase(db);
  broadcastSSE('task_change', { action: 'update', task: db.tasks[idx], tasks: db.tasks });
  res.json({ success: true, task: db.tasks[idx] });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const prevCount = db.tasks.length;
  db.tasks = db.tasks.filter((t) => t.id !== id);

  if (db.tasks.length !== prevCount) {
    saveDatabase(db);
    broadcastSSE('task_change', { action: 'delete', taskId: id, tasks: db.tasks });
  }

  res.json({ success: true });
});

app.post('/api/tasks/bulk', (req, res) => {
  const { tasks, appTitle } = req.body;
  if (Array.isArray(tasks)) {
    db.tasks = tasks;
    if (appTitle) db.appTitle = appTitle;
    saveDatabase(db);
    broadcastSSE('task_change', { action: 'bulk', tasks: db.tasks });
  }
  res.json({ success: true, count: db.tasks.length });
});

// Real-Time Server-Sent Events (SSE) Stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ connectedDevices: sseClients.size + 1 })}\n\n`);

  sseClients.add(res);
  broadcastSSE('device_count', { connectedDevices: sseClients.size });

  req.on('close', () => {
    sseClients.delete(res);
    broadcastSSE('device_count', { connectedDevices: sseClients.size });
  });
});

// Server-Side Gemini AI Endpoints
app.post('/api/gemini/briefing', async (req, res) => {
  const ai = getGenAI();
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    const { today, overdue = [], dueToday = [], completedToday = 0, urgent = [] } = req.body || {};
    const prompt = `You are the executive productivity AI for "Jemah's TaskPulse", a mobile worklist and deadline tracker.
Current state:
- Date: ${today}
- Overdue tasks (${overdue.length}): ${overdue.map((t: any) => `"${t.title}" (${t.project})`).join(', ') || 'None'}
- Due Today (${dueToday.length}): ${dueToday.map((t: any) => `"${t.title}" [${t.priority}] (${t.project})`).join(', ') || 'None'}
- Completed Today: ${completedToday}
- Urgent active items: ${urgent.map((t: any) => t.title).join(', ') || 'None'}

Return a concise JSON object with exactly these keys:
- headline: A punchy 5-8 word status headline with 1 relevant emoji
- narrative: A crisp 2-sentence executive summary evaluating today's momentum and workload risk
- recommendedFocus: Specific action advice on which task or project block to tackle first`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            narrative: { type: Type.STRING },
            recommendedFocus: { type: Type.STRING },
          },
          required: ['headline', 'narrative', 'recommendedFocus'],
        },
      },
    });

    if (!response.text) {
      return res.status(502).json({ error: 'Empty response from Gemini model.' });
    }

    const parsed = JSON.parse(response.text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini briefing error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate AI briefing.' });
  }
});

app.post('/api/gemini/decompose', async (req, res) => {
  const ai = getGenAI();
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    const { taskTitle, project = 'General' } = req.body || {};
    if (!taskTitle) {
      return res.status(400).json({ error: 'taskTitle is required.' });
    }

    const prompt = `Decompose this task title into 3 to 4 actionable, specific micro-steps for a professional project worklist:
Task: "${taskTitle}"
Project: "${project}"

Return JSON array of strings: ["Step 1", "Step 2", "Step 3"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    if (!response.text) {
      return res.status(502).json({ error: 'Empty response from Gemini model.' });
    }

    const steps = JSON.parse(response.text);
    return res.json({ steps });
  } catch (err: any) {
    console.error('Gemini decompose error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to decompose task.' });
  }
});

// Web Push Notifications API
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', (req, res) => {
  const subscription: webpush.PushSubscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  // Prevent duplicate subscriptions
  const exists = db.subscriptions.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) {
    db.subscriptions.push(subscription);
    saveDatabase(db);
  }

  res.json({ success: true, subscribed: true });
});

app.post('/api/notifications/test', async (req, res) => {
  const payload = JSON.stringify({
    title: "TaskPulse: Background Notification Active! 🔔",
    body: "Your device is connected and will receive reminders even when closed.",
    icon: "/favicon.ico",
  });

  const deadEndpoints: string[] = [];
  const results = await Promise.allSettled(
    db.subscriptions.map((sub) =>
      webpush.sendNotification(sub, payload).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          deadEndpoints.push(sub.endpoint);
        }
      })
    )
  );

  if (deadEndpoints.length > 0) {
    db.subscriptions = db.subscriptions.filter(
      (sub) => !deadEndpoints.includes(sub.endpoint)
    );
    saveDatabase(db);
  }

  res.json({ success: true, subscribersNotified: db.subscriptions.length });
});

// Background Deadline Notification Dispatcher
// Runs continuously on the server, detecting tasks due within 30 min, 2 hours, or overdue
setInterval(async () => {
  if (db.subscriptions.length === 0) return;

  const now = new Date();
  const nowMs = now.getTime();
  const todayKey = now.toISOString().slice(0, 10);

  const activeTasks = db.tasks.filter((t) => t.status !== 'completed' && t.reminderEnabled);

  for (const task of activeTasks) {
    if (!task.dueDate) continue;

    const dueMs = new Date(`${task.dueDate}T${task.dueTime || '23:59:00'}`).getTime();
    const diffMinutes = Math.round((dueMs - nowMs) / (1000 * 60));

    // Alert 1: Due in 30 minutes
    if (diffMinutes > 0 && diffMinutes <= 30) {
      const alertId = `push_30m_${task.id}_${task.dueDate}`;
      if (!db.sentAlerts[alertId]) {
        db.sentAlerts[alertId] = nowMs;
        saveDatabase(db);

        const payload = JSON.stringify({
          title: `⚠️ Due in ${diffMinutes}m: ${task.title}`,
          body: `Priority: ${task.priority.toUpperCase()} · Project: ${task.project}`,
          tag: `task-${task.id}`,
        });

        db.subscriptions.forEach((sub) => {
          webpush.sendNotification(sub, payload).catch(() => {});
        });
      }
    }

    // Alert 2: Due today in ~2 hours
    if (diffMinutes > 30 && diffMinutes <= 120) {
      const alertId = `push_2h_${task.id}_${task.dueDate}`;
      if (!db.sentAlerts[alertId]) {
        db.sentAlerts[alertId] = nowMs;
        saveDatabase(db);

        const hours = Math.round(diffMinutes / 60);
        const payload = JSON.stringify({
          title: `⏰ Due in ~${hours}h: ${task.title}`,
          body: `Due today at ${task.dueTime || 'end of day'} (${task.project})`,
          tag: `task-${task.id}`,
        });

        db.subscriptions.forEach((sub) => {
          webpush.sendNotification(sub, payload).catch(() => {});
        });
      }
    }
  }
}, 30000); // Check every 30 seconds

// Vite dev middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // WebRTC Peer-to-Peer Signaling Server
  // Relays SDP offers/answers and ICE candidates between browser peers
  const wss = new WebSocketServer({ server, path: '/webrtc-signal' });

  interface PeerInfo {
    ws: WebSocket;
    peerId: string;
    roomId: string;
  }

  const peerMap = new Map<WebSocket, PeerInfo>();
  const roomMap = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    ws.on('message', (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        const { type, roomId, peerId, targetPeerId, data } = msg;

        if (type === 'join') {
          const room = roomId || 'taskpulse-main-room';
          peerMap.set(ws, { ws, peerId, roomId: room });
          if (!roomMap.has(room)) {
            roomMap.set(room, new Set());
          }
          const roomPeers = roomMap.get(room)!;

          // Notify existing peers that a new peer joined
          roomPeers.forEach((otherWs) => {
            if (otherWs !== ws && otherWs.readyState === WebSocket.OPEN) {
              const otherPeer = peerMap.get(otherWs);
              otherWs.send(JSON.stringify({
                type: 'peer_joined',
                peerId,
                isInitiator: false,
              }));
              ws.send(JSON.stringify({
                type: 'peer_joined',
                peerId: otherPeer?.peerId,
                isInitiator: true,
              }));
            }
          });

          roomPeers.add(ws);
          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId: room,
            peerId,
            totalPeers: roomPeers.size,
          }));
        } else if (type === 'signal') {
          const peer = peerMap.get(ws);
          if (peer) {
            const roomPeers = roomMap.get(peer.roomId);
            if (roomPeers) {
              roomPeers.forEach((otherWs) => {
                if (otherWs !== ws && otherWs.readyState === WebSocket.OPEN) {
                  const otherInfo = peerMap.get(otherWs);
                  if (!targetPeerId || otherInfo?.peerId === targetPeerId) {
                    otherWs.send(JSON.stringify({
                      type: 'signal',
                      fromPeerId: peer.peerId,
                      data,
                    }));
                  }
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn('WebRTC signal message error:', e);
      }
    });

    ws.on('close', () => {
      const peer = peerMap.get(ws);
      if (peer) {
        const roomPeers = roomMap.get(peer.roomId);
        if (roomPeers) {
          roomPeers.delete(ws);
          roomPeers.forEach((otherWs) => {
            if (otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({
                type: 'peer_left',
                peerId: peer.peerId,
              }));
            }
          });
          if (roomPeers.size === 0) {
            roomMap.delete(peer.roomId);
          }
        }
        peerMap.delete(ws);
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskPulse full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
