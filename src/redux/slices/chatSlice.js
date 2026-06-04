import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { emitMessage } from '../../utils/socket';
import { mapUser } from '../../utils/userMapper';

const getToken = () => localStorage.getItem('inakkam_token');

// ─── Async Thunks ────────────────────────────────────

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/conversations');
    return res.data.conversations.map(conv => ({
      ...conv,
      id: conv.conversationId,
      userName: conv.user?.name || 'Unknown',
      userImage: conv.user?.photos?.[0]?.url || 'https://via.placeholder.com/150',
      messages: [] // messages are fetched separately or via socket
    }));
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/conversations/${conversationId}/messages`);
    return { conversationId, messages: res.data.messages };
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ chatId, text }, { rejectWithValue }) => {
  try {
    // First, emit via socket for real-time (optimistic or confirmed)
    // Actually, backend socket handles saving too, but we can use REST as fallback
    // The controller route is /api/conversations/:id/messages
    const res = await api.post(`/conversations/${chatId}/messages`, { text });

    // Also emit via socket if connection is active
    emitMessage({ conversationId: chatId, text });

    return res.data.message;
  } catch (err) {
    return rejectWithValue(err);
  }
});

// ─── Slice ───────────────────────────────────────────
const initialState = {
  chats: [],
  activeChatId: null,
  activeChatMessages: [],
  isTyping: false,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
      // Clear unread count for the chat in the list
      const chat = state.chats.find(c => (c.conversationId || c.id) === action.payload);
      if (chat) chat.unreadCount = 0;
    },
    addMessage: (state, action) => {
      const { conversationId, text, senderId, sender, createdAt, _id } = action.payload;

      // If the message belongs to the active chat, add it to the list
      if (state.activeChatId === conversationId) {
        state.activeChatMessages.push(action.payload);
      }

      // Update the chat preview in the list
      const chat = state.chats.find(c => (c.conversationId || c.id) === conversationId);
      if (chat) {
        chat.lastMessage = { text, createdAt, sender };
        if (state.activeChatId !== conversationId) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
      }
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    // Alias for compatibility with old mock code in Chat.jsx
    receiveMessage: (state, action) => {
      const { chatId, text, senderId } = action.payload;
      const message = {
        _id: `m_${Date.now()}`,
        conversation: chatId,
        text,
        sender: { _id: senderId },
        createdAt: new Date().toISOString()
      };

      if (state.activeChatId === chatId) {
        state.activeChatMessages.push(message);
      }

      const chat = state.chats.find(c => (c.conversationId || c.id) === chatId);
      if (chat) {
        chat.lastMessage = message;
      }
    },
    addReaction: (state, action) => {
      const { chatId, messageId, emoji } = action.payload;
      if (state.activeChatId === chatId) {
        const msg = state.activeChatMessages.find(m => (m._id || m.id) === messageId);
        if (msg) {
          if (!msg.reactions) msg.reactions = [];
          msg.reactions.push(emoji);
        }
      }
    },
    createNewChat: (state, action) => {
      const user = action.payload;
      const existingChat = state.chats.find(c => (c.user?._id || c.userId) === (user._id || user.id));
      if (existingChat) {
        state.activeChatId = existingChat.conversationId || existingChat.id;
        return;
      }

      // Temporary local chat until a real message is sent
      const newChatId = `temp_${Date.now()}`;
      state.chats.unshift({
        id: newChatId,
        user: user,
        lastMessage: null,
        unreadCount: 0,
      });
      state.activeChatId = newChatId;
      state.activeChatMessages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.loading = true; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMessages.fulfilled, (state, action) => {
        if (state.activeChatId === action.payload.conversationId) {
          state.activeChatMessages = action.payload.messages;
        }
      });
  },
});

export const { setActiveChat, addMessage, setTyping, createNewChat, receiveMessage, addReaction } = chatSlice.actions;
export default chatSlice.reducer;
