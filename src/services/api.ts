import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject admin token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401, clear auth + redirect to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ==================== AUTH ====================
export const adminLogin = (email: string, password: string) =>
  api.post('/admin/auth/login', { email, password });

// ==================== DASHBOARD / ANALYTICS ====================
export const getDashboardStats = () => api.get('/admin/stats');
export const getRevenueData = (period?: string) =>
  api.get('/admin/analytics/revenue', { params: { period } });

// ==================== USERS ====================
export const getUsers = (page = 1, limit = 20) =>
  api.get('/admin/users', { params: { page, limit } });
export const getUserById = (id: string) => api.get(`/admin/users/${id}`);
export const updateUser = (id: string, data: any) => api.put(`/admin/users/${id}`, data);

// ==================== ORDERS ====================
export const getOrders = (params?: { status?: string; payment_status?: string; page?: number; limit?: number; from?: string; to?: string; q?: string }) =>
  api.get('/admin/orders', { params });
export const getOrderById = (id: string) => api.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id: string, status: string, trackingId?: string) =>
  api.put(`/admin/order/${id}/status`, { status, tracking_id: trackingId });
export const createShipment = (orderId: string) =>
  api.post(`/admin/orders/${orderId}/ship`);
export const processRefund = (orderId: string) =>
  api.post(`/admin/orders/${orderId}/refund`);

// ==================== PRODUCTS ====================
export const getProducts = (search?: string) =>
  api.get('/admin/products', { params: { search, limit: 500 } });
export const createProduct = (data: any) => api.post('/admin/products', data);
export const updateProduct = (id: string, data: any) => api.put(`/admin/products/${id}`, data);
export const deleteProduct = (id: string) => api.delete(`/admin/products/${id}`);

// ==================== COUPONS ====================
export const getCoupons = () => api.get('/admin/coupons');
export const createCoupon = (data: any) => api.post('/admin/coupons', data);
export const updateCoupon = (id: string, data: any) => api.put(`/admin/coupons/${id}`, data);
export const deleteCoupon = (id: string) => api.delete(`/admin/coupons/${id}`);

// ==================== INVENTORY ====================
export const getInventory = () => api.get('/admin/inventory');
export const updateInventory = (data: any) => api.put('/admin/inventory', data);

// ==================== PAYMENTS ====================
export const getPayments = (page = 1, limit = 20) =>
  api.get('/admin/payments', { params: { page, limit } });

// ==================== CATEGORIES ====================
export const getCategoryTree = () => api.get('/categories/tree');
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (data: any) => api.post('/admin/categories', data);
export const updateCategory = (id: string, data: any) => api.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id: string) => api.delete(`/admin/categories/${id}`);

// ==================== REVIEWS ====================
export const getReviews = (approved?: boolean) => api.get('/admin/reviews', { params: approved === undefined ? undefined : { approved } });
export const setReviewApproval = (id: string, isApproved: boolean) => api.put(`/admin/reviews/${id}/approve`, { is_approved: isApproved });

// ==================== RETURNS ====================
export const getReturns = (status?: string) =>
  api.get('/admin/returns', { params: { status } });
export const updateReturn = (id: string, data: { status: string; admin_note?: string }) =>
  api.put(`/admin/returns/${id}`, data);

// ==================== CONTACT MESSAGES ====================
export const getContactMessages = (status?: string) =>
  api.get('/admin/contact-messages', { params: { status } });
export const updateContactMessage = (id: string, data: { status: string }) =>
  api.put(`/admin/contact-messages/${id}`, data);

// ==================== INVOICE ====================
export const getOrderInvoice = (orderId: string) =>
  api.get(`/admin/orders/${orderId}/invoice`, { responseType: 'text' });

// ==================== UPLOADS ====================
export const getPresignedUrl = (filename: string, content_type: string) =>
  api.post('/admin/uploads/presign', { filename, content_type });

export default api;

// ==================== OPERATIONS ====================
export const getOpsStatus = () => api.get('/admin/ops/status');
export const getOpsAnomalies = (params?: { severity?: string; event_code?: string; resource_id?: string; active?: string; page?: number; limit?: number }) =>
  api.get('/admin/ops/anomalies', { params });
export const getOpsAudit = (params?: { action?: string; resource_id?: string; request_id?: string; page?: number; limit?: number }) =>
  api.get('/admin/ops/audit', { params });
