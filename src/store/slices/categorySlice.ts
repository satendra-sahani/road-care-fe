import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: { _id: string; name: string } | string | null;
  image?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryState {
  categories: CategoryItem[];
  parentCategories: CategoryItem[];
  selectedCategory: CategoryItem | null;
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

const initialState: CategoryState = {
  categories: [],
  parentCategories: [],
  selectedCategory: null,
  loading: false,
  error: null,
  pagination: { current: 1, pages: 1, total: 0, limit: 50 },
  stats: null,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    // Fetch all
    fetchCategoriesRequest(state, _action: PayloadAction<Record<string, any> | undefined>) {
      state.loading = true;
      state.error = null;
    },
    fetchCategoriesSuccess(state, action: PayloadAction<{ data: CategoryItem[]; pagination: any }>) {
      state.loading = false;
      state.categories = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    fetchCategoriesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch parents
    fetchParentCategoriesRequest(state) {
      state.loading = true;
    },
    fetchParentCategoriesSuccess(state, action: PayloadAction<CategoryItem[]>) {
      state.loading = false;
      state.parentCategories = action.payload;
    },
    fetchParentCategoriesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Create
    createCategoryRequest(state, _action: PayloadAction<any>) {
      state.loading = true;
      state.error = null;
    },
    createCategorySuccess(state, action: PayloadAction<CategoryItem>) {
      state.loading = false;
      state.categories.unshift(action.payload);
      state.pagination.total += 1;
    },
    createCategoryFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Update
    updateCategoryRequest(state, _action: PayloadAction<{ id: string; data: any }>) {
      state.loading = true;
      state.error = null;
    },
    updateCategorySuccess(state, action: PayloadAction<CategoryItem>) {
      state.loading = false;
      const idx = state.categories.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) state.categories[idx] = action.payload;
    },
    updateCategoryFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete
    deleteCategoryRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    deleteCategorySuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.categories = state.categories.filter((c) => c._id !== action.payload);
      state.pagination.total -= 1;
    },
    deleteCategoryFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Stats
    fetchCategoryStatsRequest(state) {
      state.loading = true;
    },
    fetchCategoryStatsSuccess(state, action: PayloadAction<any>) {
      state.loading = false;
      state.stats = action.payload;
    },
    fetchCategoryStatsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    setSelectedCategory(state, action: PayloadAction<CategoryItem | null>) {
      state.selectedCategory = action.payload;
    },
    clearCategoryError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchCategoriesRequest,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  fetchParentCategoriesRequest,
  fetchParentCategoriesSuccess,
  fetchParentCategoriesFailure,
  createCategoryRequest,
  createCategorySuccess,
  createCategoryFailure,
  updateCategoryRequest,
  updateCategorySuccess,
  updateCategoryFailure,
  deleteCategoryRequest,
  deleteCategorySuccess,
  deleteCategoryFailure,
  fetchCategoryStatsRequest,
  fetchCategoryStatsSuccess,
  fetchCategoryStatsFailure,
  setSelectedCategory,
  clearCategoryError,
} = categorySlice.actions;

export default categorySlice.reducer;
