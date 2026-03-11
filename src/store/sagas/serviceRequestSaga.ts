import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import {
  fetchServiceRequestsRequest,
  fetchServiceRequestsSuccess,
  fetchServiceRequestsFailure,
  createServiceRequestRequest,
  createServiceRequestSuccess,
  createServiceRequestFailure,
  updateServiceRequestRequest,
  updateServiceRequestSuccess,
  updateServiceRequestFailure,
  assignMechanicRequest,
  assignMechanicSuccess,
  assignMechanicFailure,
  updateStatusRequest,
  updateStatusSuccess,
  updateStatusFailure,
  deleteServiceRequestRequest,
  deleteServiceRequestSuccess,
  deleteServiceRequestFailure,
  ServiceRequest,
} from '../slices/serviceRequestSlice';

// API base URL — env var already includes /api prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

function getToken(): string {
  return Cookies.get('token') || '';
}

// API functions
const api = {
  fetchServiceRequests: () =>
    fetch(`${API_BASE_URL}/admin/service-requests`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(response => {
      if (!response.ok) throw new Error('Failed to fetch service requests');
      return response.json();
    }),

  createServiceRequest: (requestData: Omit<ServiceRequest, '_id' | 'createdAt' | 'updatedAt'>) =>
    fetch(`${API_BASE_URL}/admin/service-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(requestData),
    }).then(response => {
      if (!response.ok) throw new Error('Failed to create service request');
      return response.json();
    }),

  updateServiceRequest: (id: string, requestData: Partial<ServiceRequest>) =>
    fetch(`${API_BASE_URL}/admin/service-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(requestData),
    }).then(response => {
      if (!response.ok) throw new Error('Failed to update service request');
      return response.json();
    }),

  assignMechanic: (requestId: string, mechanicId: string) =>
    fetch(`${API_BASE_URL}/admin/service-requests/${requestId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ mechanicId }),
    }).then(response => {
      if (!response.ok) throw new Error('Failed to assign mechanic');
      return response.json();
    }),

  updateStatus: (id: string, status: ServiceRequest['status']) =>
    fetch(`${API_BASE_URL}/admin/service-requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    }).then(response => {
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    }),

  deleteServiceRequest: (id: string) =>
    fetch(`${API_BASE_URL}/admin/service-requests/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(response => {
      if (!response.ok) throw new Error('Failed to delete service request');
      return response.json();
    }),
};

// Normalize backend ServiceRequest → frontend ServiceRequest slice type
function normalizeStatus(s: string): ServiceRequest['status'] {
  const known: ServiceRequest['status'][] = [
    'pending', 'assigned', 'accepted', 'mechanic_assigned', 'on_way',
    'diagnosis', 'approved', 'rejected_quote',
    'in_progress', 'in-progress',
    'completed', 'payment_pending', 'paid', 'payment_refused',
    'cancelled'
  ];
  if (known.includes(s as ServiceRequest['status'])) return s as ServiceRequest['status'];
  return s as ServiceRequest['status']; // pass through unknown statuses instead of hiding them
}

function normalizeServiceRequest(r: any): ServiceRequest {
  const cust = r.customer || {};
  const mech = r.mechanic;
  return {
    _id: r._id,
    requestId: r.requestId || undefined,
    customer: {
      _id: cust._id || '',
      name: cust.fullName || cust.username || cust.name || '',
      email: cust.email || '',
      phone: cust.phone || '',
    },
    mechanic: mech ? {
      _id: mech._id,
      name: mech.user?.fullName || mech.user?.username || mech.name || '',
      phone: mech.phone || '',
      currentLocation: mech.currentLocation?.latitude != null && mech.currentLocation?.longitude != null
        ? {
            latitude: mech.currentLocation.latitude,
            longitude: mech.currentLocation.longitude,
            lastUpdated: mech.currentLocation.lastUpdated || undefined,
          }
        : undefined,
    } : undefined,
    serviceType: r.serviceCategory || r.serviceType || '',
    description: r.description || '',
    location: r.location || { address: '', city: '', state: '', pincode: '' },
    scheduledDate: r.scheduledDate || r.preferredDate || '',
    scheduledTime: r.preferredTimeSlot || r.scheduledTime || '',
    priority: r.priority || 'medium',
    status: normalizeStatus(r.status),
    estimatedCost: r.estimatedCost ?? 0,
    actualCost: r.totalCost ?? r.actualCost ?? 0,
    notes: r.notes || undefined,
    // Diagnosis fields
    diagnosis: r.diagnosis ? {
      notes: r.diagnosis.notes || undefined,
      photos: r.diagnosis.photos || [],
      costBreakdown: r.diagnosis.costBreakdown ? {
        laborCost: r.diagnosis.costBreakdown.laborCost || 0,
        parts: (r.diagnosis.costBreakdown.parts || []).map((p: any) => ({
          name: p.name || '', cost: p.cost || 0, quantity: p.quantity || 1
        })),
        additionalCharges: r.diagnosis.costBreakdown.additionalCharges || 0,
        discount: r.diagnosis.costBreakdown.discount || 0,
        totalEstimate: r.diagnosis.costBreakdown.totalEstimate || 0,
        bookingFeeAdjusted: r.diagnosis.costBreakdown.bookingFeeAdjusted || 0,
        onlinePaidAmount: r.diagnosis.costBreakdown.onlinePaidAmount || 0,
        amountDue: r.diagnosis.costBreakdown.amountDue ?? undefined,
      } : undefined,
      estimatedTime: r.diagnosis.estimatedTime || undefined,
      diagnosedAt: r.diagnosis.diagnosedAt || undefined,
      diagnosedBy: r.diagnosis.diagnosedBy || undefined,
    } : undefined,
    // Customer approval
    customerApproval: r.customerApproval ? {
      status: r.customerApproval.status || 'pending',
      approvedAt: r.customerApproval.approvedAt || undefined,
      rejectedAt: r.customerApproval.rejectedAt || undefined,
      rejectionReason: r.customerApproval.rejectionReason || undefined,
    } : undefined,
    // Cost fields
    finalCost: r.finalCost ?? undefined,
    totalCost: r.totalCost ?? undefined,
    laborCost: r.laborCost ?? undefined,
    partsCost: r.partsCost ?? undefined,
    // Booking fee
    bookingFee: r.bookingFee ?? undefined,
    bookingFeeStatus: r.bookingFeeStatus || undefined,
    // Payment
    cashCollected: r.cashCollected || false,
    paymentDetails: r.paymentDetails ? {
      method: r.paymentDetails.method || 'cod',
      paidAt: r.paymentDetails.paidAt || undefined,
      totalPaid: r.paymentDetails.totalPaid || undefined,
    } : undefined,
    // Advance fee
    advanceFee: r.advanceFee?.required ? {
      required: r.advanceFee.required,
      amount: r.advanceFee.amount || 0,
      status: r.advanceFee.status || 'not_required',
      paymentId: r.advanceFee.paymentId || undefined,
      paidAt: r.advanceFee.paidAt || undefined,
      feeType: r.advanceFee.feeType || undefined,
    } : undefined,
    // Payment refusal
    paymentRefusal: r.paymentRefusal?.refused ? {
      refused: true,
      reason: r.paymentRefusal.reason || '',
      refusedAt: r.paymentRefusal.refusedAt || undefined,
      reportedBy: r.paymentRefusal.reportedBy || undefined,
      photoProof: r.paymentRefusal.photoProof || [],
    } : undefined,
    // Images (pass through full structure for detail view)
    images: r.images ? {
      before: (r.images.before || []).map((i: any) => typeof i === 'string' ? { url: i } : { url: i.url, description: i.description }),
      after: (r.images.after || []).map((i: any) => typeof i === 'string' ? { url: i } : { url: i.url, description: i.description }),
    } : undefined,
    // Shop partner
    shopPartner: r.shopPartner ? {
      _id: r.shopPartner._id || '',
      shopName: r.shopPartner.shopName || '',
      city: r.shopPartner.city || undefined,
      commissionRate: r.shopPartner.commissionRate ?? undefined,
    } : undefined,
    // Prefer populated ServiceFeedback doc; fall back to legacy customerRating fields
    feedback: r.feedback?.overallRating
      ? {
          rating: r.feedback.overallRating,
          comment: r.feedback.review?.comment || r.feedback.review?.title || '',
          createdAt: r.feedback.createdAt || r.updatedAt,
          ratings: r.feedback.ratings || undefined,
          wouldRecommend: r.feedback.wouldRecommend ?? undefined,
          liked: r.feedback.serviceAspects?.liked || [],
          needsImprovement: r.feedback.serviceAspects?.needsImprovement || [],
        }
      : r.customerRating
      ? { rating: r.customerRating, comment: r.customerReview || '', createdAt: r.updatedAt }
      : undefined,
    timeline: (r.timeline || []).map((t: any) => ({
      status: t.status || '',
      timestamp: t.timestamp || t.changedAt || '',
      note: t.note || undefined,
    })),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// Worker Sagas
function* fetchServiceRequestsSaga() {
  try {
    const response: { success: boolean; data?: any[]; serviceRequests?: any[] } = yield call(api.fetchServiceRequests);
    if (response.success) {
      const raw = response.data ?? response.serviceRequests ?? [];
      yield put(fetchServiceRequestsSuccess(raw.map(normalizeServiceRequest)));
    } else {
      yield put(fetchServiceRequestsFailure('Failed to fetch service requests'));
    }
  } catch (error) {
    yield put(fetchServiceRequestsFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* createServiceRequestSaga(action: PayloadAction<Omit<ServiceRequest, '_id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const response: { success: boolean; data?: any; serviceRequest?: any } = yield call(api.createServiceRequest, action.payload);
    if (response.success) {
      yield put(createServiceRequestSuccess(normalizeServiceRequest(response.data ?? response.serviceRequest)));
    } else {
      yield put(createServiceRequestFailure('Failed to create service request'));
    }
  } catch (error) {
    yield put(createServiceRequestFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* updateServiceRequestSaga(action: PayloadAction<{ id: string; data: Partial<ServiceRequest> }>) {
  try {
    const response: { success: boolean; data?: any; serviceRequest?: any } = yield call(
      api.updateServiceRequest,
      action.payload.id,
      action.payload.data
    );
    if (response.success) {
      yield put(updateServiceRequestSuccess(normalizeServiceRequest(response.data ?? response.serviceRequest)));
    } else {
      yield put(updateServiceRequestFailure('Failed to update service request'));
    }
  } catch (error) {
    yield put(updateServiceRequestFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* assignMechanicSaga(action: PayloadAction<{ requestId: string; mechanicId: string }>) {
  try {
    const response: { success: boolean; data?: any; serviceRequest?: any } = yield call(
      api.assignMechanic,
      action.payload.requestId,
      action.payload.mechanicId
    );
    if (response.success) {
      yield put(assignMechanicSuccess(normalizeServiceRequest(response.data ?? response.serviceRequest)));
    } else {
      yield put(assignMechanicFailure('Failed to assign mechanic'));
    }
  } catch (error) {
    yield put(assignMechanicFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* updateStatusSaga(action: PayloadAction<{ id: string; status: ServiceRequest['status'] }>) {
  try {
    const response: { success: boolean; data?: any; serviceRequest?: any } = yield call(
      api.updateStatus,
      action.payload.id,
      action.payload.status
    );
    if (response.success) {
      yield put(updateStatusSuccess(normalizeServiceRequest(response.data ?? response.serviceRequest)));
    } else {
      yield put(updateStatusFailure('Failed to update status'));
    }
  } catch (error) {
    yield put(updateStatusFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function* deleteServiceRequestSaga(action: PayloadAction<string>) {
  try {
    const response: { success: boolean } = yield call(api.deleteServiceRequest, action.payload);
    if (response.success) {
      yield put(deleteServiceRequestSuccess(action.payload));
    } else {
      yield put(deleteServiceRequestFailure('Failed to delete service request'));
    }
  } catch (error) {
    yield put(deleteServiceRequestFailure(error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Watcher Saga
export default function* serviceRequestSaga() {
  yield takeLatest(fetchServiceRequestsRequest.type, fetchServiceRequestsSaga);
  yield takeEvery(createServiceRequestRequest.type, createServiceRequestSaga);
  yield takeEvery(updateServiceRequestRequest.type, updateServiceRequestSaga);
  yield takeEvery(assignMechanicRequest.type, assignMechanicSaga);
  yield takeEvery(updateStatusRequest.type, updateStatusSaga);
  yield takeEvery(deleteServiceRequestRequest.type, deleteServiceRequestSaga);
}