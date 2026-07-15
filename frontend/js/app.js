const app = document.getElementById('app');
const accountArea = document.getElementById('account-area');
const cartCountEl = document.getElementById('cart-count');

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function money(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getProductImageUrl(imageUrl) {
  return imageUrl && String(imageUrl).trim() ? String(imageUrl).trim() : 'https://via.placeholder.com/600x450?text=Meridian+Store';
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 2600);
}

function animatePageIn() {
  app.classList.remove('page-enter');
  void app.offsetWidth;
  app.classList.add('page-enter');
}

function showLoadingSkeleton(count = 6) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="product-card skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="product-body">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
      </div>
    </div>
  `).join('');
}

function bumpCartIcon() {
  cartCountEl.classList.remove('cart-pop');
  void cartCountEl.offsetWidth;
  cartCountEl.classList.add('cart-pop');
}

function requireAuth() {
  if (!Auth.getToken()) {
    location.hash = '#/login';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!requireAuth()) return false;
  if (!Auth.isAdmin()) {
    app.innerHTML = `<div class="empty-state"><h3>Admins only</h3><p>This area is restricted to admin accounts.</p></div>`;
    return false;
  }
  return true;
}

function updateHeaderState() {
  const user = Auth.getUser();
  document.body.classList.toggle('is-authed', !!user);
  document.body.classList.toggle('is-admin', !!user && user.role === 'admin');

  if (user) {
    accountArea.innerHTML = `
      <div class="account-pill">
        <span class="name">${escapeHtml(user.name)}</span>
        <span class="role-badge">${escapeHtml(user.role)}</span>
        <button class="btn-ghost-light" id="logout-btn">Sign out</button>
      </div>`;
    document.getElementById('logout-btn').onclick = () => {
      Auth.clearSession();
      updateHeaderState();
      location.hash = '#/catalog';
      showToast('Signed out');
    };
    refreshCartCount();
  } else {
    accountArea.innerHTML = `<a href="#/login" class="btn-ghost-light">Sign in</a>`;
    cartCountEl.classList.add('hidden');
  }

  document.querySelectorAll('.main-nav a').forEach((a) => {
    a.classList.toggle('active', location.hash.startsWith(`#/${a.dataset.route}`));
  });
}

async function refreshCartCount() {
  if (!Auth.getToken()) return;
  try {
    const { items } = await Api.getCart();
    const count = items.reduce((s, i) => s + i.quantity, 0);
    cartCountEl.textContent = count;
    cartCountEl.classList.toggle('hidden', count === 0);
  } catch (_) { /* ignore */ }
}

/* ---------------------------- ROUTES ---------------------------- */

const routes = {
  '#/catalog': renderCatalog,
  '#/login': renderLogin,
  '#/register': renderRegister,
  '#/cart': renderCart,
  '#/orders': renderOrders,
  '#/admin': renderAdmin,
};

function router() {
  const hash = location.hash || '#/catalog';
  const handler = routes[hash] || renderCatalog;
  updateHeaderState();
  animatePageIn();
  handler();
}
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

/* ---------------------------- CATALOG ---------------------------- */

async function renderCatalog() {
  app.innerHTML = `
    <div class="page-head">
      <span class="page-eyebrow">Full Catalog</span>
      <h1>Everything in the store</h1>
      <p>Browse products, filter by category, and add items straight to your cart.</p>
    </div>
    <div class="catalog-toolbar">
      <input type="search" id="search-input" placeholder="Search products…" />
      <select id="category-select"><option value="">All categories</option></select>
    </div>
    <div id="product-grid" class="product-grid"></div>
  `;
  showLoadingSkeleton();

  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');

  Api.getCategories().then(({ categories }) => {
    categorySelect.innerHTML = '<option value="">All categories</option>' +
      categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  });

  let debounceTimer;
  const load = async () => {
    const params = {};
    if (searchInput.value.trim()) params.search = searchInput.value.trim();
    if (categorySelect.value) params.category = categorySelect.value;
    const { products } = await Api.getProducts(params);
    renderProductGrid(products);
  };
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(load, 300);
  });
  categorySelect.addEventListener('change', load);

  load();
}

