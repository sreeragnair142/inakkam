import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { mapUser, mapUsers } from '../../utils/userMapper';

const getToken = () => localStorage.getItem('inakkam_token');

// ─── Async Thunks ────────────────────────────────────

export const fetchDiscoverUsers = createAsyncThunk('user/fetchDiscover', async (page = 1, { rejectWithValue }) => {
  try {
    const res = await api.get(`/discover?page=${page}&limit=20`);
    return res.data.users;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const fetchMatches = createAsyncThunk('user/fetchMatches', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/matches');
    return res.data.matches;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const apiSwipe = createAsyncThunk('user/apiSwipe', async ({ userId, action }, { rejectWithValue }) => {
  try {
    const res = await api.post('/swipe', { swipedUserId: userId, action });
    return res.data;
  } catch (err) {
    return rejectWithValue(err);
  }
});

// ─── Slice ───────────────────────────────────────────
const initialState = {
  discoveredUsers: [], // Start empty
  currentSwipeIndex: 0,
  matches: [],
  selectedUserId: null,
  swipeHistory: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    swipeLeft: (state) => {
      if (state.currentSwipeIndex < state.discoveredUsers.length) {
        state.swipeHistory.push({ index: state.currentSwipeIndex, type: 'left', user: state.discoveredUsers[state.currentSwipeIndex] });
        state.currentSwipeIndex += 1;
      }
    },
    swipeRight: (state) => {
      if (state.currentSwipeIndex < state.discoveredUsers.length) {
        const user = state.discoveredUsers[state.currentSwipeIndex];
        state.swipeHistory.push({ index: state.currentSwipeIndex, type: 'right', user });
        state.currentSwipeIndex += 1;
        // Optimistic add to matches (real match determined by API)
        if (!state.matches.some(m => (m.user?._id || m.id) === (user._id || user.id))) {
          state.matches.unshift({ user, matchedAt: new Date().toISOString() });
        }
      }
    },
    undoSwipe: (state) => {
      if (state.swipeHistory.length > 0) {
        const last = state.swipeHistory.pop();
        state.currentSwipeIndex = last.index;
        if (last.type === 'right') {
          state.matches = state.matches.filter(m => (m.user?._id || m.id) !== (last.user._id || last.user.id));
        }
      }
    },
    selectUser: (state, action) => { state.selectedUserId = action.payload; },
    resetSwipes: (state) => { state.currentSwipeIndex = 0; state.swipeHistory = []; },
    addMatch: (state, action) => {
      const exists = state.matches.some(m => (m.user?._id || m.id) === action.payload._id);
      if (!exists) state.matches.unshift({ user: action.payload, matchedAt: new Date().toISOString() });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscoverUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDiscoverUsers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.discoveredUsers = mapUsers(action.payload);
          state.currentSwipeIndex = 0;
          state.swipeHistory = [];
        }
      })
      .addCase(fetchDiscoverUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.matches = mapUsers(action.payload) || [];
      })

      .addCase(apiSwipe.fulfilled, (state, action) => {
        // If it's a real match, the notification will fire via socket
        if (action.payload?.isMatch && action.payload?.match) {
          console.log('✨ New match!', action.payload.match);
        }
      });
  },
});

export const { swipeLeft, swipeRight, undoSwipe, selectUser, resetSwipes, addMatch } = userSlice.actions;
export default userSlice.reducer;
