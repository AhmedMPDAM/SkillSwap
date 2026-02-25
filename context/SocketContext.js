import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';

// Returns a per-user storage key so notifications are never shared between accounts
const getNotificationsKey = (userId) => `@skillswap_notifications_${userId}`;

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState(null);

    // ── Load persisted notifications for the currently logged-in user ────────
    const loadNotificationsForUser = async (userId) => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        try {
            const stored = await AsyncStorage.getItem(getNotificationsKey(userId));
            if (stored) {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
                const unread = parsed.filter(n => !n.read).length;
                setUnreadCount(unread);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (e) {
            console.log('Failed to load notifications from storage:', e);
        }
    };

    // Load notifications on first mount for whoever is already logged in
    useEffect(() => {
        const init = async () => {
            const userId = await tokenStorage.getUserId();
            if (userId) {
                setCurrentUserId(userId);
                await loadNotificationsForUser(userId);
            }
        };
        init();
    }, []);

    // ── Persist notifications for the current user whenever they change ──────
    const persistNotifications = async (notifList, userId) => {
        const uid = userId || currentUserId;
        if (!uid) return;
        try {
            await AsyncStorage.setItem(getNotificationsKey(uid), JSON.stringify(notifList));
        } catch (e) {
            console.log('Failed to persist notifications:', e);
        }
    };

    useEffect(() => {
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

    /**
     * Called after a successful login so that:
     *  1. The old user's notifications are cleared from memory.
     *  2. The new user's notifications are loaded from storage.
     *  3. The socket re-joins under the new user's room.
     */
    const refreshSocket = async () => {
        const userId = await tokenStorage.getUserId();
        if (!userId) return;

        // Switch the in-memory notification store to the new user
        setCurrentUserId(userId);
        await loadNotificationsForUser(userId);

        if (socket) {
            socket.emit('join', userId);
            console.log('Re-emitted join for user:', userId);
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

    /**
     * Clears the current user's notifications from both memory and storage.
     * Call this on logout.
     */
    const clearNotifications = () => {
        if (currentUserId) {
            AsyncStorage.removeItem(getNotificationsKey(currentUserId)).catch(() => { });
        }
        setNotifications([]);
        setUnreadCount(0);
        setCurrentUserId(null);
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
