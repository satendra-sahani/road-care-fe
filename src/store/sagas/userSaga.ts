// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from '@/services/api';
import {
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
} from '../slices/userSlice';

// ─── Role mapping helpers ────────────────────────────────────────────────────
// Backend stores 'user' but frontend displays 'customer'
const mapRoleFromBackend = (role: string) => role === 'user' ? 'customer' : role;
const mapRoleToBackend = (role: string) => role === 'customer' ? 'user' : role;

const mapUserFromBackend = (user: any) => {
  if (!user) return user;
  return { ...user, role: mapRoleFromBackend(user.role) };
};

function* handleFetchUsers(action: PayloadAction<Record<string, any> | undefined>) {
  try {
    // Map 'customer' role to 'user' for backend query
    const params = action.payload ? { ...action.payload } : undefined;
    if (params?.role === 'customer') {
      params.role = 'user';
    }

    const response: any = yield call(userAPI.getAll, params);
    const rawUsers = response.data.data.users || response.data.data || [];
    const pagination = response.data.data.pagination || response.data.pagination || {};

    // Map 'user' role to 'customer' for frontend display
    const users = Array.isArray(rawUsers)
      ? rawUsers.map(mapUserFromBackend)
      : [];

    yield put(fetchUsersSuccess({ users, pagination }));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch users';
    yield put(fetchUsersFailure(message));
  }
}

function* handleFetchUserById(action: PayloadAction<string>) {
  try {
    const response: any = yield call(userAPI.getById, action.payload);
    const user = response.data.data?.user || response.data.data;
    yield put(fetchUserByIdSuccess(mapUserFromBackend(user)));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch user';
    yield put(fetchUserByIdFailure(message));
  }
}

function* handleCreateUser(action: PayloadAction<any>) {
  try {
    // Map 'customer' role to 'user' before sending to backend
    const payload = { ...action.payload };
    if (payload.role) {
      payload.role = mapRoleToBackend(payload.role);
    }

    const response: any = yield call(userAPI.create, payload);
    const user = response.data.data?.user || response.data.data;
    yield put(createUserSuccess(mapUserFromBackend(user)));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to create user';
    yield put(createUserFailure(message));
  }
}

function* handleUpdateUser(action: PayloadAction<{id: string, data: any}>) {
  try {
    const { id, data } = action.payload;
    // Map 'customer' role to 'user' before sending to backend
    const mappedData = { ...data };
    if (mappedData.role) {
      mappedData.role = mapRoleToBackend(mappedData.role);
    }

    const response: any = yield call(userAPI.update, id, mappedData);
    const user = response.data.data?.user || response.data.data;
    yield put(updateUserSuccess(mapUserFromBackend(user)));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to update user';
    yield put(updateUserFailure(message));
  }
}

function* handleDeleteUser(action: PayloadAction<string>) {
  try {
    yield call(userAPI.delete, action.payload);
    yield put(deleteUserSuccess(action.payload));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to delete user';
    yield put(deleteUserFailure(message));
  }
}

function* handleToggleUserStatus(action: PayloadAction<string>) {
  try {
    const response: any = yield call(userAPI.toggleStatus, action.payload);
    const user = response.data.data?.user || response.data.data;
    yield put(toggleUserStatusSuccess(mapUserFromBackend(user)));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to update user status';
    yield put(toggleUserStatusFailure(message));
  }
}

function* handleFetchUserStats() {
  try {
    const response: any = yield call(userAPI.getStats);
    yield put(fetchUserStatsSuccess(response.data.data));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch user stats';
    yield put(fetchUserStatsFailure(message));
  }
}

export default function* userSaga() {
  yield takeLatest(fetchUsersRequest.type, handleFetchUsers);
  yield takeLatest(fetchUserByIdRequest.type, handleFetchUserById);
  yield takeLatest(createUserRequest.type, handleCreateUser);
  yield takeLatest(updateUserRequest.type, handleUpdateUser);
  yield takeLatest(deleteUserRequest.type, handleDeleteUser);
  yield takeLatest(toggleUserStatusRequest.type, handleToggleUserStatus);
  yield takeLatest(fetchUserStatsRequest.type, handleFetchUserStats);
}
