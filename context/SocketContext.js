import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { tokenStorage } from '../utils/tokenStorage';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Use the ngrok URL provided in the user's running commands
        const SOCKET_URL = 'https://zoologically-unindentured-sol.ngrok-free.dev';

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        setSocket(newSocket);

        const connectUser = async () => {
            const userId = await tokenStorage.getUserId();
            if (userId) {
                newSocket.emit('join', userId);
                console.log('Emitted join for user:', userId);
            }
        };

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            connectUser();
        });

        newSocket.on('connect_error', (err) => {
            console.log('Socket connection error:', err);
        });

        // Listen for notifications
        newSocket.on('notification', (data) => {
            const newNotification = {
                id: Date.now().toString(),
                ...data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => newSocket.close();
    }, []);

    const refreshSocket = async () => {
        if (socket) {
            const userId = await tokenStorage.getUserId();
            if (userId) {
                socket.emit('join', userId);
                console.log('Re-emitted join for user:', userId);
            }
        }
    };

    const markAsRead = (notificationId) => {
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={{
            socket,
            refreshSocket,
            notifications,
            unreadCount,
            markAsRead,
            clearNotifications
        }}>
            {children}
        </SocketContext.Provider>
    );
};
