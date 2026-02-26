import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProductImage {
  _id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  partNumber?: string;
  description: string;
  category: { _id: string; name: string; slug: string } | string;
  brand: { _id: string; name: string; logo?: string } | string;
  vehicleType: string;
  price: {
    cost: number;
    selling: number;
    mrp: number;
  };
  inventory: {
    quantity: number;
    minStock: number;
    maxStock: number;
    unit: string;
  };
  thumbnail?: { url: string; alt?: string };
  images: ProductImage[];
  compatibility: Array<{
    vehicleBrand: string;
    vehicleModel: string;
    yearFrom?: number;
    yearTo?: number;
  }>;
  specifications?: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  reviewsSummary?: {
    averageRating: number;
    totalReviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductState {
  products: ProductItem[];
  selectedProduct: ProductItem | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  stats: any;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  loading: false,
  actionLoading: false,
  error: null,
  pagination: { current: 1, pages: 1, total: 0, limit: 10 },
  stats: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    // Fetch all
    fetchProductsRequest(state, _action: PayloadAction<Record<string, any> | undefined>) {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess(state, action: PayloadAction<{ data: ProductItem[]; pagination: any }>) {
      state.loading = false;
      state.products = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    fetchProductsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch single
    fetchProductRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    fetchProductSuccess(state, action: PayloadAction<ProductItem>) {
      state.loading = false;
      state.selectedProduct = action.payload;
    },
    fetchProductFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Create
    createProductRequest(state, _action: PayloadAction<any>) {
      state.actionLoading = true;
      state.error = null;
    },
    createProductSuccess(state, action: PayloadAction<ProductItem>) {
      state.actionLoading = false;
      state.products.unshift(action.payload);
      state.pagination.total += 1;
    },
    createProductFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // Update
    updateProductRequest(state, _action: PayloadAction<{ id: string; data: any }>) {
      state.actionLoading = true;
      state.error = null;
    },
    updateProductSuccess(state, action: PayloadAction<ProductItem>) {
      state.actionLoading = false;
      const idx = state.products.findIndex((p) => p._id === action.payload._id);
      if (idx !== -1) state.products[idx] = action.payload;
      if (state.selectedProduct?._id === action.payload._id) {
        state.selectedProduct = action.payload;
      }
    },
    updateProductFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // Delete
    deleteProductRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
      state.error = null;
    },
    deleteProductSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.products = state.products.filter((p) => p._id !== action.payload);
      state.pagination.total -= 1;
    },
    deleteProductFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // Toggle status
    toggleProductStatusRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
    },
    toggleProductStatusSuccess(state, action: PayloadAction<ProductItem>) {
      state.actionLoading = false;
      const idx = state.products.findIndex((p) => p._id === action.payload._id);
      if (idx !== -1) state.products[idx] = action.payload;
    },
    toggleProductStatusFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // Add stock
    addStockRequest(state, _action: PayloadAction<{ id: string; quantity: number }>) {
      state.actionLoading = true;
    },
    addStockSuccess(state, action: PayloadAction<{ productId: string; newQuantity: number }>) {
      state.actionLoading = false;
      const idx = state.products.findIndex((p) => p._id === action.payload.productId);
      if (idx !== -1) {
        state.products[idx].inventory.quantity = action.payload.newQuantity;
      }
    },
    addStockFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // Stats
    fetchProductStatsRequest(state) {
      state.loading = true;
    },
    fetchProductStatsSuccess(state, action: PayloadAction<any>) {
      state.loading = false;
      state.stats = action.payload;
    },
    fetchProductStatsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    setSelectedProduct(state, action: PayloadAction<ProductItem | null>) {
      state.selectedProduct = action.payload;
    },
    clearProductError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchProductsRequest,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductRequest,
  fetchProductSuccess,
  fetchProductFailure,
  createProductRequest,
  createProductSuccess,
  createProductFailure,
  updateProductRequest,
  updateProductSuccess,
  updateProductFailure,
  deleteProductRequest,
  deleteProductSuccess,
  deleteProductFailure,
  toggleProductStatusRequest,
  toggleProductStatusSuccess,
  toggleProductStatusFailure,
  addStockRequest,
  addStockSuccess,
  addStockFailure,
  fetchProductStatsRequest,
  fetchProductStatsSuccess,
  fetchProductStatsFailure,
  setSelectedProduct,
  clearProductError,
} = productSlice.actions;

export default productSlice.reducer;
