import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff' | 'customer' | 'mechanic' | 'delivery';
  isActive: boolean;
  profileImage?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  // Additional fields for different user types
  totalOrders?: number;
  totalSpent?: number;
  rating?: number;
  location?: string;
  vehicles?: any[];
  // Mechanic specific
  totalJobs?: number;
  earnings?: number;
  specializations?: string[];
  // Delivery specific
  deliveries?: number;
  zones?: string[];
}

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    roles: {
      admin: number;
      manager: number;
      staff: number;
      customer: number;
      mechanic: number;
      delivery: number;
    };
    recentUsers: number;
  };
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  },
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    roles: {
      admin: 0,
      manager: 0,
      staff: 0,
      customer: 0,
      mechanic: 0,
      delivery: 0,
    },
    recentUsers: 0,
  },
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Fetch Users
    fetchUsersRequest(state, _action: PayloadAction<Record<string, any> | undefined>) {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess(state, action: PayloadAction<{users: User[], pagination: any}>) {
      state.loading = false;
      state.users = action.payload.users;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchUsersFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch User by ID
    fetchUserByIdRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    fetchUserByIdSuccess(state, action: PayloadAction<User>) {
      state.loading = false;
      state.currentUser = action.payload;
      state.error = null;
    },
    fetchUserByIdFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Create User
    createUserRequest(state, _action: PayloadAction<Partial<User>>) {
      state.loading = true;
      state.error = null;
    },
    createUserSuccess(state, action: PayloadAction<User>) {
      state.loading = false;
      state.users.unshift(action.payload);
      state.error = null;
    },
    createUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Update User
    updateUserRequest(state, _action: PayloadAction<{id: string, data: Partial<User>}>) {
      state.loading = true;
      state.error = null;
    },
    updateUserSuccess(state, action: PayloadAction<User>) {
      state.loading = false;
      const index = state.users.findIndex(user => user._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.currentUser?._id === action.payload._id) {
        state.currentUser = action.payload;
      }
      state.error = null;
    },
    updateUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete User
    deleteUserRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.users = state.users.filter(user => user._id !== action.payload);
      if (state.currentUser?._id === action.payload) {
        state.currentUser = null;
      }
      state.error = null;
    },
    deleteUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Toggle User Status
    toggleUserStatusRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    toggleUserStatusSuccess(state, action: PayloadAction<User>) {
      state.loading = false;
      const index = state.users.findIndex(user => user._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.currentUser?._id === action.payload._id) {
        state.currentUser = action.payload;
      }
      state.error = null;
    },
    toggleUserStatusFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch User Stats
    fetchUserStatsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserStatsSuccess(state, action: PayloadAction<UserState['stats']>) {
      state.loading = false;
      state.stats = action.payload;
      state.error = null;
    },
    fetchUserStatsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Clear Error
    clearUserError(state) {
      state.error = null;
    },

    // Clear Current User
    clearCurrentUser(state) {
      state.currentUser = null;
    },
  },
});

export const {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure,
  fetchUserByIdRequest,
  fetchUserByIdSuccess,
  fetchUserByIdFailure,
  createUserRequest,
  createUserSuccess,
  createUserFailure,
  updateUserRequest,
  updateUserSuccess,
  updateUserFailure,
  deleteUserRequest,
  deleteUserSuccess,
  deleteUserFailure,
  toggleUserStatusRequest,
  toggleUserStatusSuccess,
  toggleUserStatusFailure,
  fetchUserStatsRequest,
  fetchUserStatsSuccess,
  fetchUserStatsFailure,
  clearUserError,
  clearCurrentUser,
} = userSlice.actions;

export default userSlice.reducer;