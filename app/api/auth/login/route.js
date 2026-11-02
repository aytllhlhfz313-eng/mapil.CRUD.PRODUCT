import { getPool } from '@/lib/db';
import {
  createSession,
  databaseFailureResponse,
  jsonResponse,
  optionsResponse,
  readCredentials,
  verifyPassword,
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

  try {
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [credentials.email]
    );
    const user = users[0];

    if (!user || !(await verifyPassword(credentials.password, user.password_hash))) {
      return jsonResponse(
        request,
        { error: 'Email atau password salah.' },
        401
      );
    }

    const token = await createSession(user.id);
    return jsonResponse(request, {
      data: {
        token,
        user: { id: user.id, email: user.email },
      },
    });
  } catch (error) {
    return databaseFailureResponse(request, error, 'Login');
  }
}
