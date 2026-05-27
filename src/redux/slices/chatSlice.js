import { createSlice } from '@reduxjs/toolkit';
import { mockChats } from '../../data/mockData';

const initialState = {
  chats: mockChats,
  activeChatId: 'c1',
  isTyping: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
      
      // Clear unread count for this chat
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
    sendMessage: (state, action) => {
      const { chatId, text } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chat.messages.push({
          id: `m_user_${Date.now()}`,
          senderId: 'current',
          text,
          timestamp: time,
          reactions: []
        });
      }
    },
    receiveMessage: (state, action) => {
      const { chatId, text, senderId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chat.messages.push({
          id: `m_incoming_${Date.now()}`,
          senderId,
          text,
          timestamp: time,
          reactions: []
        });
        
        if (state.activeChatId !== chatId) {
          chat.unreadCount += 1;
        }
      }
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    addReaction: (state, action) => {
      const { chatId, messageId, emoji } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const message = chat.messages.find(m => m.id === messageId);
        if (message) {
          if (!message.reactions) {
            message.reactions = [];
          }
          if (!message.reactions.includes(emoji)) {
            message.reactions.push(emoji);
          } else {
            message.reactions = message.reactions.filter(r => r !== emoji);
          }
        }
      }
    },
    createNewChat: (state, action) => {
      const user = action.payload;
      // Check if chat already exists
      const existingChat = state.chats.find(c => c.userId === user.id);
      if (existingChat) {
        state.activeChatId = existingChat.id;
        return;
      }
      
      const newChatId = `c_${Date.now()}`;
      state.chats.unshift({
        id: newChatId,
        userId: user.id,
        userName: user.name,
        userImage: user.images[0],
        lastActive: 'Online',
        unreadCount: 0,
        messages: [
          {
            id: `m_welcome_${Date.now()}`,
            senderId: user.id,
            text: `Hey! We matched! Let's get to know each other ✨`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: []
          }
        ]
      });
      state.activeChatId = newChatId;
    }
  },
});

export const { setActiveChat, sendMessage, receiveMessage, setTyping, addReaction, createNewChat } = chatSlice.actions;
export default chatSlice.reducer;
