const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('meridian_token'); },
  getUser() {
    const raw = localStorage.getItem('meridian_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem('meridian_token', token);
    localStorage.setItem('meridian_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('meridian_token');
    localStorage.removeItem('meridian_user');
  },
  isAdmin() {
    const u = this.getUser();
    return !!u && u.role === 'admin';
  },
};

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 401) Auth.clearSession();
    throw new Error(message);
  }
  return data;
}

const Api = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => apiRequest('/products/categories'),
  createProduct: (payload) => apiRequest('/products', { method: 'POST', body: payload }),
  updateProduct: (id, payload) => apiRequest(`/products/${id}`, { method: 'PUT', body: payload }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),

  getCart: () => apiRequest('/cart'),
  addToCart: (product_id, quantity) => apiRequest('/cart', { method: 'POST', body: { product_id, quantity } }),
  updateCartItem: (itemId, quantity) => apiRequest(`/cart/${itemId}`, { method: 'PUT', body: { quantity } }),
  removeCartItem: (itemId) => apiRequest(`/cart/${itemId}`, { method: 'DELETE' }),

  checkout: (shipping_address) => apiRequest('/orders/checkout', { method: 'POST', body: { shipping_address } }),
  getOrders: (all = false) => apiRequest(`/orders${all ? '?all=true' : ''}`),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PUT', body: { status } }),
};
