import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getApiErrorMessage } from '@/lib/api-error';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.category_id, c.name AS category_name, p.created_at
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
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
    const { name, description, price, category_id } = body;

    if (!name || !String(name).trim() || price === undefined || price === '') {
      return NextResponse.json(
        { error: 'Field "name" dan "price" wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const normalizedCategoryId = category_id === '' || category_id === null ? null : Number(category_id);

    const [result] = await pool.query(
      'INSERT INTO products (category_id, name, description, price) VALUES (?, ?, ?, ?)',
      [normalizedCategoryId, String(name).trim(), description || null, price]
    );

    return NextResponse.json(
      { id: result.insertId, category_id: normalizedCategoryId, name: String(name).trim(), description: description || null, price },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getApiErrorMessage(error) }, { status: 500 });
  }
}
