import { createSlice } from '@reduxjs/toolkit';
import { mockCurrentUser } from '../../data/mockData';

const initialState = {
  isAuthenticated: false, // starts false — user must sign in
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
      state.user = {
        ...mockCurrentUser,
        name: action.payload.username || mockCurrentUser.name,
      };
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
