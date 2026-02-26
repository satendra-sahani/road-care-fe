// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { brandAPI } from '@/services/api';
import {
  fetchBrandsRequest,
  fetchBrandsSuccess,
  fetchBrandsFailure,
  createBrandRequest,
  createBrandSuccess,
  createBrandFailure,
  updateBrandRequest,
  updateBrandSuccess,
  updateBrandFailure,
  deleteBrandRequest,
  deleteBrandSuccess,
  deleteBrandFailure,
} from '../slices/brandSlice';

function* handleFetchBrands(action: PayloadAction<Record<string, any> | undefined>) {
  try {
    const response: any = yield call(brandAPI.getAll, action.payload);
    yield put(fetchBrandsSuccess({
      data: response.data.data,
      pagination: response.data.pagination,
    }));
  } catch (error: any) {
    yield put(fetchBrandsFailure(error.response?.data?.message || 'Failed to fetch brands'));
  }
}

function* handleCreateBrand(action: PayloadAction<any>) {
  try {
    const response: any = yield call(brandAPI.create, action.payload);
    yield put(createBrandSuccess(response.data.data));
  } catch (error: any) {
    yield put(createBrandFailure(error.response?.data?.message || 'Failed to create brand'));
  }
}

function* handleUpdateBrand(action: PayloadAction<{ id: string; data: any }>) {
  try {
    const response: any = yield call(brandAPI.update, action.payload.id, action.payload.data);
    yield put(updateBrandSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateBrandFailure(error.response?.data?.message || 'Failed to update brand'));
  }
}

function* handleDeleteBrand(action: PayloadAction<string>) {
  try {
    yield call(brandAPI.delete, action.payload);
    yield put(deleteBrandSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteBrandFailure(error.response?.data?.message || 'Failed to delete brand'));
  }
}

export default function* brandSaga() {
  yield takeLatest(fetchBrandsRequest.type, handleFetchBrands);
  yield takeLatest(createBrandRequest.type, handleCreateBrand);
  yield takeLatest(updateBrandRequest.type, handleUpdateBrand);
  yield takeLatest(deleteBrandRequest.type, handleDeleteBrand);
}