function renderProductGrid(products) {
  const grid = document.getElementById('product-grid');
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No products found</h3><p>Try a different search or category.</p></div>`;
    return;
  }
  grid.innerHTML = products.map((p) => `
    <div class="product-card">
      <div class="price-tag">${money(p.price)}</div>
      <img class="thumb" src="${escapeHtml(getProductImageUrl(p.image_url))}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x450?text=Meridian+Store';" />
      <div class="product-body">
        <span class="product-category">${escapeHtml(p.category || 'General')}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.description || '')}</p>
        <p class="product-stock ${p.stock === 0 ? 'low' : ''}">${p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}</p>
        <div class="product-actions">
          <input type="number" min="1" max="${p.stock}" value="1" class="qty-input" ${p.stock === 0 ? 'disabled' : ''} />
          <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>Add to cart</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!Auth.getToken()) {
        showToast('Sign in to add items to your cart', true);
        location.hash = '#/login';
        return;
      }
      const card = btn.closest('.product-card');
      const qty = parseInt(card.querySelector('.qty-input').value, 10) || 1;
      try {
        await Api.addToCart(parseInt(btn.dataset.id, 10), qty);
        showToast('Added to cart');
        refreshCartCount();
        bumpCartIcon();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });
}

/* ---------------------------- AUTH ---------------------------- */

function renderLogin() {
  app.innerHTML = `
    <div class="auth-shell">
      <h1>Welcome back</h1>
      <p style="color:var(--muted);margin-bottom:20px;">Sign in to shop and track your orders.</p>
      <div id="auth-error"></div>
      <form id="login-form">
        <div class="form-field"><label>Email</label><input type="email" name="email" required /></div>
        <div class="form-field"><label>Password</label><input type="password" name="password" required /></div>
        <button class="btn btn-primary btn-block" type="submit">Sign in</button>
      </form>
      <p class="form-note">No account? <a href="#/register" style="color:var(--forest);font-weight:600;">Create one</a></p>
      <div class="demo-creds">
        <strong>Demo accounts</strong><br/>
        Admin — admin@example.com / admin123<br/>
        Shopper — user@example.com / user123
      </div>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const { token, user } = await Api.login({ email: form.get('email'), password: form.get('password') });
      Auth.setSession(token, user);
      showToast(`Welcome, ${user.name}`);
      location.hash = '#/catalog';
    } catch (err) {
      document.getElementById('auth-error').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

function renderRegister() {
  app.innerHTML = `
    <div class="auth-shell">
      <h1>Create your account</h1>
      <p style="color:var(--muted);margin-bottom:20px;">New accounts get standard shopper access.</p>
      <div id="auth-error"></div>
      <form id="register-form">
        <div class="form-field"><label>Name</label><input type="text" name="name" required /></div>
        <div class="form-field"><label>Email</label><input type="email" name="email" required /></div>
        <div class="form-field"><label>Password</label><input type="password" name="password" minlength="6" required /></div>
        <button class="btn btn-primary btn-block" type="submit">Create account</button>
      </form>
      <p class="form-note">Already have an account? <a href="#/login" style="color:var(--forest);font-weight:600;">Sign in</a></p>
    </div>
  `;
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const { token, user } = await Api.register({
        name: form.get('name'), email: form.get('email'), password: form.get('password'),
      });
      Auth.setSession(token, user);
      showToast(`Account created — welcome, ${user.name}`);
      location.hash = '#/catalog';
    } catch (err) {
      document.getElementById('auth-error').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

/* ---------------------------- CART ---------------------------- */

async function renderCart() {
  if (!requireAuth()) return;
  app.innerHTML = `<p>Loading cart…</p>`;
  const { items, total } = await Api.getCart();

  if (items.length === 0) {
    app.innerHTML = `
      <div class="page-head"><span class="page-eyebrow">Your Cart</span><h1>Cart is empty</h1></div>
      <div class="empty-state"><h3>Nothing here yet</h3><p>Add a few things from the catalog to get started.</p>
        <a href="#/catalog" class="btn btn-primary" style="margin-top:14px;">Browse catalog</a></div>`;
    return;
  }

  app.innerHTML = `
    <div class="page-head"><span class="page-eyebrow">Your Cart</span><h1>Review your order</h1></div>
    <div class="cart-layout">
      <div class="cart-list" id="cart-list">
        ${items.map((i) => `
          <div class="cart-row" data-item="${i.id}">
            <img src="${escapeHtml(getProductImageUrl(i.image_url))}" alt="" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x450?text=Meridian+Store';" />
            <div>
              <div class="name">${escapeHtml(i.name)}</div>
              <div class="unit-price">${money(i.price)} each</div>
            </div>
            <input type="number" class="qty-input cart-qty" min="1" max="${i.stock}" value="${i.quantity}" data-item="${i.id}" />
            <button class="btn btn-danger btn-sm remove-item-btn" data-item="${i.id}">Remove</button>
          </div>`).join('')}
      </div>
      <div class="summary-card">
        <h3>Order summary</h3>
        <div class="summary-row"><span>Items</span><span>${items.reduce((s, i) => s + i.quantity, 0)}</span></div>
        <div class="summary-row total"><span>Total</span><span class="amount" id="cart-total">${money(total)}</span></div>
        <div class="form-field" style="margin-top:18px;">
          <label style="color:rgba(250,246,238,0.8);">Shipping address</label>
          <textarea id="shipping-address" rows="3" placeholder="123 Market St, Springfield"></textarea>
        </div>
        <button class="btn btn-accent btn-block" id="checkout-btn">Checkout</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.cart-qty').forEach((input) => {
    input.addEventListener('change', async () => {
      try {
        await Api.updateCartItem(input.dataset.item, parseInt(input.value, 10) || 1);
        renderCart();
        refreshCartCount();
      } catch (err) { showToast(err.message, true); }
    });
  });
  document.querySelectorAll('.remove-item-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await Api.removeCartItem(btn.dataset.item);
      renderCart();
      refreshCartCount();
    });
  });
  document.getElementById('checkout-btn').addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Placing order…';
    try {
      const address = document.getElementById('shipping-address').value.trim();
      const { order } = await Api.checkout(address);
      showToast(`Order #${order.id} placed`);
      refreshCartCount();
      location.hash = '#/orders';
    } catch (err) {
      showToast(err.message, true);
      e.target.disabled = false;
      e.target.textContent = 'Checkout';
    }
  });
}

