import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import {
  fetchMechanicsRequest,
  fetchMechanicsSuccess,
  fetchMechanicsFailure,
  addMechanicRequest,
  addMechanicSuccess,
  addMechanicFailure,
  updateMechanicRequest,
  updateMechanicSuccess,
  updateMechanicFailure,
  deleteMechanicRequest,
  deleteMechanicSuccess,
  deleteMechanicFailure,
  Mechanic,
} from '../slices/mechanicSlice';

// API base URL — env var already includes /api prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

function getToken(): string {
  return Cookies.get('token') || '';
}

// API functions
const api = {
  fetchMechanics: () =>
    fetch(`${API_BASE_URL}/admin/mechanics`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(response => {
      if (!response.ok) throw new Error('Failed to fetch mechanics');
      return response.json();
    }),

  addMechanic: (mechanicData: Omit<Mechanic, '_id' | 'createdAt' | 'updatedAt'>) =>
    fetch(`${API_BASE_URL}/admin/mechanics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(mechanicData),
    }).then(response => {
      if (!response.ok) throw new Error('Failed to add mechanic');
      return response.json();
    }),

  updateMechanic: (id: string, mechanicData: Partial<Mechanic>) =>
    fetch(`${API_BASE_URL}/admin/mechanics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(mechanicData),
    }).then(response => {
      if (!response.ok) throw new Error('Failed to update mechanic');
      return response.json();
    }),

  deleteMechanic: (id: string) =>
    fetch(`${API_BASE_URL}/admin/mechanics/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(response => {
      if (!response.ok) throw new Error('Failed to delete mechanic');
      return response.json();
    }),
};

// Normalize MechanicProfile (backend) → Mechanic (frontend slice type)
function normalizeMechanic(p: any): Mechanic {
  const addr = p.address || {};
  return {
    _id: p._id,
    name: p.user?.fullName || p.user?.username || p.name || 'Unknown',
    phone: p.phone || '',
    email: p.user?.email || p.email || '',
    aadhaarNo: p.aadhaarNo || '',
    address: addr.street || '',
    city: addr.city || p.city || '',
    state: addr.state || p.state || '',
    pincode: addr.pincode || p.pincode || '',
    specializations: p.specializations || [],
    location: [addr.city, addr.state].filter(Boolean).join(', ') || p.location || '',
    availability: p.availability || 'available',
    experience: p.experience || '',
    joiningDate: p.joiningDate
      ? new Date(p.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    emergencyContact: p.emergencyContact || '',
    notes: p.notes || undefined,
    rating: p.rating ?? 0,
    completedServices: p.completedJobs ?? p.completedServices ?? 0,
    currentLocation: p.currentLocation?.latitude != null && p.currentLocation?.longitude != null
      ? {
          latitude: p.currentLocation.latitude,
          longitude: p.currentLocation.longitude,
          lastUpdated: p.currentLocation.lastUpdated || undefined,
        }
      : undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// Worker Sagas
function* fetchMechanicsSaga() {
  try {
    const response: { success: boolean; data?: any[]; mechanics?: Mechanic[] } = yield call(api.fetchMechanics);
    if (response.success) {
      const raw = response.data ?? response.mechanics ?? [];
      yield put(fetchMechanicsSuccess(raw.map(normalizeMechanic)));
    } else {
      yield put(fetchMechanicsFailure('Failed to fetch mechanics'));
    }
  } catch (error) {
    yield put(fetchMechanicsFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* addMechanicSaga(action: PayloadAction<Omit<Mechanic, '_id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const response: { success: boolean; data?: any; mechanic?: any } = yield call(api.addMechanic, action.payload);
    if (response.success) {
      yield put(addMechanicSuccess(normalizeMechanic(response.data ?? response.mechanic)));
    } else {
      yield put(addMechanicFailure('Failed to add mechanic'));
    }
  } catch (error) {
    yield put(addMechanicFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* updateMechanicSaga(action: PayloadAction<{ id: string; data: Partial<Mechanic> }>) {
  try {
    const response: { success: boolean; data?: any; mechanic?: any } = yield call(
      api.updateMechanic,
      action.payload.id,
      action.payload.data
    );
    if (response.success) {
      yield put(updateMechanicSuccess(normalizeMechanic(response.data ?? response.mechanic)));
    } else {
      yield put(updateMechanicFailure('Failed to update mechanic'));
    }
  } catch (error) {
    yield put(updateMechanicFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* deleteMechanicSaga(action: PayloadAction<string>) {
  try {
    const response: { success: boolean } = yield call(api.deleteMechanic, action.payload);
    if (response.success) {
      yield put(deleteMechanicSuccess(action.payload));
    } else {
      yield put(deleteMechanicFailure('Failed to delete mechanic'));
    }
  } catch (error) {
    yield put(deleteMechanicFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Watcher Saga
export default function* mechanicSaga() {
  yield takeLatest(fetchMechanicsRequest.type, fetchMechanicsSaga);
  yield takeEvery(addMechanicRequest.type, addMechanicSaga);
  yield takeEvery(updateMechanicRequest.type, updateMechanicSaga);
  yield takeEvery(deleteMechanicRequest.type, deleteMechanicSaga);
}