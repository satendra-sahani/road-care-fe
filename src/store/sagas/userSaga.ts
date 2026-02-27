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

function* handleFetchUsers(action: PayloadAction<Record<string, any> | undefined>) {
  try {
    const response: any = yield call(userAPI.getAll, action.payload);
    yield put(fetchUsersSuccess({
      users: response.data.data.users,
      pagination: response.data.data.pagination
    }));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch users';
    yield put(fetchUsersFailure(message));
  }
}

function* handleFetchUserById(action: PayloadAction<string>) {
  try {
    const response: any = yield call(userAPI.getById, action.payload);
    yield put(fetchUserByIdSuccess(response.data.data.user));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch user';
    yield put(fetchUserByIdFailure(message));
  }
}

function* handleCreateUser(action: PayloadAction<any>) {
  try {
    const response: any = yield call(userAPI.create, action.payload);
    yield put(createUserSuccess(response.data.data.user));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to create user';
    yield put(createUserFailure(message));
  }
}

function* handleUpdateUser(action: PayloadAction<{id: string, data: any}>) {
  try {
    const { id, data } = action.payload;
    const response: any = yield call(userAPI.update, id, data);
    yield put(updateUserSuccess(response.data.data.user));
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
    yield put(toggleUserStatusSuccess(response.data.data.user));
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