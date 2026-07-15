const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate); // every cart route requires login

// GET /api/cart
router.get('/', (req, res) => {
  const items = db
    .prepare(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`
    )
    .all(req.user.id);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ items, total: Math.round(total * 100) / 100 });
});

// POST /api/cart - { product_id, quantity }
router.post('/', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
  if (quantity > product.stock) return res.status(400).json({ error: 'Not enough stock available' });

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, product_id);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(
      existing.quantity + quantity,
      existing.id
    );
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      req.user.id,
      product_id,
      quantity
    );
  }
  res.status(201).json({ success: true });
});

// PUT /api/cart/:itemId - { quantity }
router.put('/:itemId', (req, res) => {
  const { quantity } = req.body;
  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.itemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  res.json({ success: true });
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', (req, res) => {
  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.itemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  res.json({ success: true });
});

module.exports = router;
