import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Mechanic {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  aadhaarNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  specializations: string[];
  location: string;
  availability: 'available' | 'busy' | 'offline';
  experience: string;
  joiningDate: string;
  emergencyContact: string;
  notes?: string;
  rating?: number;
  completedServices?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MechanicState {
  mechanics: Mechanic[];
  loading: boolean;
  error: string | null;
  selectedMechanic: Mechanic | null;
}

const initialState: MechanicState = {
  mechanics: [],
  loading: false,
  error: null,
  selectedMechanic: null,
};

const mechanicSlice = createSlice({
  name: 'mechanic',
  initialState,
  reducers: {
    // Fetch mechanics
    fetchMechanicsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMechanicsSuccess: (state, action: PayloadAction<Mechanic[]>) => {
      state.loading = false;
      state.mechanics = action.payload;
    },
    fetchMechanicsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Add mechanic
    addMechanicRequest: (state, action: PayloadAction<Omit<Mechanic, '_id' | 'createdAt' | 'updatedAt'>>) => {
      state.loading = true;
      state.error = null;
    },
    addMechanicSuccess: (state, action: PayloadAction<Mechanic>) => {
      state.loading = false;
      state.mechanics.push(action.payload);
    },
    addMechanicFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update mechanic
    updateMechanicRequest: (state, action: PayloadAction<{ id: string; data: Partial<Mechanic> }>) => {
      state.loading = true;
      state.error = null;
    },
    updateMechanicSuccess: (state, action: PayloadAction<Mechanic>) => {
      state.loading = false;
      const index = state.mechanics.findIndex(m => m._id === action.payload._id);
      if (index !== -1) {
        state.mechanics[index] = action.payload;
      }
      if (state.selectedMechanic?._id === action.payload._id) {
        state.selectedMechanic = action.payload;
      }
    },
    updateMechanicFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete mechanic
    deleteMechanicRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteMechanicSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.mechanics = state.mechanics.filter(m => m._id !== action.payload);
      if (state.selectedMechanic?._id === action.payload) {
        state.selectedMechanic = null;
      }
    },
    deleteMechanicFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Select mechanic
    setSelectedMechanic: (state, action: PayloadAction<Mechanic | null>) => {
      state.selectedMechanic = action.payload;
    },

    // Clear error
    clearMechanicError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  setSelectedMechanic,
  clearMechanicError,
} = mechanicSlice.actions;

export default mechanicSlice.reducer;