import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    chat: chatReducer,
    notification: notificationReducer,
    theme: themeReducer,
    ui: uiReducer,
  },
});
