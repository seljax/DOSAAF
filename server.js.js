import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Подключение к SQLite
const db = new Database(path.join(__dirname, 'data.db'));

// Создание таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS site_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cadet',
    full_name TEXT,
    group_name TEXT,
    transmission TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS access_matrix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section TEXT NOT NULL,
    allowed INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, section),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ==================== API: ДАННЫЕ САЙТА ====================

app.get('/api/data', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM site_data').all() as { key: string; value: string }[];
    const data: Record<string, any> = {};
    for (const row of rows) {
      try {
        data[row.key] = JSON.parse(row.value);
      } catch {
        data[row.key] = row.value;
      }
    }
    res.json(data);
  } catch (err) {
    console.error('Ошибка чтения данных:', err);
    res.status(500).json({ error: 'Ошибка чтения данных' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key и value обязательны' });
    }
    const stmt = db.prepare(`
      INSERT INTO site_data (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, JSON.stringify(value));
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// ==================== API: ПОЛЬЗОВАТЕЛИ ====================

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, full_name, group_name, transmission, created_at FROM users').all();
    res.json(users);
  } catch (err) {
    console.error('Ошибка чтения пользователей:', err);
    res.status(500).json({ error: 'Ошибка чтения пользователей' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, password, role, full_name, group_name, transmission } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username и password обязательны' });
    }
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, full_name, group_name, transmission)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(username, password, role || 'cadet', full_name || '', group_name || '', transmission || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) {
    console.error('Ошибка создания пользователя:', err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    }
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

app.post('/api/users/:id/password', (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword обязателен' });
    }

    const user = db.prepare('SELECT password, username FROM users WHERE id = ?').get(id) as { password: string; username: string } | undefined;
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    if (oldPassword && user.password !== oldPassword) {
      return res.status(400).json({ error: 'Неверный старый пароль' });
    }

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, id);

    db.prepare('INSERT INTO logs (user_id, username, action, details) VALUES (?, ?, ?, ?)').run(
      Number(id),
      user.username,
      'Смена пароля',
      `${user.username} изменил пароль от своей учетной записи`
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка смены пароля:', err);
    res.status(500).json({ error: 'Ошибка смены пароля' });
  }
});

// ==================== API: ЛОГИ ====================

app.get('/api/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT id, user_id, username, action, details, created_at
      FROM logs
      ORDER BY created_at DESC
      LIMIT 500
    `).all();
    res.json(logs);
  } catch (err) {
    console.error('Ошибка чтения логов:', err);
    res.status(500).json({ error: 'Ошибка чтения логов' });
  }
});

app.post('/api/logs', (req, res) => {
  try {
    const { user_id, username, action, details } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'action обязателен' });
    }
    const stmt = db.prepare('INSERT INTO logs (user_id, username, action, details) VALUES (?, ?, ?, ?)');
    const result = stmt.run(user_id || null, username || 'system', action, details || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Ошибка добавления лога:', err);
    res.status(500).json({ error: 'Ошибка добавления лога' });
  }
});

// ==================== API: МАТРИЦА ДОСТУПА ====================

app.get('/api/users/:id/access', (req, res) => {
  try {
    const { id } = req.params;
    const access = db.prepare('SELECT section, allowed FROM access_matrix WHERE user_id = ?').all(id);
    res.json(access);
  } catch (err) {
    console.error('Ошибка чтения доступа:', err);
    res.status(500).json({ error: 'Ошибка чтения доступа' });
  }
});

app.post('/api/users/:id/access', (req, res) => {
  try {
    const { id } = req.params;
    const { section, allowed } = req.body;
    if (!section) {
      return res.status(400).json({ error: 'section обязателен' });
    }
    const stmt = db.prepare(`
      INSERT INTO access_matrix (user_id, section, allowed)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, section) DO UPDATE SET allowed = excluded.allowed
    `);
    stmt.run(id, section, allowed ? 1 : 0);
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка обновления доступа:', err);
    res.status(500).json({ error: 'Ошибка обновления доступа' });
  }
});

// ==================== ЗАПУСК ====================

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`📁 База данных: data.db`);
  console.log(`📊 API: /api/data, /api/users, /api/logs`);
});