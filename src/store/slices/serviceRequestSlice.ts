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
  status: 'pending' | 'assigned' | 'accepted' | 'on_way' | 'in_progress' | 'in-progress' | 'completed' | 'cancelled';
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
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
  createdAt: string;
  updatedAt: string;
}

interface ServiceRequestState {
  requests: ServiceRequest[];
  loading: boolean;
  error: string | null;
  selectedRequest: ServiceRequest | null;
}

const initialState: ServiceRequestState = {
  requests: [],
  loading: false,
  error: null,
  selectedRequest: null,
};

const serviceRequestSlice = createSlice({
  name: 'serviceRequest',
  initialState,
  reducers: {
    // Fetch service requests
    fetchServiceRequestsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchServiceRequestsSuccess: (state, action: PayloadAction<ServiceRequest[]>) => {
      state.loading = false;
      state.requests = action.payload;
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