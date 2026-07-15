const db = require('./database');

const products = [
  ['Wireless Headphones', 'Over-ear Bluetooth headphones with noise cancellation.', 1999.0, 'Electronics', 'https://picsum.photos/seed/headphones/400/300', 25],
  ['Mechanical Keyboard', 'Tactile mechanical keyboard with RGB backlight.', 1299.0, 'Electronics', 'https://picsum.photos/seed/keyboard/400/300', 40],
  ['Running Shoes', 'Lightweight breathable running shoes.', 2499.0, 'Footwear', 'https://picsum.photos/seed/shoes/400/300', 60],
  ['Ceramic Coffee Mug', '350ml ceramic mug, dishwasher safe.', 399.0, 'Home', 'https://picsum.photos/seed/mug/400/300', 100],
  ['Backpack', 'Water-resistant 25L daily backpack.', 1499.0, 'Accessories', 'https://picsum.photos/seed/backpack/400/300', 35],
  ['Smart Watch', 'Fitness tracking smart watch with heart-rate monitor.', 4999.0, 'Electronics', 'https://picsum.photos/seed/watch/400/300', 15],
  ['Yoga Mat', 'Non-slip 6mm yoga mat.', 799.0, 'Fitness', 'https://picsum.photos/seed/yoga/400/300', 50],
  ['Desk Lamp', 'LED desk lamp with adjustable brightness.', 999.0, 'Home', 'https://picsum.photos/seed/lamp/400/300', 45],
  ['Ultra HD Monitor', '27-inch 4K display for work and entertainment.', 12999.0, 'Electronics', 'https://picsum.photos/seed/monitor/400/300', 18],
  ['Bluetooth Speaker', 'Portable speaker with deep bass and 12-hour battery.', 2499.0, 'Electronics', 'https://picsum.photos/seed/speaker/400/300', 22],
  ['Leather Wallet', 'Premium genuine leather wallet with RFID protection.', 1799.0, 'Fashion', 'https://picsum.photos/seed/wallet/400/300', 30],
  ['Sunglasses', 'Polarized UV-protected sunglasses for daily use.', 1599.0, 'Fashion', 'https://picsum.photos/seed/sunglasses/400/300', 27],
  ['Face Cream', 'Hydrating face cream for all skin types.', 699.0, 'Beauty', 'https://picsum.photos/seed/cream/400/300', 40],
  ['Shampoo', 'Nourishing shampoo for smooth and healthy hair.', 499.0, 'Beauty', 'https://picsum.photos/seed/shampoo/400/300', 50],
  ['Dining Table', 'Solid wood dining table for modern homes.', 12999.0, 'Home', 'https://picsum.photos/seed/table/400/300', 12],
  ['Air Purifier', 'Quiet air purifier for bedrooms and offices.', 8999.0, 'Home', 'https://picsum.photos/seed/purifier/400/300', 16],
  ['Yoga Block Set', 'Durable foam yoga blocks for beginners and pros.', 999.0, 'Fitness', 'https://picsum.photos/seed/block/400/300', 24],
  ['Water Bottle', 'Insulated stainless steel bottle for travel.', 799.0, 'Sports', 'https://picsum.photos/seed/bottle/400/300', 35],
  ['Notebook Set', 'Premium notebook set for study and planning.', 499.0, 'Office', 'https://picsum.photos/seed/notebook/400/300', 60],
  ['Plant Pot', 'Decorative ceramic pot for indoor plants.', 1199.0, 'Garden', 'https://picsum.photos/seed/pot/400/300', 28],
  ['Kids Toy Car', 'Durable remote-controlled toy car for children.', 1499.0, 'Toys', 'https://picsum.photos/seed/toycar/400/300', 20],
  ['Coffee Beans', 'Fresh roasted Arabica coffee beans.', 799.0, 'Grocery', 'https://picsum.photos/seed/coffee/400/300', 45],
  ['Travel Backpack', 'Lightweight 20L travel backpack with laptop sleeve.', 2199.0, 'Accessories', 'https://picsum.photos/seed/travelbag/400/300', 26],
  ['Desk Organizer', 'Minimal desk organizer for cables and stationery.', 799.0, 'Office', 'https://picsum.photos/seed/organizer/400/300', 34],
  ['Garden Tool Kit', 'Compact tool kit for indoor and outdoor gardening.', 1899.0, 'Garden', 'https://picsum.photos/seed/tools/400/300', 15],
  ['Smart Thermostat', 'Energy-saving thermostat with app controls.', 10999.0, 'Electronics', 'https://picsum.photos/seed/thermostat/400/300', 14],
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)'
);

const tx = db.transaction((rows) => {
  for (const row of rows) insert.run(...row);
});

tx(products);
console.log(`Inserted or preserved ${products.length} products.`);
console.log(`Total products in database: ${db.prepare('SELECT COUNT(*) AS c FROM products').get().c}`);
