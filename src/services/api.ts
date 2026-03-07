import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token (admin or customer)
api.interceptors.request.use(
  (config) => {
    const adminToken = Cookies.get('token');
    const customerToken = Cookies.get('customer_token');
    const token = adminToken || customerToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 redirect (context-aware: admin vs customer)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        if (window.location.pathname.startsWith('/admin')) {
          Cookies.remove('token');
          window.location.href = '/admin/login';
        } else {
          Cookies.remove('customer_token');
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
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

// ─── Banner APIs ─────────────────────────────────────────────────────
export const bannerAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/banners', { params }),
  create: (data: any) => api.post('/admin/banners', data),
  update: (id: string, data: any) => api.put(`/admin/banners/${id}`, data),
  toggle: (id: string) => api.put(`/admin/banners/${id}/toggle`),
  reorder: (banners: { id: string; order: number }[]) =>
    api.put('/admin/banners/reorder', { banners }),
  delete: (id: string) => api.delete(`/admin/banners/${id}`),
  // Public endpoint - no auth required
  getActive: (platform?: string) =>
    api.get('/common/banners', { params: platform ? { platform } : {} }),
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
  create: (data: any) => api.post('/admin/service-requests', data),
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
  downloadInvoice: (id: string) => api.get(`/admin/service-requests/${id}/invoice`, { responseType: 'blob' }),
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

// ─── Issue Pricing APIs (Admin) ──────────────────────────────────────
type VehicleTypeKey = 'bike' | 'car' | 'scooter' | 'auto'

export const issuePricingAPI = {
  getAll: () =>
    api.get('/admin/service-pricing'),
  getByVehicle: (vehicleType: VehicleTypeKey) =>
    api.get(`/admin/service-pricing/${vehicleType}`),
  updateVehicle: (vehicleType: VehicleTypeKey, data: Record<string, any>) =>
    api.put(`/admin/service-pricing/${vehicleType}`, data),
  updateIssue: (
    vehicleType: VehicleTypeKey,
    issueId: string,
    data: { estimatedPrice?: number; isActive?: boolean; label?: string }
  ) => api.patch(`/admin/service-pricing/${vehicleType}/issues/${issueId}`, data),
  addIssue: (
    vehicleType: VehicleTypeKey,
    data: { id: string; label: string; estimatedPrice: number; icon?: string }
  ) => api.post(`/admin/service-pricing/${vehicleType}/issues`, data),
  deleteIssue: (vehicleType: VehicleTypeKey, issueId: string) =>
    api.delete(`/admin/service-pricing/${vehicleType}/issues/${issueId}`),

  // ── Emergency Services ──────────────────────────────────────────────
  addEmergencyService: (
    vehicleType: VehicleTypeKey,
    data: { id: string; label: string; price: number; description?: string; estimatedTime?: string; urgencyLevel?: 'high' | 'medium'; icon?: string }
  ) => api.post(`/admin/service-pricing/${vehicleType}/emergency-services`, data),
  updateEmergencyService: (
    vehicleType: VehicleTypeKey,
    serviceId: string,
    data: { label?: string; price?: number; description?: string; estimatedTime?: string; urgencyLevel?: 'high' | 'medium'; icon?: string; isActive?: boolean }
  ) => api.patch(`/admin/service-pricing/${vehicleType}/emergency-services/${serviceId}`, data),
  deleteEmergencyService: (vehicleType: VehicleTypeKey, serviceId: string) =>
    api.delete(`/admin/service-pricing/${vehicleType}/emergency-services/${serviceId}`),
};

// ─── Order Management APIs ───────────────────────────────────────────
export const orderAPI = {
  getAll: (params?: any) => api.get('/admin/orders', { params }),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  getStats: () => api.get('/admin/orders/stats'),
  updateStatus: (id: string, data: { status: string; note?: string }) => api.put(`/admin/orders/${id}/status`, data),
  assignDelivery: (id: string, deliveryBoyId: string) => api.put(`/admin/orders/${id}/assign-delivery`, { deliveryBoyId }),
  getDeliveryBoys: () => api.get('/admin/orders/delivery-boys'),
  create: (formData: FormData) => api.post('/admin/orders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  searchCustomers: (q: string) => api.get('/admin/orders/search-customers', { params: { q } }),
  searchProducts: (q: string) => api.get('/common/products', { params: { search: q, inStock: true, limit: 10 } }),
  downloadInvoice: (id: string) => api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' }),
};

// ─── Payment Management APIs ────────────────────────────────────────
export const paymentAPI = {
  getStats: (params?: any) => api.get('/admin/payments/stats', { params }),
  getWallets: (params?: any) => api.get('/admin/payments/wallets', { params }),
  getWalletByUser: (userId: string) => api.get(`/admin/payments/wallets/${userId}`),
  getTransactions: (params?: any) => api.get('/admin/payments/transactions', { params }),
  getUserTransactions: (userId: string, params?: any) => api.get(`/admin/payments/transactions/${userId}`, { params }),
  transfer: (data: { userId: string; amount: number; description?: string }) => api.post('/admin/payments/transfer', data),
  debit: (data: { userId: string; amount: number; description?: string; category?: string }) => api.post('/admin/payments/debit', data),
  transferToWallet: (paymentId: string, data: { percentage: number }) => api.post(`/admin/payments/transfer-to-wallet/${paymentId}`, data),
  getTransferHistory: (params?: any) => api.get('/admin/payments/transfer-history', { params }),

  // Withdrawal management
  getWithdrawals: (params?: any) => api.get('/admin/payments/withdrawals', { params }),
  getWithdrawalStats: () => api.get('/admin/payments/withdrawals/stats'),
  processWithdrawal: (id: string, formData: FormData) =>
    api.put(`/admin/payments/withdrawals/${id}/process`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  rejectWithdrawal: (id: string, data: { reason: string }) =>
    api.put(`/admin/payments/withdrawals/${id}/reject`, data),

  // Pricing config (GST, service charge, commissions)
  getPricing: () => api.get('/admin/payments/pricing'),
  updatePricing: (data: Record<string, number>) => api.put('/admin/payments/pricing', data),
};

// ─── Dashboard API ──────────────────────────────────────────────────
export const dashboardAPI = {
  getOverview: () => api.get('/admin/dashboard'),
};

// ─── Analytics API ──────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview: (params?: { period?: string }) => api.get('/admin/analytics/overview', { params }),
};

// ─── Financial API ──────────────────────────────────────────────────
export const financialAPI = {
  getStats: () => api.get('/admin/financial/stats'),
  getTransactions: (params?: any) => api.get('/admin/financial/transactions', { params }),
  getCommissions: () => api.get('/admin/financial/commissions'),
};

// ─── Purchase Ledger API ────────────────────────────────────────────
export const purchaseLedgerAPI = {
  getAll: (params?: Record<string, any>) => api.get('/admin/purchases', { params }),
  getById: (id: string) => api.get(`/admin/purchases/${id}`),
  getStats: () => api.get('/admin/purchases/stats'),
  create: (data: any) => api.post('/admin/purchases', data),
  update: (id: string, data: any) => api.put(`/admin/purchases/${id}`, data),
  markAsPaid: (id: string) => api.put(`/admin/purchases/${id}/mark-paid`),
  delete: (id: string) => api.delete(`/admin/purchases/${id}`),
};

// ─── User Cart APIs (Customer-facing) ────────────────────────────────
export const userCartAPI = {
  get: () => api.get('/user/cart'),
  add: (productId: string, quantity?: number) => api.post('/user/cart/add', { productId, quantity: quantity || 1 }),
  update: (productId: string, quantity: number) => api.put('/user/cart/update', { productId, quantity }),
  remove: (productId: string) => api.delete(`/user/cart/remove/${productId}`),
  clear: () => api.delete('/user/cart/clear'),
};

// ─── User Order APIs (Customer-facing) ──────────────────────────────
export const userOrderAPI = {
  place: (data: any) => api.post('/user/orders/place', data),
  buyNow: (data: any) => api.post('/user/orders/buy-now', data),
  getAll: (params?: any) => api.get('/user/orders', { params }),
  getById: (id: string) => api.get(`/user/orders/${id}`),
  cancel: (id: string, reason?: string) => api.put(`/user/orders/${id}/cancel`, { reason }),
  track: (id: string) => api.get(`/user/orders/${id}/track`),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/user/orders/verify-payment', data),
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

// ─── OTP Auth APIs (Customer Phone Login) ─────────────────────────────
export const otpAuthAPI = {
  sendOtp: (phone: string, purpose?: string) =>
    api.post('/common/auth/send-otp', { phone, purpose: purpose || 'login' }),
  verifyOtp: (phone: string, otp: string, purpose?: string) =>
    api.post('/common/auth/verify-otp', { phone, otp, purpose: purpose || 'login' }),
  registerUser: (data: { verificationToken: string; fullName: string; email?: string; address?: string; city?: string; state?: string; pincode?: string }) =>
    api.post('/common/auth/register/user', data),
  phoneLogin: (phone: string) =>
    api.post('/common/auth/phone-login', { phone }),
};

// ─── Public Catalog APIs (for user-facing pages) ─────────────────────
export const catalogAPI = {
  getProducts: (params?: Record<string, any>) => api.get('/common/products', { params }),
  getProduct: (id: string) => api.get(`/common/products/${id}`),
  getProductsByCategory: (categoryId: string, params?: Record<string, any>) => api.get(`/common/products/category/${categoryId}`, { params }),
  getProductsByBrand: (brandId: string, params?: Record<string, any>) => api.get(`/common/products/brand/${brandId}`, { params }),
  getCategories: () => api.get('/common/categories'),
  getParentCategories: () => api.get('/common/categories/parent'),
  getSubcategories: (id: string) => api.get(`/common/categories/${id}/subcategories`),
  getBrands: () => api.get('/common/brands'),
  getReviews: (productId: string, params?: Record<string, any>) => api.get(`/common/products/${productId}/reviews`, { params }),
  addReview: (productId: string, data: { rating: number; title?: string; comment?: string }) => api.post(`/common/products/${productId}/reviews`, data),
  search: (q: string, params?: Record<string, any>) => api.get('/common/search', { params: { q, ...params } }),
};

// ─── User Profile APIs (Customer-facing) ──────────────────────────────
export const userProfileAPI = {
  get: () => api.get('/common/auth/profile'),
  update: (data: any) => api.put('/common/auth/profile', data),
};

// ─── User Address APIs (Customer-facing) ──────────────────────────────
export const userAddressAPI = {
  getAll: () => api.get('/user/addresses'),
  add: (data: any) => api.post('/user/addresses', data),
  update: (id: string, data: any) => api.put(`/user/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/user/addresses/${id}`),
  setDefault: (id: string) => api.patch(`/user/addresses/${id}/default`),
};

// ─── User Service Request APIs (Customer-facing) ─────────────────────
export const userServiceAPI = {
  create: (data: any) => api.post('/user/service-requests', data),
  getMyRequests: (params?: Record<string, any>) => api.get('/user/service-requests', { params }),
  getById: (id: string) => api.get(`/user/service-requests/${id}`),
  cancel: (id: string, reason?: string) => api.put(`/user/service-requests/${id}/cancel`, { reason }),
  reschedule: (id: string, data: { preferredDate: string; preferredTimeSlot?: string }) => api.put(`/user/service-requests/${id}/reschedule`, data),
  addReview: (id: string, data: { rating: number; review?: string }) => api.post(`/user/service-requests/${id}/review`, data),
};

// ─── Public Service Pricing APIs ──────────────────────────────────────
export const servicePricingAPI = {
  getAll: () => api.get('/common/service-pricing'),
  getByVehicle: (vehicleType: string) => api.get(`/common/service-pricing/${vehicleType}`),
};

// ─── User Review APIs (Customer-facing) ───────────────────────────────
export const userReviewAPI = {
  getMyReviews: () => api.get('/user/reviews'),
  update: (reviewId: string, data: any) => api.put(`/common/reviews/${reviewId}`, data),
  delete: (reviewId: string) => api.delete(`/common/reviews/${reviewId}`),
};

// ─── Notification APIs (Admin) ──────────────────────────────────────
export const notificationAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/notifications', { params }),
  getById: (id: string) => api.get(`/admin/notifications/${id}`),
  getStats: () => api.get('/admin/notifications/stats'),
  create: (data: any) => api.post('/admin/notifications', data),
  update: (id: string, data: any) => api.put(`/admin/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/admin/notifications/${id}`),
  send: (id: string) => api.post(`/admin/notifications/${id}/send`),
  processScheduled: () => api.post('/admin/notifications/process-scheduled'),
  // Search users for 'specific' target audience
  searchUsers: (q: string) => api.get('/users', { params: { search: q, limit: 20 } }),
  // Media library — reuse previously uploaded logos/banners
  getMedia: (type?: 'logo' | 'banner') =>
    api.get('/admin/notifications/media', { params: type ? { type } : {} }),
  saveMedia: (data: { url: string; type: 'logo' | 'banner'; name?: string }) =>
    api.post('/admin/notifications/media', data),
  deleteMedia: (id: string) => api.delete(`/admin/notifications/media/${id}`),
};

// ─── User Payment APIs (Customer-facing) ─────────────────────────────
export const userPaymentAPI = {
  createOrder: (serviceRequestId: string, amount: number) =>
    api.post('/payments/create-order', { serviceRequestId, amount }),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/payments/verify', data),
  createCOD: (serviceRequestId: string, amount: number) =>
    api.post('/payments/cod', { serviceRequestId, amount }),
  calculateFare: (distanceKm: number, isEmergency?: boolean, vehicleType?: string) =>
    api.get('/payments/calculate-fare', { params: { distanceKm, isEmergency, vehicleType } }),
  getPricing: () => api.get('/payments/pricing'),
  getIssuePricing: (vehicleType?: string) =>
    vehicleType ? api.get(`/common/service-pricing/${vehicleType}`) : api.get('/common/service-pricing'),
};

// ─── User Wallet APIs (Customer-facing) ─────────────────────────────
export const userWalletAPI = {
  getWallet: () => api.get('/user/wallet'),
  getTransactions: (params?: { page?: number; limit?: number; type?: string; category?: string }) =>
    api.get('/user/wallet/transactions', { params }),
};

// ─── User Notification APIs (Customer-facing) ───────────────────────
export const userNotificationAPI = {
  getAll: (params?: { page?: number; limit?: number }) => api.get('/common/notifications', { params }),
  getUnreadCount: () => api.get('/common/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/common/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/common/notifications/read-all'),
};

// ─── Admin Call Logs APIs ────────────────────────────────────────────
export const adminCallLogsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/admin/calls', { params }),
  getStats: () => api.get('/admin/calls/stats'),
  getById: (id: string) => api.get(`/admin/calls/${id}`),
};

export default api;
