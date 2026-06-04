import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = (userId, token) => {
    if (socket) return socket;

    socket = io('/', {
        auth: {
            token,
            userId,
        },
        transports: ['websocket', 'polling'],
    });

    console.log('🔌 Connecting to socket...');

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('🔌 Disconnecting socket...');
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export const joinConversation = (conversationId) => {
    if (socket) socket.emit('join_room', conversationId);
};

export const emitMessage = (data) => {
    if (socket) socket.emit('send_message', data);
};

export const emitTyping = (conversationId) => {
    if (socket) socket.emit('typing', { conversationId });
};

export const emitStopTyping = (conversationId) => {
    if (socket) socket.emit('stop_typing', { conversationId });
};

export const emitMessageRead = (conversationId) => {
    if (socket) socket.emit('message_read', { conversationId });
};
