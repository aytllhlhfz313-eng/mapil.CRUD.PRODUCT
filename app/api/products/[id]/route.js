import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getApiErrorMessage } from '@/lib/api-error';

export async function GET(request, { params }) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.description, p.price, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getApiErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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
      'UPDATE products SET category_id = ?, name = ?, description = ?, price = ? WHERE id = ?',
      [normalizedCategoryId, String(name).trim(), description || null, price, params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: Number(params.id),
      category_id: normalizedCategoryId,
      name: String(name).trim(),
      description: description || null,
      price,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getApiErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [params.id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getApiErrorMessage(error) }, { status: 500 });
  }
}
