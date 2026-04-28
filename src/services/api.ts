import axios from 'axios';

// Generic API client — configure BASE_URL to point to any ecom backend
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Try admin_token first, then regular user token
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Don't redirect on 401 — admin panel handles auth gracefully
    return Promise.reject(err);
  }
);

// ==================== AUTH ====================
export const adminLogin = (phone: string, code: string) =>
  api.post('/auth/verify-otp', { phone, code });
export const sendOTP = (phone: string) =>
  api.post('/auth/send-otp', { phone });

// ==================== DASHBOARD / ANALYTICS ====================
export const getDashboardStats = () => api.get('/admin/stats');
export const getRevenueData = (period?: string) =>
  api.get('/admin/revenue', { params: { period } });

// ==================== USERS ====================
export const getUsers = (page = 1, limit = 20) =>
  api.get('/admin/users', { params: { page, limit } });
export const getUserById = (id: string) => api.get(`/admin/users/${id}`);
export const updateUser = (id: string, data: any) => api.put(`/admin/users/${id}`, data);

// ==================== ORDERS ====================
export const getOrders = (status?: string, page = 1, limit = 20) =>
  api.get('/admin/orders', { params: { status, page, limit } });
export const getOrderById = (id: string) => api.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id: string, status: string, trackingId?: string) =>
  api.put(`/admin/order/${id}/status`, { status, tracking_id: trackingId });

// ==================== INVENTORY ====================
export const getInventory = () => api.get('/admin/inventory');
export const updateInventory = (data: any) => api.put('/admin/inventory', data);

// ==================== PAYMENTS ====================
export const getPayments = (page = 1, limit = 20) =>
  api.get('/admin/payments', { params: { page, limit } });

export default api;
