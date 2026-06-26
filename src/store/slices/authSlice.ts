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
  initialCheckDone: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  // Start `false`: this flag means "an auth op is in flight". Redirect/guard
  // logic is gated on `initialCheckDone`, NOT `loading`, so it doesn't need to
  // start true. Starting it true used to wedge the public /admin/login page
  // (which renders outside AuthGuard, so nothing ever dispatched checkAuth to
  // clear it) — the Sign In button stayed spinning + disabled forever.
  loading: false,
  error: null,
  initialCheckDone: false,
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
      state.initialCheckDone = true;
    },
    checkAuthFailure(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.initialCheckDone = true;
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
