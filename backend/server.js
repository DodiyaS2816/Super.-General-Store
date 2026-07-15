require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db/seed'); // ensures demo data exists on first run

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the frontend as static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`E-Commerce API server running on http://localhost:${PORT}`);
});
