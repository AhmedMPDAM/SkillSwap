import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';

const NOTIFICATIONS_STORAGE_KEY = '@skillswap_notifications';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // ── Load persisted notifications on startup ──────────────────────────────
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setNotifications(parsed);
                    const unread = parsed.filter(n => !n.read).length;
                    setUnreadCount(unread);
                }
            } catch (e) {
                console.log('Failed to load notifications from storage:', e);
            }
        };
        loadNotifications();
    }, []);

    // ── Persist notifications whenever they change ───────────────────────────
    const persistNotifications = async (notifList) => {
        try {
            await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifList));
        } catch (e) {
            console.log('Failed to persist notifications:', e);
        }
    };

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
                read: false,
            };

            setNotifications(prev => {
                const updated = [newNotification, ...prev];
                persistNotifications(updated);
                return updated;
            });
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
        setNotifications(prev => {
            const updated = prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            );
            persistNotifications(updated);
            return updated;
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
        AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY).catch(() => { });
    };

    return (
        <SocketContext.Provider value={{
            socket,
            refreshSocket,
            notifications,
            unreadCount,
            markAsRead,
            clearNotifications,
        }}>
            {children}
        </SocketContext.Provider>
    );
};
