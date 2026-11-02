import { getPool } from '@/lib/db';
import {
  createSession,
  databaseFailureResponse,
  hashPassword,
  jsonResponse,
  optionsResponse,
  readCredentials,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function POST(request) {
  let credentials;
  try {
    credentials = await readCredentials(request);
  } catch (error) {
    return jsonResponse(request, { error: error.message }, 400);
  }

  if (credentials.password.length < 8) {
    return jsonResponse(
      request,
      { error: 'Password minimal 8 karakter.' },
      400
    );
  }

  try {
    const pool = getPool();
    const passwordHash = await hashPassword(credentials.password);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [credentials.email, passwordHash]
    );
    const token = await createSession(result.insertId);

    return jsonResponse(
      request,
      {
        data: {
          token,
          user: { id: result.insertId, email: credentials.email },
        },
      },
      201
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return jsonResponse(
        request,
        { error: 'Email sudah terdaftar. Silakan masuk.' },
        409
      );
    }

    return databaseFailureResponse(request, error, 'Registration');
  }
}
