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

function* handleSendOtp(action) {
  try {
    const response = yield call(otpAuthAPI.sendOtp, action.payload);
    if (response.data.success) {
      yield put(sendOtpSuccess());
    } else {
      yield put(sendOtpFailure(response.data.message || 'Failed to send OTP'));
    }
  } catch (error) {
    yield put(sendOtpFailure(error.response?.data?.message || 'Failed to send OTP'));
  }
}

function* handleVerifyOtp(action) {
  try {
    const { phone, otp } = action.payload;
    const response = yield call(otpAuthAPI.verifyOtp, phone, otp);
    const data = response.data;

    if (!data.success) {
      yield put(verifyOtpFailure(data.message || 'OTP verification failed'));
      return;
    }

    // If user exists (login) — data contains token + user
    if (data.data?.token && data.data?.user) {
      Cookies.set('customer_token', data.data.token, { expires: 7 });
      yield put(verifyOtpSuccess({
        isNewUser: false,
        token: data.data.token,
        user: data.data.user,
      }));
    }
    // If new user — data contains verificationToken for registration
    else if (data.data?.verificationToken) {
      yield put(verifyOtpSuccess({
        isNewUser: true,
        verificationToken: data.data.verificationToken,
      }));
    }
    // Fallback
    else {
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
