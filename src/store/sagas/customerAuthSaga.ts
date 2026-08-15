// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import { otpAuthAPI, userProfileAPI } from '@/services/api';
import {
  sendOtpRequest, sendOtpSuccess, sendOtpFailure,
  verifyOtpRequest, verifyOtpSuccess, verifyOtpFailure,
  registerRequest, registerSuccess, registerFailure,
  loadUserRequest, loadUserSuccess, loadUserFailure,
  customerLogout,
} from '../slices/customerAuthSlice';

// ─── Send OTP (Hanu SMS OTP via backend) ──────────────────────────────────
// The SMS is sent by the backend /common/auth/send-otp route (Hanu SMS
// gateway). It auto-detects login vs registration so new users can sign up:
// we first try 'login', and if the number isn't registered we retry as
// 'registration'.
function* handleSendOtp(action) {
  const phone = action.payload;
  try {
    let response;
    let purpose = 'login';
    try {
      response = yield call(otpAuthAPI.sendOtp, phone, 'login');
    } catch (loginErr) {
      // If "user not registered" — retry as registration so new users can sign up.
      const m = loginErr?.response?.data?.message || loginErr?.message || '';
      if (/not registered|not found|user.*not/i.test(m)) {
        purpose = 'registration';
        response = yield call(otpAuthAPI.sendOtp, phone, 'registration');
      } else {
        throw loginErr;
      }
    }
    const data = response.data;
    if (!data.success) {
      yield put(sendOtpFailure(data.message || 'Failed to send OTP'));
      return;
    }
    yield put(sendOtpSuccess({ purpose: data.data?.purpose || purpose, provider: 'legacy' }));
  } catch (error) {
    yield put(sendOtpFailure(error.response?.data?.message || error.message || 'Failed to send OTP'));
  }
}

// ─── Verify OTP (Hanu SMS OTP via backend) ────────────────────────────────
// POST phone+otp to /common/auth/verify-otp. Returns either an existing
// user (token + user) or a verificationToken for new-user registration.
function* handleVerifyOtp(action) {
  try {
    const { phone, otp, purpose } = action.payload;
    const response = yield call(otpAuthAPI.verifyOtp, phone, otp, purpose || 'login');

    const data = response.data;

    if (!data.success) {
      yield put(verifyOtpFailure(data.message || 'Sign-in failed'));
      return;
    }

    // Existing user → token + user
    if (data.data?.token && data.data?.user) {
      Cookies.set('customer_token', data.data.token, { expires: 7 });
      yield put(verifyOtpSuccess({
        isNewUser: false,
        token: data.data.token,
        user: data.data.user,
      }));
    }
    // New user → verificationToken to complete registration
    else if (data.data?.verificationToken) {
      yield put(verifyOtpSuccess({
        isNewUser: true,
        verificationToken: data.data.verificationToken,
      }));
    } else {
      yield put(verifyOtpFailure('Unexpected response from server'));
    }
  } catch (error) {
    yield put(verifyOtpFailure(error.response?.data?.message || 'OTP verification failed'));
  }
}

function* handleRegister(action) {
  try {
    const response = yield call(otpAuthAPI.registerUser, action.payload);
    const data = response.data;

    if (!data.success) {
      yield put(registerFailure(data.message || 'Registration failed'));
      return;
    }

    if (data.data?.token) {
      Cookies.set('customer_token', data.data.token, { expires: 7 });
    }
    yield put(registerSuccess({
      token: data.data.token,
      user: data.data.user,
    }));
  } catch (error) {
    yield put(registerFailure(error.response?.data?.message || 'Registration failed'));
  }
}

function* handleLoadUser() {
  try {
    const token = Cookies.get('customer_token');
    if (!token) {
      yield put(loadUserFailure());
      return;
    }
    const response = yield call(userProfileAPI.get);
    if (response.data.success) {
      yield put(loadUserSuccess(response.data.data));
    } else {
      yield put(loadUserFailure());
    }
  } catch (error) {
    Cookies.remove('customer_token');
    yield put(loadUserFailure());
  }
}

function* handleLogout() {
  Cookies.remove('customer_token');
}

export default function* customerAuthSaga() {
  yield takeLatest(sendOtpRequest.type, handleSendOtp);
  yield takeLatest(verifyOtpRequest.type, handleVerifyOtp);
  yield takeLatest(registerRequest.type, handleRegister);
  yield takeLatest(loadUserRequest.type, handleLoadUser);
  yield takeLatest(customerLogout.type, handleLogout);
}
