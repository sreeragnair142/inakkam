import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: false,
  activeTab: 'swipe', // default starting page
  modalOpen: null, // general modals
  isMatchedModalOpen: false,
  lastMatchedUser: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    openModal: (state, action) => {
      state.modalOpen = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = null;
    },
    setMatchedModal: (state, action) => {
      state.isMatchedModalOpen = action.payload.isOpen;
      state.lastMatchedUser = action.payload.user || null;
    }
  },
});

export const { toggleSidebar, setSidebarOpen, setActiveTab, openModal, closeModal, setMatchedModal } = uiSlice.actions;
export default uiSlice.reducer;