/* ---------------------------- ORDERS ---------------------------- */

function statusOptions(current) {
  const all = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  return all.map((s) => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
}

async function renderOrders() {
  if (!requireAuth()) return;
  const isAdmin = Auth.isAdmin();
  app.innerHTML = `
    <div class="page-head">
      <span class="page-eyebrow">${isAdmin ? 'All Orders' : 'Order History'}</span>
      <h1>${isAdmin ? 'Every order in the system' : 'Your orders'}</h1>
    </div>
    <div id="orders-list">Loading orders…</div>
  `;
  const { orders } = await Api.getOrders(isAdmin);
  const list = document.getElementById('orders-list');

  if (orders.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>No orders yet</h3><p>Orders you place will show up here.</p></div>`;
    return;
  }

  list.innerHTML = orders.map((o) => `
    <div class="order-card">
      <div class="order-head">
        <div>
          <div class="order-id">Order #${o.id}</div>
          <div class="order-meta">${new Date(o.created_at).toLocaleString()}${isAdmin ? ` &middot; ${escapeHtml(o.customer_name)} (${escapeHtml(o.customer_email)})` : ''}</div>
        </div>
        <span class="status-pill status-${o.status}">${o.status}</span>
      </div>
      <table class="order-items-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${o.items.map((i) => `
            <tr>
              <td>${escapeHtml(i.product_name)}</td>
              <td>${i.quantity}</td>
              <td>${money(i.price_at_purchase)}</td>
              <td>${money(i.price_at_purchase * i.quantity)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="order-meta" style="margin-top:10px;">Total: <strong style="color:var(--ink)">${money(o.total)}</strong>${o.shipping_address ? ` &middot; Ship to: ${escapeHtml(o.shipping_address)}` : ''}</div>
      ${isAdmin ? `
        <div class="order-controls">
          <select class="status-select" data-order="${o.id}">${statusOptions(o.status)}</select>
          <button class="btn btn-outline btn-sm save-status-btn" data-order="${o.id}">Update status</button>
        </div>` : ''}
    </div>
  `).join('');

  if (isAdmin) {
    list.querySelectorAll('.save-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const select = list.querySelector(`.status-select[data-order="${btn.dataset.order}"]`);
        try {
          await Api.updateOrderStatus(btn.dataset.order, select.value);
          showToast(`Order #${btn.dataset.order} updated`);
          renderOrders();
        } catch (err) { showToast(err.message, true); }
      });
    });
  }
}

