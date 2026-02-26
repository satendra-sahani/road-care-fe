import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BrandItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  country?: string;
  vehicleTypes?: string[];
  isActive: boolean;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface BrandState {
  brands: BrandItem[];
  selectedBrand: BrandItem | null;
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  stats: any;
}

const initialState: BrandState = {
  brands: [],
  selectedBrand: null,
  loading: false,
  error: null,
  pagination: { current: 1, pages: 1, total: 0, limit: 50 },
  stats: null,
};

const brandSlice = createSlice({
  name: 'brand',
  initialState,
  reducers: {
    fetchBrandsRequest(state, _action: PayloadAction<Record<string, any> | undefined>) {
      state.loading = true;
      state.error = null;
    },
    fetchBrandsSuccess(state, action: PayloadAction<{ data: BrandItem[]; pagination: any }>) {
      state.loading = false;
      state.brands = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    fetchBrandsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    createBrandRequest(state, _action: PayloadAction<any>) {
      state.loading = true;
      state.error = null;
    },
    createBrandSuccess(state, action: PayloadAction<BrandItem>) {
      state.loading = false;
      state.brands.unshift(action.payload);
      state.pagination.total += 1;
    },
    createBrandFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    updateBrandRequest(state, _action: PayloadAction<{ id: string; data: any }>) {
      state.loading = true;
      state.error = null;
    },
    updateBrandSuccess(state, action: PayloadAction<BrandItem>) {
      state.loading = false;
      const idx = state.brands.findIndex((b) => b._id === action.payload._id);
      if (idx !== -1) state.brands[idx] = action.payload;
    },
    updateBrandFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    deleteBrandRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    deleteBrandSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.brands = state.brands.filter((b) => b._id !== action.payload);
      state.pagination.total -= 1;
    },
    deleteBrandFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    setSelectedBrand(state, action: PayloadAction<BrandItem | null>) {
      state.selectedBrand = action.payload;
    },
    clearBrandError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchBrandsRequest,
  fetchBrandsSuccess,
  fetchBrandsFailure,
  createBrandRequest,
  createBrandSuccess,
  createBrandFailure,
  updateBrandRequest,
  updateBrandSuccess,
  updateBrandFailure,
  deleteBrandRequest,
  deleteBrandSuccess,
  deleteBrandFailure,
  setSelectedBrand,
  clearBrandError,
} = brandSlice.actions;

export default brandSlice.reducer;
