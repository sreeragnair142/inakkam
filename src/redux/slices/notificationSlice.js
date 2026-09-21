import { createSlice } from '@reduxjs/toolkit';

const loadSavedNotifications = () => {
  try {
    const saved = localStorage.getItem('inakkam_notifications');
    if (saved) {
      const items = JSON.parse(saved);
      if (Array.isArray(items)) {
        const unreadCount = items.filter(n => !n.read).length;
        return { items, unreadCount };
      }
    }
  } catch (e) {}
  return { items: [], unreadCount: 0 };
};

const saveNotifications = (items) => {
  try {
    localStorage.setItem('inakkam_notifications', JSON.stringify(items.slice(0, 50)));
  } catch (e) {}
};

const initial = loadSavedNotifications();

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    items: initial.items,
    unreadCount: initial.unreadCount,
  },
  reducers: {
    addNotification: (state, action) => {
      const payload = action.payload || {};
      const newNotif = {
        id: payload.id || `n_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        read: false,
        time: 'Just now',
        createdAt: new Date().toISOString(),
        ...payload,
      };

      // Avoid duplicate notifications with same id
      const existingIdx = state.items.findIndex(n => n.id === newNotif.id);
      if (existingIdx !== -1) {
        state.items[existingIdx] = { ...state.items[existingIdx], ...newNotif };
      } else {
        state.items.unshift(newNotif);
      }

      state.unreadCount = state.items.filter(n => !n.read).length;
      saveNotifications(state.items);
    },
    markAsRead: (state, action) => {
      const notif = state.items.find(n => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        saveNotifications(state.items);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => { n.read = true; });
      state.unreadCount = 0;
      saveNotifications(state.items);
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
      saveNotifications([]);
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;

