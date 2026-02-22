import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { tokenStorage } from '../../utils/tokenStorage';

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

const MessagesScreen = () => {
    const navigation = useNavigation();
    const [chats, setChats] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const uid = await tokenStorage.getUserId();
            setCurrentUserId(uid);

            if (!uid) {
                setLoading(false);
                return;
            }

            // Listen for all chats where this user is a participant
            const chatsRef = collection(db, 'chats');
            const q = query(
                chatsRef,
                where('participants', 'array-contains', uid),
                orderBy('lastMessageAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const chatList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setChats(chatList);
                setLoading(false);
            }, (error) => {
                console.log('Error fetching chats:', error);
                setLoading(false);
            });

            return unsubscribe;
        };

        let unsubscribe;
        init().then((unsub) => {
            unsubscribe = unsub;
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const getOtherUserName = (chat) => {
        if (!currentUserId || !chat) return 'Chat';
        if (currentUserId === chat.requestOwnerInfo?.id) {
            return chat.proposerInfo?.name || 'User';
        }
        return chat.requestOwnerInfo?.name || 'User';
    };

    const getOtherUserInitial = (chat) => {
        const name = getOtherUserName(chat);
        return (name || '?').charAt(0).toUpperCase();
    };

    const renderChatItem = ({ item }) => {
        const otherName = getOtherUserName(item);
        const initial = getOtherUserInitial(item);
        const lastMsg = item.lastMessageText || 'No messages yet';
        const lastTime = item.lastMessageAt ? formatTime(item.lastMessageAt) : '';
        const isActive = item.isActive !== false;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() =>
                    navigation.navigate('Chat', {
                        chatId: item.id,
                        requestId: item.requestId,
                        proposalId: item.id,
                    })
                }
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, !isActive && styles.avatarInactive]}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    {isActive && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName} numberOfLines={1}>
                            {otherName}
                        </Text>
                        <Text style={styles.chatTime}>{lastTime}</Text>
                    </View>
                    {item.requestTitle ? (
                        <Text style={styles.chatRequest} numberOfLines={1}>
                            📋 {item.requestTitle}
                        </Text>
                    ) : null}
                    <Text style={[styles.chatLastMessage, !isActive && styles.chatLastMessageInactive]} numberOfLines={1}>
                        {lastMsg}
                    </Text>
                </View>

                <View style={styles.chatChevron}>
                    {!isActive && (
                        <View style={styles.closedBadge}>
                            <Text style={styles.closedBadgeText}>Closed</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading messages…</Text>
                </View>
            ) : chats.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="chatbubbles-outline" size={72} color="#C7C7CC" />
                    <Text style={styles.emptyTitle}>No conversations yet</Text>
                    <Text style={styles.emptySubtitle}>
                        When you start exchanging skills, your chats will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.id}
                    renderItem={renderChatItem}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },

    // List
    listContent: {
        paddingVertical: 8,
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 80,
    },

    // Chat Item
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInactive: {
        backgroundColor: '#C7C7CC',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    chatInfo: {
        flex: 1,
        marginRight: 8,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
        marginRight: 8,
    },
    chatTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    chatRequest: {
        fontSize: 12,
        color: '#007AFF',
        marginBottom: 3,
        fontWeight: '500',
    },
    chatLastMessage: {
        fontSize: 14,
        color: '#8E8E93',
    },
    chatLastMessageInactive: {
        color: '#C7C7CC',
        fontStyle: 'italic',
    },
    chatChevron: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    closedBadge: {
        backgroundColor: '#FFE5E5',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    closedBadgeText: {
        color: '#FF3B30',
        fontSize: 11,
        fontWeight: '600',
    },

    // Empty/Loading
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#8E8E93',
    },
    emptyTitle: {
        marginTop: 20,
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        textAlign: 'center',
    },
    emptySubtitle: {
        marginTop: 10,
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default MessagesScreen;
