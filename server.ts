import express from 'express';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'dosaaf_data.sqlite');
const db = new DatabaseSync(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reset_codes (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
`);

// ==================== MONITORING: АКТИВНЫЕ СЕССИИ ====================

interface LiveSession {
  userId: string;
  userName: string;
  userGroup: string;
  userGroupName: string;
  examId: string;
  examTitle: string;
  isExamMode: boolean;
  ticketNumber?: number | 'random';
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  errors: Array<{ index: number; questionText: string; chosen: string; correct: string }>;
  answers: Record<number, number>;
  elapsedSeconds: number;
  timeLimitSeconds: number;
  tabViolations: number;
  startTime: number;
  lastUpdate: number;
}

const activeSessions = new Map<string, LiveSession>();

// Очистка «мёртвых» сессий: если не обновлялись > 60 сек — удаляем
function cleanupDeadSessions() {
  const now = Date.now();
  for (const [id, session] of activeSessions) {
    if (now - session.lastUpdate > 60000) {
      activeSessions.delete(id);
    }
  }
}
setInterval(cleanupDeadSessions, 15000);

// ==================== SMTP ====================

const smtpHost = process.env.SMTP_HOST || 'smtp.mail.ru';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpSecure = (process.env.SMTP_SECURE || 'true') === 'true';

const mailer = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

async function sendResetCode(email: string, code: string): Promise<void> {
  if (!smtpUser || !smtpPass) {
    console.warn('[SMTP] SMTP_USER или SMTP_PASS не заданы. Письмо не отправлено.');
    return;
  }

  await mailer.sendMail({
    from: `"ДОСААФ Автошкола" <${smtpUser}>`,
    to: email,
    subject: 'Код восстановления пароля администратора ДОСААФ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px;">
        <h2 style="color: #0f172a; margin: 0 0 12px;">Восстановление пароля администратора</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Вы запросили восстановление пароля администратора портала ДОСААФ.
          Введите этот код на странице восстановления:
        </p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #fff; border: 2px dashed #f59e0b; border-radius: 12px; color: #0f172a; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
          Код действителен в течение <strong>15 минут</strong>. Если вы не запрашивали восстановление, просто проигнорируйте это письмо.
        </p>
      </div>
    `,
  });
}

