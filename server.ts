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

  // POST /api/auth/hash — захешировать пароль (используется при регистрации/смене)
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

  // POST /api/auth/verify — проверить пароль против хеша
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

  // POST /api/auth/request-reset — запросить код на email
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

      // Отправляем письмо
      try {
        await sendResetCode(cleanEmail, code);
      } catch (mailErr: any) {
        console.error('Mail send error:', mailErr);
        // Даже если письмо не ушло — возвращаем успех, чтобы не раскрывать наличие email
      }

      // Маскируем email для отображения
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

  // POST /api/auth/verify-reset — проверить код
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

  // POST /api/auth/consume-reset — погасить код после успешного сброса
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
  });
}

startServer();