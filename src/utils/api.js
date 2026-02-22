import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Menu API calls
export const menuAPI = {
  getMenu: () => api.get('/menu'),
  getCategoryItems: (categoryId) => api.get(`/menu/category/${categoryId}`),
  searchMenu: (query) => api.get(`/menu/search?q=${query}`),
  createMenuItem: (itemData, token) =>
    api.post('/menu/item', itemData, authConfig(token)),
  updateMenuItem: (itemId, itemData, token) =>
    api.patch(`/menu/item/${itemId}`, itemData, authConfig(token)),
  updateItemAvailability: (itemId, available, token) =>
    api.patch(`/menu/item/${itemId}/availability`, { available }, authConfig(token)),
  deleteMenuItem: (itemId, token) =>
    api.delete(`/menu/item/${itemId}`, authConfig(token)),
};

// Order API calls
export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getAllOrders: (status, token) =>
    api.get(`/orders${status ? `?status=${status}` : ''}`, authConfig(token)),
  getOrder: (orderId, token) => api.get(`/orders/${orderId}`, authConfig(token)),
  updateOrderStatus: (orderId, status, token) =>
    api.patch(`/orders/${orderId}/status`, { status }, authConfig(token)),
};

export const adminAPI = {
  login: (username, password) => api.post('/admin/login', { username, password }),
  me: (token) => api.get('/admin/me', authConfig(token)),
  logout: (token) => api.post('/admin/logout', {}, authConfig(token)),
};

export default api;
