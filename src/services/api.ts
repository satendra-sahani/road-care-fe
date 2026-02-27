import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth APIs ────────────────────────────────────────────────────────
export const authAPI = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post('/common/auth/login', data),
  getProfile: () => api.get('/common/auth/profile'),
  logout: () => api.post('/common/auth/logout'),
};

// ─── Upload APIs ──────────────────────────────────────────────────────
export const uploadAPI = {
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return api.post('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImages: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (folder) formData.append('folder', folder);
    return api.post('/admin/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (fileId: string) => api.delete(`/admin/upload/image/${fileId}`),
};

// ─── Category APIs ────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/catalog/categories', { params }),
  getById: (id: string) => api.get(`/admin/catalog/categories/${id}`),
  create: (data: any) => api.post('/admin/catalog/categories', data),
  update: (id: string, data: any) =>
    api.put(`/admin/catalog/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/catalog/categories/${id}`),
  getTree: () => api.get('/admin/catalog/categories/tree'),
  getParents: () => api.get('/admin/catalog/categories/parents'),
  getStats: () => api.get('/admin/catalog/categories/stats'),
};

// ─── Brand APIs ───────────────────────────────────────────────────────
export const brandAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/catalog/brands', { params }),
  getById: (id: string) => api.get(`/admin/catalog/brands/${id}`),
  create: (data: any) => api.post('/admin/catalog/brands', data),
  update: (id: string, data: any) =>
    api.put(`/admin/catalog/brands/${id}`, data),
  delete: (id: string) => api.delete(`/admin/catalog/brands/${id}`),
  getStats: () => api.get('/admin/catalog/brands/stats'),
};

// ─── Product APIs ─────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/products', { params }),
  getById: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: any) => api.post('/admin/products', data),
  update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
  toggleStatus: (id: string) => api.put(`/admin/products/${id}/toggle-status`),
  addStock: (id: string, data: { quantity: number }) =>
    api.put(`/admin/products/${id}/add-stock`, data),
  addImages: (id: string, data: { images: string[] }) =>
    api.post(`/admin/products/${id}/images`, data),
  setThumbnail: (id: string, data: { url: string }) =>
    api.put(`/admin/products/${id}/thumbnail`, data),
  removeImage: (id: string, imageId: string) =>
    api.delete(`/admin/products/${id}/images/${imageId}`),
  getStats: () => api.get('/admin/products/stats'),
};

// ─── Service Request APIs (Admin) ────────────────────────────────────
export const serviceRequestAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/service-requests', { params }),
  getById: (id: string) => api.get(`/admin/service-requests/${id}`),
  getStats: () => api.get('/admin/service-requests/stats'),
  update: (id: string, data: any) =>
    api.put(`/admin/service-requests/${id}`, data),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.put(`/admin/service-requests/${id}/status`, data),
  assignMechanic: (id: string, mechanicId: string) =>
    api.put(`/admin/service-requests/${id}/assign`, { mechanicId }),
  cancel: (id: string, reason: string) =>
    api.put(`/admin/service-requests/${id}/cancel`, { reason }),
  updateCost: (id: string, data: {
    laborCost?: number;
    partsCost?: number;
    emergencyCharges?: number;
    partsRequired?: any[];
  }) => api.put(`/admin/service-requests/${id}/cost`, data),
  delete: (id: string) => api.delete(`/admin/service-requests/${id}`),
};

// ─── Mechanic APIs (Admin) ──────────────────────────────────────────
export const mechanicAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/mechanics', { params }),
  getById: (id: string) => api.get(`/admin/mechanics/${id}`),
  getStats: () => api.get('/admin/mechanics/stats'),
  getAvailable: (params?: Record<string, any>) =>
    api.get('/admin/mechanics/available', { params }),
  create: (data: any) => api.post('/admin/mechanics', data),
  update: (id: string, data: any) =>
    api.put(`/admin/mechanics/${id}`, data),
  toggleStatus: (id: string) =>
    api.put(`/admin/mechanics/${id}/toggle-status`),
  getEarnings: (id: string, period?: string) =>
    api.get(`/admin/mechanics/${id}/earnings`, { params: { period } }),
  delete: (id: string) => api.delete(`/admin/mechanics/${id}`),
};

// ─── Dashboard API ──────────────────────────────────────────────────
export const dashboardAPI = {
  getOverview: () => api.get('/admin/dashboard'),
};

// ─── User Management APIs (Admin) ──────────────────────────────────────
export const userAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.patch(`/users/${id}/toggle-status`),
  getStats: () => api.get('/users/stats/summary'),
};

export default api;
