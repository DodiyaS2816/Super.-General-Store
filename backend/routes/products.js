const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - public catalog, supports ?category= and ?search=
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  sql += ' AND name NOT IN (?, ?, ?, ?)';
  params.push('Plant Pot', 'Kids Toy Car', 'Coffee Beans', 'Travel Backpack');

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY created_at DESC';

  const products = db.prepare(sql).all(...params);
  res.json({ products });
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category').all();
  res.json({ categories: rows.map((r) => r.category) });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

// POST /api/products - admin only
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const { name, description, price, category, image_url, stock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const info = db
    .prepare(
      'INSERT INTO products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(name, description || '', price, category || null, image_url || null, stock || 0);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product });
});

// PUT /api/products/:id - admin only
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { name, description, price, category, image_url, stock } = req.body;
  db.prepare(
    `UPDATE products SET
      name = ?, description = ?, price = ?, category = ?, image_url = ?, stock = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    price ?? existing.price,
    category ?? existing.category,
    image_url ?? existing.image_url,
    stock ?? existing.stock,
    req.params.id
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product });
});

// DELETE /api/products/:id - admin only
router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
