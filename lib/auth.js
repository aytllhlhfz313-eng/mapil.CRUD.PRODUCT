import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { getPool } from '@/lib/db';

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;

export async function readCredentials(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new Error('Request harus berisi JSON yang valid.');
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Email dan password wajib diisi.');
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0 ||
    password.length > 128
  ) {
    throw new Error('Email atau password tidak valid.');
  }

  return { email, password };
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = Buffer.from(
    await scrypt(password, salt, passwordKeyLength)
  );
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, storedKey, ...extraParts] = String(storedHash).split(':');
  if (
    extraParts.length > 0 ||
    !/^[a-f0-9]{32}$/.test(salt ?? '') ||
    !/^[a-f0-9]{128}$/.test(storedKey ?? '')
  ) {
    return false;
  }

  const derivedKey = Buffer.from(
    await scrypt(password, salt, passwordKeyLength)
  );
  return timingSafeEqual(derivedKey, Buffer.from(storedKey, 'hex'));
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  const pool = getPool();

  await pool.execute(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );

  return token;
}

export function corsHeaders(request) {
  const origin = request.headers.get('origin');
  if (!origin) return {};

  const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const isLocalDevelopmentOrigin =
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);

  if (!configuredOrigins.includes(origin) && !isLocalDevelopmentOrigin) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function jsonResponse(request, body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders(request),
  });
}

export function optionsResponse(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export function databaseFailureResponse(request, error, operation) {
  console.error(`${operation} failed:`, error);

  const code = String(error?.code ?? '');
  let message = 'Database belum siap. Periksa konfigurasi backend.';

  if (code === 'ER_NO_SUCH_TABLE') {
    message = 'Tabel akun belum tersedia. Jalankan schema.sql pada database.';
  } else if (code === 'HANDSHAKE_SSL_ERROR' || code.startsWith('ERR_SSL_')) {
    message =
      'Verifikasi TLS database gagal. Pasang CA certificate Aiven yang benar pada DB_CA_CERT.';
  } else if (
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENETUNREACH' ||
    code === 'EHOSTUNREACH'
  ) {
    message =
      'Database tidak dapat dijangkau. Periksa DB_HOST, DB_PORT, dan koneksi jaringan.';
  } else if (code === 'ER_ACCESS_DENIED_ERROR') {
    message =
      'Database menolak kredensial. Periksa DB_USER dan DB_PASSWORD di backend.';
  }

  return jsonResponse(request, { error: message }, 503);
}
