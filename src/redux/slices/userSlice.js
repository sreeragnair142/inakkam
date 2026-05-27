import { createSlice } from '@reduxjs/toolkit';
import { mockUsers } from '../../data/mockData';

const initialState = {
  discoveredUsers: mockUsers,
  currentSwipeIndex: 0,
  matches: [
    mockUsers[0], // Pre-populate with Sophia and Maya as matches
    mockUsers[4]
  ],
  selectedUserId: 'u1',
  swipeHistory: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    swipeLeft: (state) => {
      if (state.currentSwipeIndex < state.discoveredUsers.length) {
        state.swipeHistory.push({
          index: state.currentSwipeIndex,
          type: 'left',
          user: state.discoveredUsers[state.currentSwipeIndex]
        });
        state.currentSwipeIndex += 1;
      }
    },
    swipeRight: (state) => {
      if (state.currentSwipeIndex < state.discoveredUsers.length) {
        const user = state.discoveredUsers[state.currentSwipeIndex];
        state.swipeHistory.push({
          index: state.currentSwipeIndex,
          type: 'right',
          user
        });
        state.currentSwipeIndex += 1;
        
        // Simulating matching behavior: 80% chance or if matchPercentage > 90
        const isMatch = user.matchPercentage > 90 || Math.random() > 0.3;
        if (isMatch) {
          // Add to matches if not already there
          if (!state.matches.some(m => m.id === user.id)) {
            state.matches.unshift(user);
          }
        }
      }
    },
    undoSwipe: (state) => {
      if (state.swipeHistory.length > 0) {
        const lastSwipe = state.swipeHistory.pop();
        state.currentSwipeIndex = lastSwipe.index;
        
        // If it was a match, we could clean it, but keep it simple
        if (lastSwipe.type === 'right') {
          state.matches = state.matches.filter(m => m.id !== lastSwipe.user.id);
        }
      }
    },
    selectUser: (state, action) => {
      state.selectedUserId = action.payload;
    },
    resetSwipes: (state) => {
      state.currentSwipeIndex = 0;
      state.swipeHistory = [];
    }
  },
});

export const { swipeLeft, swipeRight, undoSwipe, selectUser, resetSwipes } = userSlice.actions;
export default userSlice.reducer;
