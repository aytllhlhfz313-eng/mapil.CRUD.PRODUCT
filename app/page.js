'use client';

import { useEffect, useState } from 'react';

const emptyForm = { name: '', description: '', price: '', category_id: '' };

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  async function loadCategories() {
    setCategoryError('');
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat kategori');
      setCategories(data);
    } catch (err) {
      setCategoryError(err.message);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data');
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const filteredProducts = products
    .filter((product) => {
      const query = search.trim().toLocaleLowerCase('id-ID');
      const matchesSearch =
        !query ||
        `${product.name} ${product.description || ''} ${product.category_name || ''}`
          .toLocaleLowerCase('id-ID')
          .includes(query);
      const matchesCategory =
        !categoryFilter || String(product.category_id) === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'id');
      if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      return Number(b.id) - Number(a.id);
    });

  const averagePrice = products.length
    ? products.reduce((total, product) => total + Number(product.price), 0) /
      products.length
    : 0;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>CRUD Produk</h1>
      <p className="subtitle">Next.js + MySQL (Aiven)</p>

      {error && <div className="error-box">{error}</div>}
      {categoryError && (
        <div className="error-box">
          {categoryError}. Pastikan migrasi kategori sudah dijalankan.
        </div>
      )}

      <section className="summary-grid" aria-label="Ringkasan produk">
        <div className="summary-card">
          <span>Total Produk</span>
          <strong>{products.length}</strong>
        </div>
        <div className="summary-card">
          <span>Total Kategori</span>
          <strong>{categories.length}</strong>
        </div>
        <div className="summary-card">
          <span>Rata-rata Harga</span>
          <strong>Rp {averagePrice.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</strong>
        </div>
      </section>

      <div className="card">
        <h3>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="category_id">Kategori</label>
            <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">-- Pilih Kategori --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="name">Nama Produk</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Misal: Kopi Susu"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Deskripsi singkat produk (opsional)"
            />
          </div>

          <div className="form-row">
            <label htmlFor="price">Harga (Rp)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="status">
        {loading ? 'Memuat data...' : `${filteredProducts.length} dari ${products.length} produk`}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="form-row">
            <label htmlFor="product-search">Cari produk</label>
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama, deskripsi, atau kategori"
            />
          </div>
          <div className="form-row">
            <label htmlFor="category-filter">Filter kategori</label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="product-sort">Urutkan</label>
            <select
              id="product-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="latest">Terbaru</option>
              <option value="name">Nama A-Z</option>
              <option value="price-asc">Harga terendah</option>
              <option value="price-desc">Harga tertinggi</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Nama</th>
                <th>Deskripsi</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.category_name || '-'}</td>
                  <td>{p.name}</td>
                  <td>{p.description || '-'}</td>
                  <td>Rp {Number(p.price).toLocaleString('id-ID')}</td>
                  <td className="actions-cell">
                    <button type="button" className="btn-edit" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(p.id)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    {products.length
                      ? 'Produk tidak ditemukan. Ubah kata kunci atau filter.'
                      : 'Belum ada produk. Tambahkan produk pertama di atas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
