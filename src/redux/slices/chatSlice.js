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
    return {
      conversationId,
      actualConversationId: res.data.conversationId,
      messages: res.data.messages || []
    };
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

export const deleteMessage = createAsyncThunk('chat/deleteMessage', async ({ chatId, messageId }, { rejectWithValue }) => {
  try {
    await api.delete(`/conversations/${chatId}/messages/${messageId}`);
    return { chatId, messageId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete message');
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
      const activeIdStr = String(state.activeChatId || '');

      const activeChat = state.chats.find(c => {
        const cConvId = String(c.conversationId || c.id || '');
        const cUserId = String(c.userId || c.user?._id || c.user?.id || '');
        return cConvId === activeIdStr || cUserId === activeIdStr || activeIdStr.includes(cConvId);
      });
      const activeConvId = activeChat ? String(activeChat.conversationId || activeChat.id || '') : '';
      const activeOtherUserId = activeChat ? String(activeChat.user?._id || activeChat.userId || activeChat.user?.id || '') : activeIdStr.replace('chat_', '');

      // Check if message belongs to the current active chat window
      const isForActiveChat = Boolean(
        activeIdStr && (
          activeIdStr === targetId ||
          (activeConvId && activeConvId === targetId) ||
          (activeOtherUserId && (senderId === activeOtherUserId || String(msg.recipientId || '') === activeOtherUserId)) ||
          activeIdStr.replace('chat_', '') === senderId ||
          (targetId && activeIdStr.replace('chat_', '') && targetId.endsWith(activeIdStr.replace('chat_', ''))) ||
          (targetId && activeIdStr && activeIdStr.endsWith(targetId))
        )
      );

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
        // Update temporary message with real saved message
        state.activeChatMessages[existingIdx] = {
          ...state.activeChatMessages[existingIdx],
          ...msg
        };
      } else if (isForActiveChat) {
        state.activeChatMessages.push(msg);
      }

      // Find matching chat in sidebar list
      let chat = state.chats.find(c => {
        const cConvId = String(c.conversationId || c.id || '');
        const cUserId = String(c.userId || c.user?._id || c.user?.id || '');
        return (targetId && (cConvId === targetId || cConvId.endsWith(targetId))) ||
               (senderId && cUserId === senderId) ||
               (activeOtherUserId && (cUserId === activeOtherUserId || cConvId === targetId));
      });

      if (chat) {
        chat.lastMessage = { text: msg.text, createdAt: msg.createdAt, sender: msg.sender };
        if (targetId && targetId !== chat.conversationId && targetId.match(/^[0-9a-fA-F]{24}$/)) {
          chat.conversationId = targetId;
          chat.id = targetId;
        }
        if (state.activeChatId && state.activeChatId !== targetId && state.activeChatId !== chat.id) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
        // Move chat to top of list
        const chatIdx = state.chats.indexOf(chat);
        if (chatIdx > 0) {
          state.chats.splice(chatIdx, 1);
          state.chats.unshift(chat);
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
    },
    removeMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      state.activeChatMessages = state.activeChatMessages.filter(
        m => (m._id || m.id) !== messageId && m.tempId !== messageId
      );

      const chat = state.chats.find(c =>
        String(c.conversationId || c.id) === String(chatId) ||
        String(c.id).endsWith(String(chatId))
      );
      if (chat && chat.lastMessage && (chat.lastMessage._id === messageId || chat.lastMessage.id === messageId || chat.lastMessage.tempId === messageId)) {
        if (state.activeChatMessages.length > 0) {
          chat.lastMessage = state.activeChatMessages[state.activeChatMessages.length - 1];
        } else {
          chat.lastMessage = null;
        }
      }
    },
    purgeExpiredChatMessages: (state) => {
      const now = Date.now();
      const isExpired = (createdAt, _id, timestamp) => {
        let msgTime = 0;
        if (createdAt) {
          const t = new Date(createdAt).getTime();
          if (!isNaN(t) && t > 0) msgTime = t;
        } else if (timestamp && !isNaN(new Date(timestamp).getTime())) {
          msgTime = new Date(timestamp).getTime();
        } else if (_id && typeof _id === 'string' && _id.length === 24) {
          try {
            const t = parseInt(_id.substring(0, 8), 16) * 1000;
            if (!isNaN(t) && t > 0) msgTime = t;
          } catch (e) {}
        }
        return msgTime > 0 && (now - msgTime >= 24 * 60 * 60 * 1000);
      };

      state.activeChatMessages = state.activeChatMessages.filter(m => !isExpired(m.createdAt, m._id, m.timestamp));
      // Also clear stale lastMessages in chats list
      state.chats.forEach(c => {
        if (c.lastMessage && isExpired(c.lastMessage.createdAt, c.lastMessage._id || c.lastMessage.id)) {
          c.lastMessage = null;
        }
      });
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
        const convId = String(action.payload.conversationId || '');
        const actualConvId = String(action.payload.actualConversationId || '');
        const now = Date.now();
        const isExpired = (createdAt, _id) => {
          let msgTime = 0;
          if (createdAt) {
            const t = new Date(createdAt).getTime();
            if (!isNaN(t) && t > 0) msgTime = t;
          } else if (_id && typeof _id === 'string' && _id.length === 24) {
            try {
              const t = parseInt(_id.substring(0, 8), 16) * 1000;
              if (!isNaN(t) && t > 0) msgTime = t;
            } catch (e) {}
          }
          return msgTime > 0 && (now - msgTime >= 24 * 60 * 60 * 1000);
        };
        const validMessages = (action.payload.messages || []).filter(m => !isExpired(m.createdAt, m._id));
        const activeIdStr = String(state.activeChatId || '');

        const matchesActive =
          activeIdStr === convId ||
          (actualConvId && activeIdStr === actualConvId) ||
          activeIdStr.replace('chat_', '') === convId ||
          activeIdStr.endsWith(convId);

        if (matchesActive) {
          // Preserve any optimistic pending temp messages that haven't saved yet
          const pendingTempMsgs = state.activeChatMessages.filter(m =>
            String(m._id || '').startsWith('temp_') && !validMessages.some(vm => vm.text === m.text)
          );
          state.activeChatMessages = [...validMessages, ...pendingTempMsgs];

          if (actualConvId && actualConvId !== activeIdStr && !activeIdStr.match(/^[0-9a-fA-F]{24}$/)) {
            state.activeChatId = actualConvId;
          }
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        if (!message) return;
        const convId = message.conversation;

        const tempIdx = state.activeChatMessages.findIndex(m =>
          (m.tempId && m.tempId === action.meta?.arg?.tempId) ||
          (String(m._id || '').startsWith('temp_') && m.text === message.text)
        );
        if (tempIdx !== -1) {
          state.activeChatMessages[tempIdx] = message;
        } else {
          const exists = state.activeChatMessages.some(m => m._id === message._id);
          if (!exists && (state.activeChatId === convId || state.activeChatId?.endsWith(convId))) {
            state.activeChatMessages.push(message);
          }
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
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { chatId, messageId } = action.payload;
        state.activeChatMessages = state.activeChatMessages.filter(
          m => (m._id || m.id) !== messageId && m.tempId !== messageId
        );

        const chat = state.chats.find(c =>
          String(c.conversationId || c.id) === String(chatId) ||
          String(c.id).endsWith(String(chatId))
        );
        if (chat && chat.lastMessage && (chat.lastMessage._id === messageId || chat.lastMessage.id === messageId || chat.lastMessage.tempId === messageId)) {
          if (state.activeChatMessages.length > 0) {
            chat.lastMessage = state.activeChatMessages[state.activeChatMessages.length - 1];
          } else {
            chat.lastMessage = null;
          }
        }
      });
  },
});

export const { setActiveChat, addMessage, setTyping, createNewChat, receiveMessage, addReaction, removeMessage, purgeExpiredChatMessages } = chatSlice.actions;
export default chatSlice.reducer;
