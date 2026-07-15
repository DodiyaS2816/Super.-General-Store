const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/orders/checkout - { shipping_address }
router.post('/checkout', (req, res) => {
  const { shipping_address } = req.body;
  const cartItems = db
    .prepare(
      `SELECT ci.*, p.name AS product_name, p.price, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`
    )
    .all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Not enough stock for ${item.product_name}` });
    }
  }

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const createOrder = db.transaction(() => {
    const orderInfo = db
      .prepare('INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)')
      .run(req.user.id, Math.round(total * 100) / 100, shipping_address || '');

    const orderId = orderInfo.lastInsertRowid;
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)'
    );
    const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.price);
      decrementStock.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderId;
  });

  const orderId = createOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ order: { ...order, items } });
});

// GET /api/orders - current user's orders (or all, if admin with ?all=true)
router.get('/', (req, res) => {
  let orders;
  if (req.user.role === 'admin' && req.query.all === 'true') {
    orders = db
      .prepare(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email
         FROM orders o JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC`
      )
      .all();
  } else {
    orders = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);
  }

  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const withItems = orders.map((o) => ({ ...o, items: itemsStmt.all(o.id) }));
  res.json({ orders: withItems });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order: { ...order, items } });
});

// PUT /api/orders/:id/status - admin only, { status }
router.put('/:id/status', requireRole('admin'), (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${valid.join(', ')}` });
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

module.exports = router;
