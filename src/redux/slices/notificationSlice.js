import { createSlice } from '@reduxjs/toolkit';
import { mockNotifications } from '../../data/mockData';

const initialState = {
  items: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.read).length,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newNotif = {
        id: `n_${Date.now()}`,
        read: false,
        time: 'Just now',
        ...action.payload
      };
      state.items.unshift(newNotif);
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notif = state.items.find(n => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    }
  },
});

export const { addNotification, markAsRead, markAllAsRead, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;
