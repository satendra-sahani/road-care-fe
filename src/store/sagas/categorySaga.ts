// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { categoryAPI } from '@/services/api';
import {
  fetchCategoriesRequest,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  fetchParentCategoriesRequest,
  fetchParentCategoriesSuccess,
  fetchParentCategoriesFailure,
  createCategoryRequest,
  createCategorySuccess,
  createCategoryFailure,
  updateCategoryRequest,
  updateCategorySuccess,
  updateCategoryFailure,
  deleteCategoryRequest,
  deleteCategorySuccess,
  deleteCategoryFailure,
  fetchCategoryStatsRequest,
  fetchCategoryStatsSuccess,
  fetchCategoryStatsFailure,
} from '../slices/categorySlice';

function* handleFetchCategories(action: PayloadAction<Record<string, any> | undefined>) {
  try {
    const response: any = yield call(categoryAPI.getAll, action.payload);
    yield put(fetchCategoriesSuccess({
      data: response.data.data,
      pagination: response.data.pagination,
    }));
  } catch (error: any) {
    yield put(fetchCategoriesFailure(error.response?.data?.message || 'Failed to fetch categories'));
  }
}

function* handleFetchParentCategories() {
  try {
    const response: any = yield call(categoryAPI.getParents);
    yield put(fetchParentCategoriesSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchParentCategoriesFailure(error.response?.data?.message || 'Failed to fetch parent categories'));
  }
}

function* handleCreateCategory(action: PayloadAction<any>) {
  try {
    const response: any = yield call(categoryAPI.create, action.payload);
    yield put(createCategorySuccess(response.data.data));
  } catch (error: any) {
    yield put(createCategoryFailure(error.response?.data?.message || 'Failed to create category'));
  }
}

function* handleUpdateCategory(action: PayloadAction<{ id: string; data: any }>) {
  try {
    const response: any = yield call(categoryAPI.update, action.payload.id, action.payload.data);
    yield put(updateCategorySuccess(response.data.data));
  } catch (error: any) {
    yield put(updateCategoryFailure(error.response?.data?.message || 'Failed to update category'));
  }
}

function* handleDeleteCategory(action: PayloadAction<string>) {
  try {
    yield call(categoryAPI.delete, action.payload);
    yield put(deleteCategorySuccess(action.payload));
  } catch (error: any) {
    yield put(deleteCategoryFailure(error.response?.data?.message || 'Failed to delete category'));
  }
}

function* handleFetchCategoryStats() {
  try {
    const response: any = yield call(categoryAPI.getStats);
    yield put(fetchCategoryStatsSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchCategoryStatsFailure(error.response?.data?.message || 'Failed to fetch stats'));
  }
}

export default function* categorySaga() {
  yield takeLatest(fetchCategoriesRequest.type, handleFetchCategories);
  yield takeLatest(fetchParentCategoriesRequest.type, handleFetchParentCategories);
  yield takeLatest(createCategoryRequest.type, handleCreateCategory);
  yield takeLatest(updateCategoryRequest.type, handleUpdateCategory);
  yield takeLatest(deleteCategoryRequest.type, handleDeleteCategory);
  yield takeLatest(fetchCategoryStatsRequest.type, handleFetchCategoryStats);
}
