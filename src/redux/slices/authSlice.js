import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { mapUser } from '../../utils/userMapper';

// ─── Async Thunks ────────────────────────────────────
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    const json = res.data;
    if (json.token) localStorage.setItem('inakkam_token', json.token);
    return json;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    const json = res.data;
    if (json.token) localStorage.setItem('inakkam_token', json.token);
    return json;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/users/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('inakkam_token');
  }
});

// ─── Slice ───────────────────────────────────────────
const initialState = {
  isAuthenticated: false,
  isGuest: false,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Keep guestLogin for demo / skip-for-now flow
    login: (state, action) => {
      state.isAuthenticated = true;
      state.isGuest = false;
      state.user = {
        name: action.payload?.username || 'User',
        age: 25,
        bio: 'Just joined Inakkam!',
        images: [],
        interests: [],
        prompts: [],
        membership: { plan: 'free' }
      };
    },
    guestLogin: (state) => {
      state.isAuthenticated = true;
      state.isGuest = true;
      state.user = {
        name: 'Guest User',
        age: 20,
        bio: 'Exploring Inakkam as a guest.',
        images: [],
        interests: [],
        prompts: [],
        membership: { plan: 'free' }
      };
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.isGuest = false;
      state.user = null;
      localStorage.removeItem('inakkam_token');
    },
    updateProfile: (state, action) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };
    const handleRejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.user = mapUser(action.payload.user);
      })
      .addCase(registerUser.rejected, handleRejected)

      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.user = mapUser(action.payload.user);
      })
      .addCase(loginUser.rejected, handleRejected)

      .addCase(fetchMe.pending, (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = mapUser(action.payload.user);
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('inakkam_token');
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.isGuest = false;
        state.user = null;
      });
  },
});

export const { login, guestLogin, logout, updateProfile, clearError } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = () => localStorage.getItem('inakkam_token');
export default authSlice.reducer;
