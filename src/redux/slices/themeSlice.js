import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: 'light', // 'light' | 'dark' | 'gradient-blend'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      if (state.mode === 'gradient-blend') {
        state.mode = 'dark';
      } else if (state.mode === 'dark') {
        state.mode = 'light';
      } else {
        state.mode = 'gradient-blend';
      }
    },
    setTheme: (state, action) => {
      state.mode = action.payload; // 'light' | 'dark' | 'gradient-blend'
    }
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
