const bcrypt = require('bcryptjs');
const db = require('./database');

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    insertUser.run('Admin User', 'admin@example.com', bcrypt.hashSync('admin123', 10), 'admin');
    insertUser.run('Demo Shopper', 'user@example.com', bcrypt.hashSync('user123', 10), 'user');
    console.log('Seeded users: admin@example.com / admin123, user@example.com / user123');
  }

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const updateProduct = db.prepare(
    'UPDATE products SET description = ?, price = ?, category = ?, image_url = ?, stock = ?, updated_at = datetime(\'now\') WHERE name = ?'
  );
  const products = [
    ['Wireless Headphones', 'Over-ear Bluetooth headphones with noise cancellation.', 1999.00, 'Electronics', 'https://littlewish.in/wp-content/uploads/2025/07/pdt-nothing1-white-stn-pks04_1024x1024.webp', 25],
    ['Mechanical Keyboard', 'Tactile mechanical keyboard with RGB backlight.', 1299.00, 'Electronics', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTXTl2ByPvHhTCyMuXzsEQkwmZ_m43vznBQ6W18a_gFw&s=10', 40],
    ['Running Shoes', 'Lightweight breathable running shoes.', 2499.00, 'Footwear', 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRsSNtN_zFbmctbc_rmKPi0zeI6h92VdHDBhEjjFHaj3Ksyp9jJ38sqXRmSIZ1VsJ4A3wn5qJu-VK_PI2A4-6fcdBUkFpI9MCP-1Yb6CKfdXYUoDW_DUps1dg&usqp=CAc', 60],
    ['Smart Watch', 'Fitness tracking smart watch with heart-rate monitor.', 4999.00, 'Electronics', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCz30iO0DPbZdw3LnIdW2kmWOLDAJWr076tq0rQJaAtw&s=10', 15],
    ['Yoga Mat', 'Non-slip 6mm yoga mat.', 799.00, 'Fitness', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQx5ldBqJ63GGNzDDThx5v8jszNuBv4fjrzXLEVgz9Ggw&s=10', 50],
    ['Desk Lamp', 'LED desk lamp with adjustable brightness.', 999.00, 'Home', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpEN6vtn4bN2eU8jpukot5ht8XpiujV5ut2f2DZ6xbpA&s=10', 45],
    ['Ultra HD Monitor', '27-inch 4K display for work and entertainment.', 12999.00, 'Electronics', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf-_aC_dcodgbd0eGqwfqi1bJeLK_WnTYkFY79pUL1hg&s=10', 18],
    ['Bluetooth Speaker', 'Portable speaker with deep bass and 12-hour battery.', 2499.00, 'Electronics', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHksRkexzPeyM4UU0-S5ZC84VBq5IroGxfcp6rFyyYgQ&s=10', 22],
    ['Leather Wallet', 'Premium genuine leather wallet with RFID protection.', 1799.00, 'Fashion', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3448mxylBA1GypSdT5sBVLyNugWgef_TArc00DPyGuw&s=10', 30],
    ['Sunglasses', 'Polarized UV-protected sunglasses for daily use.', 1599.00, 'Fashion', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTx1YFRwr6uksHaFe1CFP7GtAZkcrD_QchQit9eq1X-_A&s=10', 27],
    ['Face Cream', 'Hydrating face cream for all skin types.', 699.00, 'Beauty', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRdaEyrGXJhZV9eFKL21dh_tPI6qSsnAIHhJdqMeIdGw&s=10', 40],
    ['Shampoo', 'Nourishing shampoo for smooth and healthy hair.', 499.00, 'Beauty', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIsm2ttoNAZ9yHaEdMRBLmaH77A3b9HIF6T05YwiYnDg&s=10', 50],
    ['Dining Table', 'Solid wood dining table for modern homes.', 12999.00, 'Home', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdkibyqja8zeuzrtJjy6IS8kREFJ53ErHR75sCCEpT3g&s=10', 12],
    ['Air Purifier', 'Quiet air purifier for bedrooms and offices.', 8999.00, 'Home', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvw8fHTAqJixhWV3MzSC9_QTSZPysyfH0t7SLEIHHbZQ&s=10', 16],
    ['Yoga Block Set', 'Durable foam yoga blocks for beginners and pros.', 999.00, 'Fitness', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7CGHBJ_e27RJeFaErabRSjLTkK16hQOXgl2Z8DQ6ijw&s=10', 24],
    ['Notebook Set', 'Premium notebook set for study and planning.', 499.00, 'Office','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNX9GfwF8RzwLRzeAP_XCF1HgOLybdwFlUvcNKZW6v6A&s=10', 60],
    ['Desk Organizer', 'Minimal desk organizer for cables and stationery.', 799.00, 'Office', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcK56iM55Zb4lbuQtDHRlkH1AVSJU9fd859jTwQFraFw&s=10', 34],
    ['Garden Tool Kit', 'Compact tool kit for indoor and outdoor gardening.', 1899.00, 'Garden', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCCdHg2vbmkOPI23T5SZnOB8qFPsEC538tY0LITdO7NQ&s=10', 15],
    ['Smart Thermostat', 'Energy-saving thermostat with app controls.', 10999.00, 'Electronics', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTicLypSRE8YGwmkVARA0YdVivsoTvEwHRQZ9l-PcgwRw&s=10', 14],
  ];
  const insertMany = db.transaction((rows) => {
    let updated = 0;
    for (const row of rows) {
      const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(row[0]);
      if (!existing) {
        insertProduct.run(...row);
        updated += 1;
      } else {
        updateProduct.run(row[1], row[2], row[3], row[4], row[5], row[0]);
        updated += 1;
      }
    }
    return updated;
  });
  const processedCount = insertMany(products);
  console.log(`Seeded or refreshed ${processedCount} products`);
}

seed();
module.exports = seed;
