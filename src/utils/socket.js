import { io } from 'socket.io-client';

let socket = null;
const activeRooms = new Set();

export const initiateSocketConnection = (userId, token) => {
    if (socket && socket.connected) return socket;

    if (socket) {
        // If socket exists but disconnected, update auth and reconnect
        socket.auth = { token, userId };
        socket.connect();
        return socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
    socket = io(socketUrl, {
        auth: {
            token,
            userId,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });

    console.log('🔌 Connecting to socket for user:', userId);

    socket.on('connect', () => {
        console.log('🟢 Socket connected:', socket.id);
        // Automatically rejoin all active conversation rooms upon connect / reconnect
        activeRooms.forEach((roomId) => {
            if (roomId) {
                console.log(`🔄 Re-joining conversation room: ${roomId}`);
                socket.emit('join_room', roomId);
            }
        });
    });

    socket.on('disconnect', (reason) => {
        console.warn('🔴 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.warn('⚠️ Socket connect error:', error?.message);
    });

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
    if (!conversationId) return;
    const roomStr = String(conversationId);
    activeRooms.add(roomStr);
    if (socket && socket.connected) {
        socket.emit('join_room', roomStr);
    }
};

export const leaveConversation = (conversationId) => {
    if (!conversationId) return;
    activeRooms.delete(String(conversationId));
};

export const emitMessage = (data) => {
    if (socket && socket.connected) {
        socket.emit('send_message', data);
    }
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
