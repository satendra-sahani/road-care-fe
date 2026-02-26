import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  profileImage?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Triggers
    loginRequest(state, _action: PayloadAction<{ email: string; password: string; rememberMe?: boolean }>) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logoutRequest(state) {
      state.loading = true;
    },
    logoutSuccess(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
    checkAuthRequest(state) {
      state.loading = true;
    },
    checkAuthSuccess(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    checkAuthFailure(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  checkAuthRequest,
  checkAuthSuccess,
  checkAuthFailure,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
