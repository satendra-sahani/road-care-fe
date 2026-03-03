import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CustomerUser {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  location?: any;
  savedAddresses?: any[];
  profileImage?: string;
}

interface CustomerAuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  otpSending: boolean;
  otpSent: boolean;
  otpVerifying: boolean;
  otpVerified: boolean;
  verificationToken: string | null;
  isNewUser: boolean;
  phone: string;
  registering: boolean;
  error: string | null;
}

const initialState: CustomerAuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  otpSending: false,
  otpSent: false,
  otpVerifying: false,
  otpVerified: false,
  verificationToken: null,
  isNewUser: false,
  phone: '',
  registering: false,
  error: null,
};

const customerAuthSlice = createSlice({
  name: 'customerAuth',
  initialState,
  reducers: {
    // Send OTP
    sendOtpRequest(state, action: PayloadAction<string>) {
      state.otpSending = true;
      state.otpSent = false;
      state.phone = action.payload;
      state.error = null;
    },
    sendOtpSuccess(state) {
      state.otpSending = false;
      state.otpSent = true;
    },
    sendOtpFailure(state, action: PayloadAction<string>) {
      state.otpSending = false;
      state.otpSent = false;
      state.error = action.payload;
    },

    // Verify OTP
    verifyOtpRequest(state, action: PayloadAction<{ phone: string; otp: string }>) {
      state.otpVerifying = true;
      state.error = null;
    },
    verifyOtpSuccess(state, action: PayloadAction<{
      token?: string;
      verificationToken?: string;
      isNewUser: boolean;
      user?: CustomerUser;
    }>) {
      state.otpVerifying = false;
      state.otpVerified = true;
      state.isNewUser = action.payload.isNewUser;
      if (action.payload.isNewUser) {
        state.verificationToken = action.payload.verificationToken || null;
      } else {
        state.user = action.payload.user || null;
        state.isAuthenticated = true;
      }
    },
    verifyOtpFailure(state, action: PayloadAction<string>) {
      state.otpVerifying = false;
      state.error = action.payload;
    },

    // Register new user
    registerRequest(state, _action: PayloadAction<{ verificationToken: string; fullName: string; email?: string }>) {
      state.registering = true;
      state.error = null;
    },
    registerSuccess(state, action: PayloadAction<{ token: string; user: CustomerUser }>) {
      state.registering = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    registerFailure(state, action: PayloadAction<string>) {
      state.registering = false;
      state.error = action.payload;
    },

    // Load user profile
    loadUserRequest(state) {
      state.loading = true;
    },
    loadUserSuccess(state, action: PayloadAction<CustomerUser>) {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    loadUserFailure(state) {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
    },

    // Logout
    customerLogout(state) {
      return { ...initialState };
    },

    // Reset OTP flow
    resetOtpFlow(state) {
      state.otpSent = false;
      state.otpVerified = false;
      state.verificationToken = null;
      state.isNewUser = false;
      state.phone = '';
      state.error = null;
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  sendOtpRequest, sendOtpSuccess, sendOtpFailure,
  verifyOtpRequest, verifyOtpSuccess, verifyOtpFailure,
  registerRequest, registerSuccess, registerFailure,
  loadUserRequest, loadUserSuccess, loadUserFailure,
  customerLogout, resetOtpFlow, clearError,
} = customerAuthSlice.actions;

export default customerAuthSlice.reducer;
