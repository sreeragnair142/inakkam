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
      const chat = state.chats.find(c => (c.conversationId || c.id) === action.payload);
      if (chat) chat.unreadCount = 0;
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      const targetId = msg.conversationId || msg.conversation || msg.chatId;

      if (!state.activeChatId || state.activeChatId === targetId) {
        state.activeChatMessages.push(msg);
      }

      const chat = state.chats.find(c => (c.conversationId || c.id) === targetId || (c.conversationId || c.id) === state.activeChatId);
      if (chat) {
        chat.lastMessage = { text: msg.text, createdAt: msg.createdAt, sender: msg.sender };
        if (state.activeChatId && state.activeChatId !== targetId) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
      }
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
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
      if (!user) return;

      const targetId = user._id || user.id || 'user_' + Date.now();
      const existingChat = state.chats.find(c =>
        c.userId === targetId ||
        c.user?._id === targetId ||
        c.user?.id === targetId ||
        c.id === `chat_${targetId}` ||
        c.conversationId === `chat_${targetId}`
      );

      if (existingChat) {
        state.activeChatId = existingChat.conversationId || existingChat.id;
        return;
      }

      const newChatId = `chat_${targetId}`;
      const userImg = user.images?.[0] || user.photos?.[0]?.url || user.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80';
      const userName = user.name || 'Match';

      const newChat = {
        id: newChatId,
        conversationId: newChatId,
        userName: userName,
        userImage: userImg,
        userId: targetId,
        user: user,
        lastActive: 'Online',
        lastMessage: { text: `Start chatting with ${userName}! 👋`, createdAt: new Date().toISOString() },
        unreadCount: 0,
      };

      state.chats.unshift(newChat);
      state.activeChatId = newChatId;
      state.activeChatMessages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.loading = true; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          const newApiChats = action.payload.filter(apiChat =>
            !state.chats.some(c => (c.conversationId || c.id) === (apiChat.conversationId || apiChat.id))
          );
          state.chats = [...state.chats, ...newApiChats];
        }
        if (!state.activeChatId && state.chats.length > 0) {
          state.activeChatId = state.chats[0].id || state.chats[0].conversationId;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMessages.fulfilled, (state, action) => {
        if (state.activeChatId === action.payload.conversationId) {
          state.activeChatMessages = action.payload.messages;
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const exists = state.activeChatMessages.some(m => m._id === message._id);
        if (!exists && state.activeChatId === message.conversation) {
          state.activeChatMessages.push(message);
        }
        const chat = state.chats.find(c => (c.conversationId || c.id) === message.conversation);
        if (chat) {
          chat.lastMessage = message;
        }
      });
  },
});

export const { setActiveChat, addMessage, setTyping, createNewChat, receiveMessage, addReaction } = chatSlice.actions;
export default chatSlice.reducer;
