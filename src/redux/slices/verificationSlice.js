import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ─── Async: Get verification status ──────────────────────
export const fetchVerificationStatus = createAsyncThunk(
  'verification/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/verification/status');
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err);
    }
  }
);

// ─── Async: Submit verification ──────────────────────────
export const submitVerification = createAsyncThunk(
  'verification/submit',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────
const verificationSlice = createSlice({
  name: 'verification',
  initialState: {
    status: 'NOT_VERIFIED', // NOT_VERIFIED | PENDING_VERIFICATION | UNDER_VERIFICATION | VERIFIED | REJECTED
    verification: null,
    loading: false,
    submitting: false,
    error: null,
    submitSuccess: false,
  },
  reducers: {
    clearVerificationError: (state) => { state.error = null; },
    resetSubmitSuccess: (state) => { state.submitSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerificationStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchVerificationStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload.status;
        state.verification = action.payload.verification;
      })
      .addCase(fetchVerificationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitVerification.pending, (state) => { state.submitting = true; state.error = null; state.submitSuccess = false; })
      .addCase(submitVerification.fulfilled, (state, action) => {
        state.submitting = false;
        state.status = 'PENDING_VERIFICATION';
        state.verification = action.payload.verification;
        state.submitSuccess = true;
      })
      .addCase(submitVerification.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearVerificationError, resetSubmitSuccess } = verificationSlice.actions;
export default verificationSlice.reducer;
