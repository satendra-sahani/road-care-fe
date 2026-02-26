// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import { authAPI } from '@/services/api';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  checkAuthRequest,
  checkAuthSuccess,
  checkAuthFailure,
} from '../slices/authSlice';

function* handleLogin(action: PayloadAction<{ email: string; password: string; rememberMe?: boolean }>) {
  try {
    const response: any = yield call(authAPI.login, action.payload);
    const { token, user } = response.data.data;

    // Store token in cookie
    Cookies.set('token', token, {
      expires: action.payload.rememberMe ? 30 : 1,
      sameSite: 'strict',
    });

    yield put(loginSuccess({ user, token }));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed. Please try again.';
    yield put(loginFailure(message));
  }
}

function* handleLogout() {
  try {
    yield call(authAPI.logout);
  } catch {
    // Silent fail — we still clear local state
  } finally {
    Cookies.remove('token');
    yield put(logoutSuccess());
  }
}

function* handleCheckAuth() {
  try {
    const token = Cookies.get('token');
    if (!token) {
      yield put(checkAuthFailure());
      return;
    }
    const response: any = yield call(authAPI.getProfile);
    yield put(checkAuthSuccess({ user: response.data.data, token }));
  } catch {
    Cookies.remove('token');
    yield put(checkAuthFailure());
  }
}

export default function* authSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(logoutRequest.type, handleLogout);
  yield takeLatest(checkAuthRequest.type, handleCheckAuth);
}
