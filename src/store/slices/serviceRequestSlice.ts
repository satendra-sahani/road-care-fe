import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ServiceRequest {
  _id: string;
  requestId?: string;          // e.g. SRV-2024-0001 from backend
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  mechanic?: {
    _id: string;
    name: string;
    phone: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
      lastUpdated?: string;
    };
  };
  serviceType: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  scheduledDate: string;
  scheduledTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'normal' | 'critical';
  status: 'pending' | 'assigned' | 'accepted' | 'mechanic_assigned' | 'on_way' | 'diagnosis' | 'approved' | 'rejected_quote' | 'in_progress' | 'in-progress' | 'completed' | 'payment_pending' | 'paid' | 'payment_refused' | 'cancelled';
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  // Diagnosis fields
  diagnosis?: {
    notes?: string;
    photos?: string[];
    costBreakdown?: {
      laborCost: number;
      parts: Array<{ name: string; cost: number; quantity: number; warranty?: string }>;
      additionalCharges: number;
      discount: number;
      totalEstimate: number;
      bookingFeeAdjusted?: number;
      onlinePaidAmount?: number;
      amountDue?: number;
    };
    estimatedTime?: string;
    serviceWarranty?: string;
    revisions?: Array<{
      revisedAt: string;
      revisedBy: 'mechanic' | 'admin';
      reason?: string;
      previousStatus?: string;
      previousTotal: number;
      newTotal: number;
      outcome: 'pending' | 'approved' | 'declined';
      declineReason?: string;
    }>;
    diagnosedAt?: string;
    diagnosedBy?: string;
  };
  customerApproval?: {
    status: 'pending' | 'approved' | 'rejected' | 'negotiating';
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
  };
  finalCost?: number;
  bookingFee?: number;
  bookingFeeStatus?: string;
  cashCollected?: boolean;
  paymentDetails?: {
    method: 'cod' | 'online';
    paidAt?: string;
    totalPaid?: number;
  };
  advanceFee?: {
    required: boolean;
    amount: number;
    status: 'not_required' | 'pending' | 'paid' | 'refunded' | 'forfeited';
    paymentId?: string;
    paidAt?: string;
    feeType?: string;
  };
  paymentRefusal?: {
    refused: boolean;
    reason: string;
    refusedAt?: string;
    reportedBy?: string;
    photoProof?: string[];
  };
  totalCost?: number;
  laborCost?: number;
  partsCost?: number;
  images?: {
    before: Array<{ url: string; description?: string }>;
    after: Array<{ url: string; description?: string }>;
  };
  feedback?: {
    rating: number;
    comment: string;
    createdAt: string;
    // Detailed ratings from ServiceFeedback collection
    ratings?: {
      workQuality?: number;
      punctuality?: number;
      communication?: number;
      professionalism?: number;
      valueForMoney?: number;
    };
    wouldRecommend?: boolean;
    liked?: string[];
    needsImprovement?: string[];
  };
  timeline?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  shopPartner?: {
    _id: string;
    shopName: string;
    city?: string;
    phone?: string;
    commissionRate?: number;
  };
  /** live ShopOrder when the request is routed to a partner shop */
  shopOrder?: {
    _id: string;
    orderId?: string;
    status: 'pending' | 'accepted' | 'mechanic_assigned' | 'on_way' | 'in_progress' | 'completed' | 'paid' | string;
    paymentStatus?: string;
    assignedMechanic?: { name?: string; phone?: string } | null;
    mechanicProfile?: string | null;
    laborCost?: number;
    partsCost?: number;
    finalCost?: number;
    estimatedCost?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestPagination { page: number; limit: number; total: number; pages: number }

interface ServiceRequestState {
  requests: ServiceRequest[];
  loading: boolean;
  error: string | null;
  selectedRequest: ServiceRequest | null;
  pagination: ServiceRequestPagination;
  /** last list query (page / filters) — reused by refresh dispatches without a payload */
  lastQuery: Record<string, any> | null;
}

const initialState: ServiceRequestState = {
  requests: [],
  loading: false,
  error: null,
  selectedRequest: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  lastQuery: null,
};

const serviceRequestSlice = createSlice({
  name: 'serviceRequest',
  initialState,
  reducers: {
    // Fetch service requests
    fetchServiceRequestsRequest: (state, action: PayloadAction<Record<string, any> | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) state.lastQuery = action.payload;
    },
    fetchServiceRequestsSuccess: (state, action: PayloadAction<ServiceRequest[] | { requests: ServiceRequest[]; pagination?: ServiceRequestPagination }>) => {
      state.loading = false;
      const p = action.payload;
      if (Array.isArray(p)) {
        state.requests = p;
      } else {
        state.requests = p.requests;
        if (p.pagination) state.pagination = p.pagination;
      }
    },
    fetchServiceRequestsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create service request
    createServiceRequestRequest: (state, action: PayloadAction<Omit<ServiceRequest, '_id' | 'createdAt' | 'updatedAt'>>) => {
      state.loading = true;
      state.error = null;
    },
    createServiceRequestSuccess: (state, action: PayloadAction<ServiceRequest>) => {
      state.loading = false;
      state.requests.unshift(action.payload);
    },
    createServiceRequestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update service request
    updateServiceRequestRequest: (state, action: PayloadAction<{ id: string; data: Partial<ServiceRequest> }>) => {
      state.loading = true;
      state.error = null;
    },
    updateServiceRequestSuccess: (state, action: PayloadAction<ServiceRequest>) => {
      state.loading = false;
      const index = state.requests.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
      if (state.selectedRequest?._id === action.payload._id) {
        state.selectedRequest = action.payload;
      }
    },
    updateServiceRequestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Assign mechanic to request
    assignMechanicRequest: (state, action: PayloadAction<{ requestId: string; mechanicId: string }>) => {
      state.loading = true;
      state.error = null;
    },
    assignMechanicSuccess: (state, action: PayloadAction<ServiceRequest>) => {
      state.loading = false;
      const index = state.requests.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
      if (state.selectedRequest?._id === action.payload._id) {
        state.selectedRequest = action.payload;
      }
    },
    assignMechanicFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update status
    updateStatusRequest: (state, action: PayloadAction<{ id: string; status: ServiceRequest['status'] }>) => {
      state.loading = true;
      state.error = null;
    },
    updateStatusSuccess: (state, action: PayloadAction<ServiceRequest>) => {
      state.loading = false;
      const index = state.requests.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
      if (state.selectedRequest?._id === action.payload._id) {
        state.selectedRequest = action.payload;
      }
    },
    updateStatusFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete service request
    deleteServiceRequestRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteServiceRequestSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.requests = state.requests.filter(r => r._id !== action.payload);
      if (state.selectedRequest?._id === action.payload) {
        state.selectedRequest = null;
      }
    },
    deleteServiceRequestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Select service request
    setSelectedRequest: (state, action: PayloadAction<ServiceRequest | null>) => {
      state.selectedRequest = action.payload;
    },

    // Clear error
    clearServiceRequestError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  setSelectedRequest,
  clearServiceRequestError,
} = serviceRequestSlice.actions;

export default serviceRequestSlice.reducer;