// ==================== SERVER ====================

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // ==================== HEALTH ====================

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), database: 'sqlite' });
  });

  // ==================== APP DATA (ключ-значение) ====================

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

  // ==================== ХЕШИРОВАНИЕ ПАРОЛЯ ====================

  app.post('/api/auth/hash', async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || typeof password !== 'string' || password.length < 4) {
        return res.status(400).json({ success: false, error: 'Пароль минимум 4 символа' });
      }
      const hash = await bcrypt.hash(password, 10);
      res.json({ success: true, hash });
    } catch (err: any) {
      console.error('Hash error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { password, hash } = req.body;
      if (!password || !hash) {
        return res.status(400).json({ success: false, error: 'password и hash обязательны' });
      }
      const ok = await bcrypt.compare(password, hash);
      res.json({ success: true, valid: ok });
    } catch (err: any) {
      console.error('Verify error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== ВОССТАНОВЛЕНИЕ ПАРОЛЯ АДМИНА ====================

  app.post('/api/auth/request-reset', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Некорректный email' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const now = Date.now();

      const upsert = db.prepare(`
        INSERT INTO reset_codes (email, code_hash, expires_at, attempts, created_at)
        VALUES (?, ?, ?, 0, ?)
        ON CONFLICT(email) DO UPDATE SET
          code_hash = excluded.code_hash,
          expires_at = excluded.expires_at,
          attempts = 0,
          created_at = excluded.created_at
      `);
      upsert.run(cleanEmail, codeHash, expiresAt, now);

      try {
        await sendResetCode(cleanEmail, code);
      } catch (mailErr: any) {
        console.error('Mail send error:', mailErr);
      }

      const [userPart, domainPart] = cleanEmail.split('@');
      const maskedUser =
        userPart.length > 2
          ? `${userPart[0]}***${userPart[userPart.length - 1]}`
          : `${userPart[0]}***`;
      const maskedEmail = `${maskedUser}@${domainPart}`;

      res.json({ success: true, maskedEmail });
    } catch (err: any) {
      console.error('Request reset error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/verify-reset', async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: 'email и code обязательны' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = String(code).trim();

      const row = db
        .prepare('SELECT code_hash, expires_at, attempts FROM reset_codes WHERE email = ?')
        .get(cleanEmail) as { code_hash: string; expires_at: number; attempts: number } | undefined;

      if (!row) {
        return res.status(400).json({ success: false, error: 'Код не найден. Запросите новый.' });
      }

      if (Date.now() > row.expires_at) {
        db.prepare('DELETE FROM reset_codes WHERE email = ?').run(cleanEmail);
        return res.status(400).json({ success: false, error: 'Код истёк. Запросите новый.' });
      }

      if (row.attempts >= 5) {
        db.prepare('DELETE FROM reset_codes WHERE email = ?').run(cleanEmail);
        return res.status(400).json({ success: false, error: 'Слишком много попыток. Запросите новый код.' });
      }

      const ok = await bcrypt.compare(cleanCode, row.code_hash);
      if (!ok) {
        db.prepare('UPDATE reset_codes SET attempts = attempts + 1 WHERE email = ?').run(cleanEmail);
        return res.status(400).json({ success: false, error: 'Неверный код' });
      }

      res.json({ success: true, valid: true });
    } catch (err: any) {
      console.error('Verify reset error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/consume-reset', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, error: 'email обязателен' });
      db.prepare('DELETE FROM reset_codes WHERE email = ?').run(email.trim().toLowerCase());
      res.json({ success: true });
    } catch (err: any) {
      console.error('Consume reset error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ ====================

  // POST /api/monitoring/update — курсант отправляет состояние (каждые 3 сек)
  app.post('/api/monitoring/update', (req, res) => {
    try {
      const body = req.body;
      if (!body || !body.userId) {
        return res.status(400).json({ success: false, error: 'userId обязателен' });
      }

      const session: LiveSession = {
        userId: String(body.userId),
        userName: String(body.userName || 'Курсант'),
        userGroup: String(body.userGroup || ''),
        userGroupName: String(body.userGroupName || ''),
        examId: String(body.examId || ''),
        examTitle: String(body.examTitle || 'Тест'),
        isExamMode: Boolean(body.isExamMode),
        ticketNumber: body.ticketNumber,
        currentIndex: Number(body.currentIndex || 0),
        totalQuestions: Number(body.totalQuestions || 0),
        answeredCount: Number(body.answeredCount || 0),
        correctCount: Number(body.correctCount || 0),
        wrongCount: Number(body.wrongCount || 0),
        errors: Array.isArray(body.errors) ? body.errors : [],
        answers: body.answers && typeof body.answers === 'object' ? body.answers : {},
        elapsedSeconds: Number(body.elapsedSeconds || 0),
        timeLimitSeconds: Number(body.timeLimitSeconds || 0),
        tabViolations: Number(body.tabViolations || 0),
        startTime: Number(body.startTime || Date.now()),
        lastUpdate: Date.now(),
      };

      activeSessions.set(session.userId, session);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Monitoring update error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/monitoring/active — админ получает список активных сессий
  app.get('/api/monitoring/active', (req, res) => {
    try {
      cleanupDeadSessions();
      const sessions = Array.from(activeSessions.values()).sort(
        (a, b) => b.lastUpdate - a.lastUpdate
      );
      res.json({ success: true, sessions, count: sessions.length });
    } catch (err: any) {
      console.error('Monitoring active error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/monitoring/stop — курсант завершил тест, удаляем сессию
  app.post('/api/monitoring/stop', (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, error: 'userId обязателен' });
      activeSessions.delete(String(userId));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Monitoring stop error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/monitoring/session/:userId — детали одной сессии (для клика по курсанту)
  app.get('/api/monitoring/session/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const session = activeSessions.get(String(userId));
      if (!session) {
        return res.status(404).json({ success: false, error: 'Сессия не найдена' });
      }
      res.json({ success: true, session });
    } catch (err: any) {
      console.error('Monitoring session error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== VITE / STATIC ====================

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
    console.log(`[SMTP] ${smtpUser ? 'Настроен: ' + smtpUser : 'НЕ настроен (письма не отправляются)'}`);
    console.log(`[Monitoring] API активных сессий готов: /api/monitoring/*`);
  });
}

startServer();