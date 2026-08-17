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
      if (!msg) return;

      const targetId = String(msg.conversationId || msg.conversation || msg.chatId || '');
      const msgId = msg._id || msg.id;
      const tempId = msg.tempId;
      const senderId = String(msg.sender?._id || msg.sender?.id || msg.sender || '');

      // Search for existing message to prevent duplicates (by _id, tempId, or identical text+sender within 3 sec)
      const existingIdx = state.activeChatMessages.findIndex(m => {
        const mId = m._id || m.id;
        const mTempId = m.tempId;
        const mSenderId = String(m.sender?._id || m.sender?.id || m.sender || '');

        if (msgId && mId && String(mId) === String(msgId)) return true;
        if (tempId && (mTempId === tempId || mId === tempId)) return true;
        if (m.text === msg.text && mSenderId === senderId) {
          const t1 = new Date(m.createdAt || 0).getTime();
          const t2 = new Date(msg.createdAt || 0).getTime();
          if (Math.abs(t1 - t2) < 3000) return true;
        }
        return false;
      });

      if (existingIdx !== -1) {
        // Replace existing message (e.g. update temp message with real backend message)
        state.activeChatMessages[existingIdx] = {
          ...state.activeChatMessages[existingIdx],
          ...msg
        };
      } else {
        const activeIdStr = String(state.activeChatId || '');
        if (!state.activeChatId || activeIdStr === targetId || activeIdStr.endsWith(targetId) || targetId.endsWith(activeIdStr.replace('chat_', ''))) {
          state.activeChatMessages.push(msg);
        }
      }

      const chat = state.chats.find(c => {
        const cConvId = String(c.conversationId || c.id || '');
        const cUserId = String(c.userId || c.user?._id || '');
        return cConvId === targetId || cUserId === targetId || cConvId.endsWith(targetId) || targetId.endsWith(cConvId.replace('chat_', ''));
      });

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

      const targetId = String(user._id || user.id || '');
      if (!targetId) return;

      const existingChat = state.chats.find(c => {
        const cUserId = String(c.userId || c.user?._id || c.user?.id || '');
        const cId = String(c.id || c.conversationId || '');
        return cUserId === targetId || cId === targetId || cId === `chat_${targetId}`;
      });

      if (existingChat) {
        state.activeChatId = existingChat.conversationId || existingChat.id;
        return;
      }

      const newChatId = user.conversationId || `chat_${targetId}`;
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
        if (action.payload) {
          const mergedChats = [...state.chats];

          action.payload.forEach(apiChat => {
            const apiTargetUserId = String(apiChat.userId || apiChat.user?._id || apiChat.user?.id || '');
            const apiConvId = String(apiChat.conversationId || apiChat.id || '');

            const existingIdx = mergedChats.findIndex(c => {
              const cConvId = String(c.conversationId || c.id || '');
              const cTargetUserId = String(c.userId || c.user?._id || c.user?.id || '');
              return (cConvId && cConvId === apiConvId) ||
                (apiTargetUserId && cTargetUserId && cTargetUserId === apiTargetUserId) ||
                (cConvId === `chat_${apiTargetUserId}`);
            });

            if (existingIdx !== -1) {
              const oldId = mergedChats[existingIdx].id || mergedChats[existingIdx].conversationId;
              mergedChats[existingIdx] = {
                ...mergedChats[existingIdx],
                ...apiChat,
                id: apiChat.conversationId || apiChat.id,
                conversationId: apiChat.conversationId || apiChat.id,
              };
              if (state.activeChatId === oldId) {
                state.activeChatId = apiChat.conversationId || apiChat.id;
              }
            } else {
              mergedChats.push(apiChat);
            }
          });

          // Ensure no duplicate target userIds in state.chats
          const uniqueChats = [];
          const seenUserIds = new Set();
          for (const chat of mergedChats) {
            const uId = String(chat.userId || chat.user?._id || chat.user?.id || chat.id || '');
            if (uId && seenUserIds.has(uId)) continue;
            if (uId) seenUserIds.add(uId);
            uniqueChats.push(chat);
          }

          state.chats = uniqueChats;
        }

        if (!state.activeChatId && state.chats.length > 0) {
          state.activeChatId = state.chats[0].id || state.chats[0].conversationId;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMessages.fulfilled, (state, action) => {
        const convId = action.payload.conversationId;
        if (state.activeChatId === convId || state.activeChatId?.replace('chat_', '') === convId?.toString()) {
          state.activeChatMessages = action.payload.messages;
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        if (!message) return;
        const convId = message.conversation;
        const exists = state.activeChatMessages.some(m => m._id === message._id);
        if (!exists && (state.activeChatId === convId || state.activeChatId?.endsWith(convId))) {
          state.activeChatMessages.push(message);
        }
        const chat = state.chats.find(c =>
          String(c.conversationId || c.id) === String(convId) ||
          String(c.id).endsWith(String(convId))
        );
        if (chat) {
          chat.lastMessage = message;
          chat.id = convId;
          chat.conversationId = convId;
        }
      });
  },
});

export const { setActiveChat, addMessage, setTyping, createNewChat, receiveMessage, addReaction } = chatSlice.actions;
export default chatSlice.reducer;
