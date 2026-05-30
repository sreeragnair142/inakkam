import { createSlice } from '@reduxjs/toolkit';
import { mockCurrentUser } from '../../data/mockData';

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
    login: (state, action) => {
      state.isAuthenticated = true;
      state.isGuest = false;
      state.user = {
        ...mockCurrentUser,
        name: action.payload.username || mockCurrentUser.name,
      };
    },
    guestLogin: (state) => {
      state.isAuthenticated = true;
      state.isGuest = true;
      state.user = {
        ...mockCurrentUser,
        name: "Guest User",
      };
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.isGuest = false;
      state.user = null;
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, guestLogin, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