/* ---------------------------- ADMIN ---------------------------- */

let adminTab = 'products';

async function renderAdmin() {
  if (!requireAdmin()) return;
  app.innerHTML = `
    <div class="page-head"><span class="page-eyebrow">Admin</span><h1>Store management</h1></div>
    <div class="admin-tabs">
      <div class="admin-tab" data-tab="products">Products</div>
      <div class="admin-tab" data-tab="orders">Orders</div>
    </div>
    <div id="admin-content"></div>
  `;
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === adminTab);
    tab.addEventListener('click', () => { adminTab = tab.dataset.tab; renderAdmin(); });
  });

  if (adminTab === 'products') renderAdminProducts();
  else location.hash = '#/orders';
}

async function renderAdminProducts() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `
    <div class="admin-toolbar">
      <span style="color:var(--muted)">Manage catalog items</span>
      <button class="btn btn-accent btn-sm" id="new-product-btn">+ New product</button>
    </div>
    <table class="admin-table">
      <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
      <tbody id="admin-products-body"><tr><td colspan="6">Loading…</td></tr></tbody>
    </table>
  `;
  document.getElementById('new-product-btn').addEventListener('click', () => openProductModal());

  const { products } = await Api.getProducts();
  const body = document.getElementById('admin-products-body');
  body.innerHTML = products.map((p) => `
    <tr>
      <td><img src="${escapeHtml(getProductImageUrl(p.image_url))}" alt="" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x450?text=Meridian+Store';" /></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || '—')}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-outline btn-sm edit-product-btn" data-id="${p.id}">Edit</button>
        <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('.edit-product-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = products.find((p) => p.id === parseInt(btn.dataset.id, 10));
      openProductModal(product);
    });
  });
  body.querySelectorAll('.delete-product-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this product? This cannot be undone.')) return;
      try {
        await Api.deleteProduct(btn.dataset.id);
        showToast('Product deleted');
        renderAdminProducts();
      } catch (err) { showToast(err.message, true); }
    });
  });
}

function openProductModal(product = null) {
  const isEdit = !!product;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-card">
      <button class="close-x" aria-label="Close">&times;</button>
      <h2>${isEdit ? 'Edit product' : 'New product'}</h2>
      <form id="product-form">
        <div class="form-field"><label>Name</label><input name="name" required value="${escapeHtml(product?.name || '')}" /></div>
        <div class="form-field"><label>Description</label><textarea name="description" rows="2">${escapeHtml(product?.description || '')}</textarea></div>
        <div class="form-grid-2">
          <div class="form-field"><label>Price (₹)</label><input name="price" type="number" step="0.01" min="0" required value="${product?.price ?? ''}" /></div>
          <div class="form-field"><label>Stock</label><input name="stock" type="number" min="0" required value="${product?.stock ?? 0}" /></div>
        </div>
        <div class="form-field"><label>Category</label><input name="category" value="${escapeHtml(product?.category || '')}" /></div>
        <div class="form-field"><label>Image URL</label><input name="image_url" value="${escapeHtml(product?.image_url || '')}" /></div>
        <button class="btn btn-primary btn-block" type="submit">${isEdit ? 'Save changes' : 'Create product'}</button>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.querySelector('.close-x').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  backdrop.querySelector('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name'),
      description: form.get('description'),
      price: parseFloat(form.get('price')),
      stock: parseInt(form.get('stock'), 10),
      category: form.get('category'),
      image_url: form.get('image_url'),
    };
    try {
      if (isEdit) await Api.updateProduct(product.id, payload);
      else await Api.createProduct(payload);
      showToast(isEdit ? 'Product updated' : 'Product created');
      close();
      renderAdminProducts();
    } catch (err) { showToast(err.message, true); }
  });
}
