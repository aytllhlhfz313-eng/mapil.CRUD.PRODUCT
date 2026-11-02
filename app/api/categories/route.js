import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getApiErrorMessage } from '@/lib/api-error';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, description, created_at FROM categories ORDER BY id ASC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getApiErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: 'Field "name" wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [String(name).trim(), description || null]
    );

    return NextResponse.json(
      { id: result.insertId, name: String(name).trim(), description: description || null },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getApiErrorMessage(error) }, { status: 500 });
  }
}
