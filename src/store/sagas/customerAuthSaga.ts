// @ts-nocheck
import { call, put, select, takeLatest } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import { otpAuthAPI, userProfileAPI } from '@/services/api';
import { firebaseAuth, firebaseAuthErrorMessage } from '@/services/firebaseAuth';
import {
  sendOtpRequest, sendOtpSuccess, sendOtpFailure,
  verifyOtpRequest, verifyOtpSuccess, verifyOtpFailure,
  registerRequest, registerSuccess, registerFailure,
  loadUserRequest, loadUserSuccess, loadUserFailure,
  customerLogout,
} from '../slices/customerAuthSlice';

// ─── Send OTP (Firebase Phone Auth + legacy fallback) ─────────────────────
// Matches Android: tries Firebase signInWithPhoneNumber first so the SMS is
// sent directly by Google. If Firebase is unconfigured (NEXT_PUBLIC_FIREBASE_*
// env vars missing or apiKey invalid) we fall back to the legacy backend
// /common/auth/send-otp route — which currently uses the dev static OTP
// `123456` since MSG91 is paused. This guarantees the login form keeps
// working in environments where the Web Firebase config hasn't been
// wired up yet, while transparently switching to real Firebase SMS the
// moment those env vars are set.
//
// The provider used is recorded in Redux state so handleVerifyOtp branches
// to the matching verification path.
const FIREBASE_FALLBACK_TO_LEGACY = (err) => {
  const code = err?.code || '';
  const msg = err?.message || '';
  return (
    code === 'auth/api-key-not-valid' ||
    code === 'auth/invalid-api-key' ||
    code === 'auth/configuration-not-found' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/internal-error' ||
    code === 'auth/network-request-failed' ||
    msg.includes('Firebase config is missing') ||
    msg.includes('TODO_WEB_API_KEY') ||
    msg.includes('TODO_WEB_APP_ID')
  );
};

function* handleSendOtp(action) {
  const phone = action.payload;
  // ── Stage 1: try Firebase ───────────────────────────────────────────
  try {
    yield call(firebaseAuth.sendOtp, phone);
    yield put(sendOtpSuccess({ purpose: 'auto', provider: 'firebase' }));
    return;
  } catch (firebaseError) {
    if (!FIREBASE_FALLBACK_TO_LEGACY(firebaseError)) {
      // It's a real user-facing error (invalid number, rate-limited, etc.)
      // — surface it instead of silently falling back.
      yield put(sendOtpFailure(firebaseAuthErrorMessage(firebaseError)));
      return;
    }
    console.warn(
      '[auth] Firebase send-OTP failed (', firebaseError?.code || firebaseError?.message,
      ') — falling back to legacy backend OTP'
    );
  }

  // ── Stage 2: legacy backend OTP (auto-detects login vs registration) ──
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

// ─── Verify OTP (provider-aware: Firebase or legacy) ──────────────────────
// Branches on the provider that handleSendOtp recorded in state. Firebase
// path: confirm with Firebase → exchange ID token at /firebase-signin.
// Legacy path: POST phone+otp to /common/auth/verify-otp directly.
// Both endpoints return the same response shape, so the rest of the saga
// (set cookie, dispatch verifyOtpSuccess) is unchanged.
function* handleVerifyOtp(action) {
  try {
    const { phone, otp, purpose } = action.payload;
    // Read the provider that handleSendOtp stored in state — it tells us
    // whether to verify against Firebase or the legacy backend endpoint.
    const provider = yield select((s) => s.customerAuth.otpProvider);

    let response;
    if (provider === 'legacy') {
      response = yield call(otpAuthAPI.verifyOtp, phone, otp, purpose || 'login');
    } else {
      // Firebase path — confirm with Firebase → mint ID token → exchange
      let idToken;
      try {
        const confirmed = yield call(firebaseAuth.verifyOtp, otp);
        idToken = confirmed.idToken;
      } catch (firebaseError) {
        yield put(verifyOtpFailure(firebaseAuthErrorMessage(firebaseError)));
        return;
      }
      response = yield call(otpAuthAPI.firebaseSignIn, idToken, 'auto');
    }

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
