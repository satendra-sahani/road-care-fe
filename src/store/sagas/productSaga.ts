// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { productAPI } from '@/services/api';
import {
  fetchProductsRequest,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductRequest,
  fetchProductSuccess,
  fetchProductFailure,
  createProductRequest,
  createProductSuccess,
  createProductFailure,
  updateProductRequest,
  updateProductSuccess,
  updateProductFailure,
  deleteProductRequest,
  deleteProductSuccess,
  deleteProductFailure,
  toggleProductStatusRequest,
  toggleProductStatusSuccess,
  toggleProductStatusFailure,
  addStockRequest,
  addStockSuccess,
  addStockFailure,
  fetchProductStatsRequest,
  fetchProductStatsSuccess,
  fetchProductStatsFailure,
} from '../slices/productSlice';

function* handleFetchProducts(action: PayloadAction<Record<string, any> | undefined>) {
  try {
    const response: any = yield call(productAPI.getAll, action.payload);
    yield put(fetchProductsSuccess({
      data: response.data.data,
      pagination: response.data.pagination,
    }));
  } catch (error: any) {
    yield put(fetchProductsFailure(error.response?.data?.message || 'Failed to fetch products'));
  }
}

function* handleFetchProduct(action: PayloadAction<string>) {
  try {
    const response: any = yield call(productAPI.getById, action.payload);
    yield put(fetchProductSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchProductFailure(error.response?.data?.message || 'Failed to fetch product'));
  }
}

function* handleCreateProduct(action: PayloadAction<any>) {
  try {
    const response: any = yield call(productAPI.create, action.payload);
    yield put(createProductSuccess(response.data.data));
  } catch (error: any) {
    yield put(createProductFailure(error.response?.data?.message || 'Failed to create product'));
  }
}

function* handleUpdateProduct(action: PayloadAction<{ id: string; data: any }>) {
  try {
    const response: any = yield call(productAPI.update, action.payload.id, action.payload.data);
    yield put(updateProductSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateProductFailure(error.response?.data?.message || 'Failed to update product'));
  }
}

function* handleDeleteProduct(action: PayloadAction<string>) {
  try {
    yield call(productAPI.delete, action.payload);
    yield put(deleteProductSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteProductFailure(error.response?.data?.message || 'Failed to delete product'));
  }
}

function* handleToggleProductStatus(action: PayloadAction<string>) {
  try {
    const response: any = yield call(productAPI.toggleStatus, action.payload);
    yield put(toggleProductStatusSuccess(response.data.data));
  } catch (error: any) {
    yield put(toggleProductStatusFailure(error.response?.data?.message || 'Failed to toggle status'));
  }
}

function* handleAddStock(action: PayloadAction<{ id: string; quantity: number }>) {
  try {
    const response: any = yield call(productAPI.addStock, action.payload.id, { quantity: action.payload.quantity });
    yield put(addStockSuccess({
      productId: action.payload.id,
      newQuantity: response.data.data.newQuantity,
    }));
  } catch (error: any) {
    yield put(addStockFailure(error.response?.data?.message || 'Failed to add stock'));
  }
}

function* handleFetchProductStats() {
  try {
    const response: any = yield call(productAPI.getStats);
    yield put(fetchProductStatsSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchProductStatsFailure(error.response?.data?.message || 'Failed to fetch stats'));
  }
}

export default function* productSaga() {
  yield takeLatest(fetchProductsRequest.type, handleFetchProducts);
  yield takeLatest(fetchProductRequest.type, handleFetchProduct);
  yield takeLatest(createProductRequest.type, handleCreateProduct);
  yield takeLatest(updateProductRequest.type, handleUpdateProduct);
  yield takeLatest(deleteProductRequest.type, handleDeleteProduct);
  yield takeLatest(toggleProductStatusRequest.type, handleToggleProductStatus);
  yield takeLatest(addStockRequest.type, handleAddStock);
  yield takeLatest(fetchProductStatsRequest.type, handleFetchProductStats);
}
