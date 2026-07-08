import axios from 'axios';
import Cookies from 'js-cookie';

// Resolve the API base URL, with a mixed-content guard. When the page is served
// over HTTPS (e.g. testing SecureContact voice calls on a phone — the mic needs
// a secure context) but the configured API is plain HTTP, the browser would
// block those calls as "mixed content". In that one case we route through the
// same-origin Next.js proxy (/proxy-api, see next.config rewrites) so every
// request stays secure and same-origin. Every other scenario is unchanged.
function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configured.startsWith('http://')
  ) {
    return '/proxy-api';
  }
  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token, chosen by the area of the app we're in.
// IMPORTANT: don't blindly prefer the admin `token` cookie. If a user logged into
// /admin earlier, that cookie lingers — and on the customer site it would make every
// request authenticate as the admin (header shows the admin, profile/phone are the
// admin's, bookings get created as admin). So: admin/shop-partner/dashboard routes use
// the admin `token`; everywhere else (the customer storefront) uses `customer_token`.
api.interceptors.request.use(
  (config) => {
    const adminToken = Cookies.get('token');
    const customerToken = Cookies.get('customer_token');
    let token: string | undefined;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAdminArea = path.startsWith('/admin') || path.startsWith('/shop-partner')
        || path.startsWith('/shop-dashboard');
      token = isAdminArea ? adminToken : customerToken;
    } else {
      // SSR / non-browser: prefer customer token (storefront is the default surface)
      token = customerToken || adminToken;
    }
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
        } else if (window.location.pathname.startsWith('/shop-partner')) {
          Cookies.remove('token');
          window.location.href = '/shop-partner/login';
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
  // Phone-OTP login (used by the shop-partner portal — mobile number only).
  sendOtp: (phone: string, purpose: 'login' | 'registration' = 'login') =>
    api.post('/common/auth/send-otp', { phone, purpose }),
  verifyOtp: (phone: string, otp: string, purpose: 'login' | 'registration' = 'login') =>
    api.post('/common/auth/verify-otp', { phone, otp, purpose }),
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
  // Upload as ANY authenticated user (e.g. a shop-partner uploading KYC docs) —
  // the admin upload route requires an admin role, this one only auth.
  uploadImageAny: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return api.post('/common/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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
  togglePublished: (id: string, published?: boolean) => api.put(`/admin/products/${id}/toggle-published`, { published }),
  addStock: (id: string, data: { quantity: number }) =>
    api.put(`/admin/products/${id}/add-stock`, data),
  addImages: (id: string, data: { images: string[] }) =>
    api.post(`/admin/products/${id}/images`, data),
  setThumbnail: (id: string, data: { url: string }) =>
    api.put(`/admin/products/${id}/thumbnail`, data),
  removeImage: (id: string, imageId: string) =>
    api.delete(`/admin/products/${id}/images/${imageId}`),
  getStats: () => api.get('/admin/products/stats'),
  // Bulk import (CSV parsed client-side → JSON rows) + export + bulk ops
  importRows: (rows: any[]) => api.post('/admin/products/import', { rows }),
  exportAll: () => api.get('/admin/products/export'),
  bulkUpdate: (productIds: string[], updateData: any) =>
    api.put('/admin/products/bulk/update', { productIds, updateData }),
  bulkDelete: (productIds: string[]) =>
    api.delete('/admin/products/bulk/delete', { data: { productIds } }),
};

// ─── Shared live-location (public — recipient view) ──────────────────
export const shareAPI = {
  meta: (token: string) => api.get(`/common/share/${token}`),
  requestOtp: (token: string, name: string, phone: string) =>
    api.post(`/common/share/${token}/otp`, { name, phone }),
  verify: (token: string, name: string, phone: string, otp: string) =>
    api.post(`/common/share/${token}/verify`, { name, phone, otp }),
  location: (token: string, at: string) =>
    api.get(`/common/share/${token}/location`, { params: { at } }),
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

// ─── Plan Pricing APIs (memberships / GPS hardware / add-ons) ─────────
export const planPricingAPI = {
  getAll: (planType?: string) =>
    api.get('/admin/pricing-plans', { params: planType ? { planType } : {} }),
  create: (data: Record<string, any>) =>
    api.post('/admin/pricing-plans', data),
  update: (id: string, data: Record<string, any>) =>
    api.put(`/admin/pricing-plans/${id}`, data),
  remove: (id: string) =>
    api.delete(`/admin/pricing-plans/${id}`),
  seedDefaults: () =>
    api.post('/admin/pricing-plans/seed-defaults'),
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
  // Legacy backend OTP (MSG91) — kept for the registerUser endpoint, which
  // the Firebase flow also uses to complete signup once the phone is verified.
  sendOtp: (phone: string, purpose?: string) =>
    api.post('/common/auth/send-otp', { phone, purpose: purpose || 'login' }),
  verifyOtp: (phone: string, otp: string, purpose?: string) =>
    api.post('/common/auth/verify-otp', { phone, otp, purpose: purpose || 'login' }),
  registerUser: (data: { verificationToken: string; fullName: string; email?: string; address?: string; landmark?: string; city?: string; state?: string; pincode?: string; latitude?: number; longitude?: number }) =>
    api.post('/common/auth/register/user', data),
  phoneLogin: (phone: string) =>
    api.post('/common/auth/phone-login', { phone }),

  // Firebase Phone Auth — current default (matches Android). The web
  // client gets a Firebase ID token via signInWithPhoneNumber + reCAPTCHA,
  // then posts it here. Backend verifies with firebase-admin and either
  // logs the user in or returns a verificationToken for registration.
  firebaseSignIn: (idToken: string, purpose: 'login' | 'registration' | 'auto' = 'auto') =>
    api.post('/common/auth/firebase-signin', { idToken, purpose }),
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

// ─── Partner applications (public lead capture) ──────────────────────
export const partnerAPI = {
  apply: (data: any) => api.post('/common/partner-applications', data),
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

// ─── Public Plan Pricing APIs ────────────────────────────────────────
export const publicPlansAPI = {
  getPlans: (planType?: string, vehicleType?: string) =>
    api.get('/common/plans', { params: { ...(planType ? { planType } : {}), ...(vehicleType ? { vehicleType } : {}) } }),
};

// ─── User Membership APIs (BM Care subscription) ─────────────────────
export const userMembershipAPI = {
  getMine: () => api.get('/user/membership'),
  subscribe: (planKey: string, cycle: 'mo' | 'yr') =>
    api.post('/user/membership/subscribe', { planKey, cycle }),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/user/membership/verify', data),
  cancel: () => api.post('/user/membership/cancel'),
};

// ─── User Spin & Win APIs ────────────────────────────────────────────
export const userSpinAPI = {
  getWheel: () => api.get('/user/spin/wheel'),
  spin: () => api.post('/user/spin', {}),
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/user/spin/history', { params }),
};

// ─── User Referral APIs ──────────────────────────────────────────────
export const userReferralAPI = {
  getMine: () => api.get('/user/referral/me'),
  getList: (params?: { page?: number; limit?: number }) =>
    api.get('/user/referral/list', { params }),
};

// ─── User Vehicle QR APIs (SecureContact) ────────────────────────────
export const userVehicleQrAPI = {
  getMine: () => api.get('/user/vehicle-qr'),
  register: (data: { name: string; em?: string; plate: string }) =>
    api.post('/user/vehicle-qr', data),
  update: (id: string, data: { name?: string; em?: string; plate?: string; isActive?: boolean }) =>
    api.put(`/user/vehicle-qr/${id}`, data),
  remove: (id: string) => api.delete(`/user/vehicle-qr/${id}`),
  message: (code: string, message: string) =>
    api.post('/user/vehicle-qr/message', { code, message }),
  // Public resolve — no auth needed (works for logged-out scanners)
  resolvePublic: (code: string) => api.get(`/common/vehicle-qr/${encodeURIComponent(code)}`),
};

// ─── User Calling APIs (SecureContact + service/order calls) ─────────────────
export const userCallAPI = {
  callVehicleOwner: (code: string, callType: 'audio' | 'video' = 'audio') =>
    api.post('/user/calls/vehicle-owner', { code, callType }),
  join: (callId: string) => api.post(`/user/calls/${callId}/join`),
  getStatus: (callId: string) => api.get(`/user/calls/${callId}/status`),
  updateStatus: (callId: string, status: string, duration = 0) =>
    api.put(`/user/calls/${callId}/status`, { status, duration }),
};

// ─── Support APIs (Help & Support — chat + call, any authenticated role) ──────
// Hits /common/support, so customers AND shop-partners can use it. Auth is the
// area-appropriate cookie (customer_token on the storefront, token on /shop-*).
export const supportAPI = {
  getThread: () => api.get('/common/support'),
  sendMessage: (text: string) => api.post('/common/support/message', { text }),
  call: (callType: 'audio' | 'video' = 'audio') => api.post('/common/support/call', { callType }),
  getCallStatus: (callId: string) => api.get(`/common/support/calls/${callId}/status`),
  updateCallStatus: (callId: string, status: string, duration = 0) =>
    api.put(`/common/support/calls/${callId}/status`, { status, duration }),
};

// ─── Admin Support APIs (Help & Support tickets + answering support calls) ────
export const adminSupportAPI = {
  getTickets: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/support/tickets', { params }),
  getTicket: (id: string) => api.get(`/admin/support/tickets/${id}`),
  reply: (id: string, text: string) => api.post(`/admin/support/tickets/${id}/reply`, { text }),
  updateTicket: (id: string, data: { status?: string; priority?: string; assignedTo?: string | null }) =>
    api.put(`/admin/support/tickets/${id}`, data),
  // Answering an in-app support call
  answerCall: (callId: string) => api.post(`/admin/support/calls/${callId}/answer`),
  getCallStatus: (callId: string) => api.get(`/admin/support/calls/${callId}/status`),
  updateCallStatus: (callId: string, status: string, duration = 0) =>
    api.put(`/admin/support/calls/${callId}/status`, { status, duration }),
};

// ─── Guest Calling APIs (no account — scanner calls a vehicle owner) ──────────
// The guest token rides in X-Guest-Token so it never clashes with a customer
// Authorization header.
const guestHeaders = (guestToken: string) => ({ headers: { 'X-Guest-Token': guestToken } });
export const guestCallAPI = {
  sendOtp: (phone: string) => api.post('/common/guest/send-otp', { phone }),
  verifyOtp: (phone: string, name: string, otp: string) =>
    api.post('/common/guest/verify-otp', { phone, name, otp }),
  // When a QR-calling fee is set, the first call returns { requiresPayment,
  // fee, data.razorpay }; retry with the payment proof to connect. Free calls
  // (no fee) connect on the first call with no payment.
  call: (
    code: string,
    callType: 'audio' | 'video',
    guestToken: string,
    payment?: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) =>
    api.post('/common/guest/vehicle-owner/call', { code, callType, ...(payment || {}) }, guestHeaders(guestToken)),
  getStatus: (callId: string, guestToken: string) =>
    api.get(`/common/guest/calls/${callId}/status`, guestHeaders(guestToken)),
  updateStatus: (callId: string, status: string, duration: number, guestToken: string) =>
    api.post(`/common/guest/calls/${callId}/status`, { status, duration }, guestHeaders(guestToken)),
};

// ─── User Wallet APIs (Customer-facing) ─────────────────────────────
export const userWalletAPI = {
  getWallet: () => api.get('/user/wallet'),
  getTransactions: (params?: { page?: number; limit?: number; type?: string; category?: string }) =>
    api.get('/user/wallet/transactions', { params }),
  requestWithdrawal: (payload: {
    amount: number;
    method: 'upi' | 'bank';
    upiId?: string;
    bankDetails?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName?: string;
    };
  }) => api.post('/user/wallet/withdraw', payload),
  getWithdrawals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/user/wallet/withdrawals', { params }),
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

// ─── Admin Memberships (BM Care subscriptions) ──────────────────────
export const adminMembershipsAPI = {
  getAll: (params?: { status?: string; planKey?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/memberships', { params }),
  update: (id: string, data: { status?: string; extendDays?: number }) =>
    api.put(`/admin/memberships/${id}`, data),
};

// ─── Admin Coupons ──────────────────────────────────────────────────
export const adminCouponsAPI = {
  getAll: (params?: { search?: string; status?: string }) =>
    api.get('/admin/coupons', { params }),
  create: (data: any) => api.post('/admin/coupons', data),
  update: (id: string, data: any) => api.put(`/admin/coupons/${id}`, data),
  remove: (id: string) => api.delete(`/admin/coupons/${id}`),
};

// ─── Admin GPS Tracker devices/subscriptions ────────────────────────
export const adminTrackerAPI = {
  getDevices: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/tracker/devices', { params }),
  getDevice: (id: string) => api.get(`/admin/tracker/devices/${id}`),
  update: (id: string, data: { status?: string; extendDays?: number }) =>
    api.put(`/admin/tracker/devices/${id}`, data),

  // Customer vehicles + GPS provisioning
  getVehicles: (params?: { status?: string; search?: string; limit?: number }) =>
    api.get('/admin/vehicles', { params }),
  provisionVehicle: (
    id: string,
    data: { deviceId?: string; status?: string; simLocked?: boolean; simActivated?: boolean; note?: string },
  ) => api.put(`/admin/vehicles/${id}`, data),
  setUserPlan: (
    userId: string,
    data: { planKey?: string; vehicleLimit?: number; cycle?: string; active?: boolean; renewsAt?: string },
  ) => api.put(`/admin/vehicles/plan/${userId}`, data),
};

// ─── Shop Partner APIs ──────────────────────────────────────────────
export const shopAPI = {
  // Dashboard
  getDashboard: () => api.get('/shop/dashboard'),

  // Profile
  getProfile: () => api.get('/shop/profile'),
  updateProfile: (data: any) => api.put('/shop/profile', data),

  // Orders
  getOrders: (params?: Record<string, any>) => api.get('/shop/orders', { params }),
  getOrderById: (id: string) => api.get(`/shop/orders/${id}`),
  acceptOrder: (id: string) => api.put(`/shop/orders/${id}/accept`),
  rejectOrder: (id: string, reason: string) => api.put(`/shop/orders/${id}/reject`, { reason }),
  assignMechanic: (id: string, data: { name?: string; phone?: string; mechanicProfileId?: string }) =>
    api.put(`/shop/orders/${id}/assign-mechanic`, data),
  updateOrderStatus: (id: string, status: string, notes?: string) =>
    api.put(`/shop/orders/${id}/status`, { status, notes }),
  updateOrderCost: (id: string, data: { laborCost?: number; partsCost?: number }) =>
    api.put(`/shop/orders/${id}/cost`, data),

  // Mechanics (manual / shop employees)
  addMechanic: (data: { name: string; phone: string; specialization?: string }) =>
    api.post('/shop/mechanics', data),
  updateMechanic: (id: string, data: any) => api.put(`/shop/mechanics/${id}`, data),
  removeMechanic: (id: string) => api.delete(`/shop/mechanics/${id}`),

  // Assigned platform mechanics (assigned by admin)
  getAssignedMechanics: () => api.get('/shop/assigned-mechanics'),
  // Assigned mechanic's last-known GPS (seeds the live map before socket updates)
  mechanicLocation: (mechanicId: string) => api.get(`/shop/mechanics/${mechanicId}/location`),

  // In-app voice call to the customer (Agora) — shop → customer
  callCustomer: (serviceRequestId: string, callType: 'audio' | 'video' = 'audio') =>
    api.post('/shop/calls/customer', { serviceRequestId, callType }),
  // In-app voice call to the assigned platform mechanic (Agora) — shop → mechanic
  callMechanic: (serviceRequestId: string, callType: 'audio' | 'video' = 'audio') =>
    api.post('/shop/calls/mechanic', { serviceRequestId, callType }),
  getCallStatus: (callId: string) => api.get(`/shop/calls/${callId}/status`),
  updateCallStatus: (callId: string, status: string, duration = 0) =>
    api.put(`/shop/calls/${callId}/status`, { status, duration }),

  // Settlements
  getSettlements: (params?: Record<string, any>) => api.get('/shop/settlements', { params }),

  // KYC
  submitKyc: (data: any) => api.post('/shop/kyc', data),

  // Wallet (balance + ₹2000 minimum + Razorpay top-up)
  getWallet: () => api.get('/shop/wallet'),
  getWalletTransactions: (params?: Record<string, any>) => api.get('/shop/wallet/transactions', { params }),
  createTopupOrder: (amount: number) => api.post('/shop/wallet/topup/order', { amount }),
  // Withdraw wallet balance (optional UPI/bank payout details)
  requestWithdrawal: (payload: { amount: number; method?: 'upi' | 'bank'; upiId?: string; bankDetails?: { accountNumber?: string; ifscCode?: string; accountHolderName?: string; bankName?: string } }) =>
    api.post('/shop/withdrawals', payload),
  getWithdrawals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/shop/withdrawals', { params }),
  verifyTopup: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/shop/wallet/topup/verify', data),
};

// ─── Admin Shop Management APIs ─────────────────────────────────────
export const adminShopAPI = {
  getAll: (params?: Record<string, any>) => api.get('/admin/shops', { params }),
  getStats: () => api.get('/admin/shops/stats'),
  getById: (id: string) => api.get(`/admin/shops/${id}`),
  create: (data: { ownerData: any; shopData: any }) => api.post('/admin/shops', data),
  verify: (id: string) => api.put(`/admin/shops/${id}/verify`),
  rejectKyc: (id: string, reason: string) =>
    api.put(`/admin/shops/${id}/reject-kyc`, { reason }),
  updateKyc: (id: string, data: any) => api.put(`/admin/shops/${id}/kyc`, data),
  toggleStatus: (id: string) => api.put(`/admin/shops/${id}/toggle-status`),
  updateCommission: (id: string, commissionRate: number) =>
    api.put(`/admin/shops/${id}/commission`, { commissionRate }),
  assignOrder: (serviceRequestId: string, shopId: string) =>
    api.post('/admin/shops/assign-order', { serviceRequestId, shopId }),
  settle: (id: string) => api.post(`/admin/shops/${id}/settle`),
  getOrders: (id: string, params?: Record<string, any>) =>
    api.get(`/admin/shops/${id}/orders`, { params }),

  // Mechanic assignment to shops
  getAvailableMechanics: (search?: string) =>
    api.get('/admin/shops/available-mechanics', { params: { search } }),
  getShopMechanics: (shopId: string) =>
    api.get(`/admin/shops/${shopId}/mechanics`),
  assignMechanicToShop: (shopId: string, mechanicProfileId: string) =>
    api.post(`/admin/shops/${shopId}/assign-mechanic`, { mechanicProfileId }),
  unassignMechanicFromShop: (shopId: string, mechanicId: string) =>
    api.delete(`/admin/shops/${shopId}/unassign-mechanic/${mechanicId}`),
};

// ─── App Config APIs ─────────────────────────────────────────────────
export const configAPI = {
  // Public config (for customer app)
  getPublicConfig: () => api.get('/common/config'),
  // Admin config
  getConfig: () => api.get('/admin/config'),
  updateConfig: (data: any) => api.put('/admin/config', data),
};

// ─── Customer Management APIs (Admin) ────────────────────────────────
export const customerManagementAPI = {
  getAll: (params?: Record<string, any>) => api.get('/admin/customers', { params }),
  getById: (id: string) => api.get(`/admin/customers/${id}`),
  block: (id: string, reason: string, blockType?: string, days?: number) =>
    api.post(`/admin/customers/${id}/block`, { reason, blockType, days }),
  unblock: (id: string, reason?: string) => api.post(`/admin/customers/${id}/unblock`, { reason }),
  warn: (id: string, message: string) => api.post(`/admin/customers/${id}/warn`, { message }),
  forceAdvance: (id: string, amount?: number, reason?: string) =>
    api.post(`/admin/customers/${id}/force-advance`, { amount, reason }),
  addNote: (id: string, note: string) => api.post(`/admin/customers/${id}/note`, { note }),
  adjustTrustScore: (id: string, score: number) => api.put(`/admin/customers/${id}/trust-score`, { score }),
};

// ─── Diagnosis / Pricing APIs ────────────────────────────────────────
export const diagnosisAPI = {
  // User (customer) endpoints
  getDiagnosis: (requestId: string) => api.get(`/user/service-requests/${requestId}/diagnosis`),
  approve: (requestId: string) => api.post(`/user/service-requests/${requestId}/approve`),
  reject: (requestId: string, reason?: string) => api.post(`/user/service-requests/${requestId}/reject-quote`, { reason }),
  // Admin endpoints
  markAsPaid: (requestId: string) => api.post(`/admin/service-requests/${requestId}/mark-paid`),
};

// ─── Mechanic Location API (Customer-facing) ───────────────────────
export const mechanicLocationAPI = {
  get: (requestId: string) =>
    api.get(`/user/service-requests/${requestId}/mechanic-location`),
};

// ─── Delivery Location API (Customer-facing) ───────────────────────
export const deliveryLocationAPI = {
  get: (orderId: string) =>
    api.get(`/user/orders/${orderId}/delivery-location`),
};

// ─── Growth: Spin & Win (Admin) ────────────────────────────────────
export const spinConfigAPI = {
  list: () => api.get('/admin/spin/configs'),
  getActive: () => api.get('/admin/spin/active'),
  create: (data: any) => api.post('/admin/spin/configs', data),
  update: (id: string, data: any) => api.put(`/admin/spin/configs/${id}`, data),
  activate: (id: string) => api.post(`/admin/spin/configs/${id}/activate`),
  delete: (id: string) => api.delete(`/admin/spin/configs/${id}`),
  analytics: (days?: number) => api.get('/admin/spin/analytics', { params: { days } }),
  // Bonus spin grants
  searchUsers: (search: string) =>
    api.get('/admin/spin/users/search', { params: { search } }),
  grantSpins: (userId: string, spins: number, reason?: string) =>
    api.post('/admin/spin/grant', { userId, spins, reason }),
  listGrants: (params?: any) => api.get('/admin/spin/grants', { params }),
  // Per-user spin-outcome restriction (influencer/demo rigging)
  setRestriction: (payload: {
    userId: string;
    enabled: boolean;
    isInfluencer?: boolean;
    reason?: string;
  }) => api.post('/admin/spin/restriction', payload),
  listRestrictions: (params?: any) =>
    api.get('/admin/spin/restrictions', { params }),
};

// ─── Growth: Referrals (Admin) ────────────────────────────────────
export const referralAdminAPI = {
  list: (params?: any) => api.get('/admin/referrals', { params }),
  analytics: (days?: number) => api.get('/admin/referrals/analytics', { params: { days } }),
  reject: (id: string, reason?: string) => api.post(`/admin/referrals/${id}/reject`, { reason }),
};

// ─── Growth: User Rewards Wallet (Admin) ──────────────────────────
export const rewardsWalletAPI = {
  transactions: (params?: any) => api.get('/admin/wallet/transactions', { params }),
  getByUser: (userId: string) => api.get(`/admin/wallet/${userId}`),
  adjust: (userId: string, amount: number, description?: string) =>
    api.post(`/admin/wallet/${userId}/adjust`, { amount, description }),
  statsOverview: () => api.get('/admin/wallet/stats/overview'),
};

export default api;
