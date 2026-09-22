import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { mapUser, mapUsers } from '../../utils/userMapper';

const getToken = () => localStorage.getItem('inakkam_token');

// ─── Async Thunks ────────────────────────────────────

export const fetchDiscoverUsers = createAsyncThunk('user/fetchDiscover', async (page = 1, { getState, rejectWithValue }) => {
  try {
    const res = await api.get(`/discover?page=${page}&limit=20`);
    let users = res.data.users || [];

    const state = getState();
    const currentUser = state.auth?.user;
    const isCustomer = !currentUser?.isEliteAgent && !currentUser?.isStaff && currentUser?.role !== 'staff' && currentUser?.role !== 'admin';

    if (isCustomer) {
      // Strictly keep only verified agents/hosts for customer users
      const agentUsers = users.filter(u => Boolean(u.isEliteAgent || u.isStaff || u.role === 'staff' || u.isHost));
      if (agentUsers.length > 0) {
        return agentUsers;
      }
      // If discover endpoint returned empty or non-agents, query live agents directly
      const agentRes = await api.get('/users/agents');
      if (agentRes.data?.agents && agentRes.data.agents.length > 0) {
        return agentRes.data.agents;
      }
    }

    return users;
  } catch (err) {
    try {
      // Fallback query to agents endpoint on error
      const agentRes = await api.get('/users/agents');
      if (agentRes.data?.agents && agentRes.data.agents.length > 0) {
        return agentRes.data.agents;
      }
    } catch (_) {}
    return rejectWithValue(err);
  }
});

export const fetchMatches = createAsyncThunk('user/fetchMatches', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await api.get('/matches');
    let matches = res.data.matches || [];

    const state = getState();
    const currentUser = state.auth?.user;
    const isCustomer = !currentUser?.isEliteAgent && !currentUser?.isStaff && currentUser?.role !== 'staff' && currentUser?.role !== 'admin';

    if (isCustomer && Array.isArray(matches)) {
      matches = matches.filter(m => {
        const u = m.user || m;
        return Boolean(u.isEliteAgent || u.isStaff || u.role === 'staff' || u.isHost);
      });
    }

    return matches;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const fetchReceivedLikes = createAsyncThunk('user/fetchReceivedLikes', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await api.get('/swipe/received-likes');
    let likes = res.data.likes || [];

    const state = getState();
    const currentUser = state.auth?.user;
    const isCustomer = !currentUser?.isEliteAgent && !currentUser?.isStaff && currentUser?.role !== 'staff' && currentUser?.role !== 'admin';

    if (isCustomer && Array.isArray(likes)) {
      likes = likes.filter(item => {
        const u = item.user || item;
        return Boolean(u.isEliteAgent || u.isStaff || u.role === 'staff' || u.isHost);
      });
    }

    return likes;
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
  receivedLikes: [], // Profiles that liked current user
  selectedUserId: null,
  swipeHistory: [],
  likedProfiles: [], // New state for Explore page
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
    addLikedProfile: (state, action) => {
      const exists = state.likedProfiles.some(p => (p.id || p._id) === (action.payload.id || action.payload._id));
      if (!exists) state.likedProfiles.unshift(action.payload);
    },
    removeReceivedLike: (state, action) => {
      const targetId = action.payload;
      state.receivedLikes = state.receivedLikes.filter(item => {
        const userId = item.user?._id || item.user?.id || item._id;
        return userId !== targetId;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscoverUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDiscoverUsers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.discoveredUsers = mapUsers(action.payload);
          state.currentSwipeIndex = 0;
          state.swipeHistory = [];
        }
      })
      .addCase(fetchDiscoverUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.matches = mapUsers(action.payload) || [];
      })

      .addCase(fetchReceivedLikes.fulfilled, (state, action) => {
        state.receivedLikes = action.payload || [];
      })

      .addCase(apiSwipe.fulfilled, (state, action) => {
        // If it's a real match, the notification will fire via socket
        if (action.payload?.isMatch && action.payload?.match) {
          console.log('✨ New match!', action.payload.match);
        }
      });
  },
});

export const { swipeLeft, swipeRight, undoSwipe, selectUser, resetSwipes, addMatch, addLikedProfile, removeReceivedLike } = userSlice.actions;
export default userSlice.reducer;

