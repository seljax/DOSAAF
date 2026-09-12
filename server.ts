import express from 'express';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const HOST = '0.0.0.0';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'dosaaf_data.sqlite');
const db = new DatabaseSync(dbPath);

// Create table for key-value application data
db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

async function startServer() {
  const app = express();

  // Middleware for JSON body parsing
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), database: 'sqlite' });
  });

  // GET /api/data - Retrieve all stored data key-value pairs
  app.get('/api/data', (req, res) => {
    try {
      const stmt = db.prepare('SELECT key, value, updated_at FROM app_data');
      const rows = stmt.all() as { key: string; value: string; updated_at: number }[];
      
      const data: Record<string, any> = {};
      for (const row of rows) {
        try {
          data[row.key] = JSON.parse(row.value);
        } catch {
          data[row.key] = row.value;
        }
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching data from SQLite:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/data - Save a key-value pair or multiple key-values into SQLite
  app.post('/api/data', (req, res) => {
    try {
      const { key, value, data } = req.body;
      const now = Date.now();
      const upsert = db.prepare(`
        INSERT INTO app_data (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `);

      if (key !== undefined) {
        const valStr = typeof value === 'string' ? value : JSON.stringify(value);
        upsert.run(String(key), valStr, now);
        res.json({ success: true, key });
        return;
      }

      if (data && typeof data === 'object') {
        let count = 0;
        for (const [k, v] of Object.entries(data)) {
          const valStr = typeof v === 'string' ? v : JSON.stringify(v);
          upsert.run(String(k), valStr, now);
          count++;
        }
        res.json({ success: true, count });
        return;
      }

      res.status(400).json({ success: false, error: 'Missing key and value in request body' });
    } catch (err: any) {
      console.error('Error saving data to SQLite:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[ДОСААФ Server] Running on http://${HOST}:${PORT} with SQLite database`);
  });
}

startServer();
