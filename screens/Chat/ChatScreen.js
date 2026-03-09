import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    Animated,
    Alert,
} from 'react-native';
import SubmissionPanel from './SubmissionPanel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    collection,
    doc,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    updateDoc,
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

const isExpired = (offerExpiresAt) => {
    if (!offerExpiresAt) return false;
    const expiryDate = offerExpiresAt.toDate
        ? offerExpiresAt.toDate()
        : new Date(offerExpiresAt);
    return expiryDate <= new Date();
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = React.memo(({ item, currentUserId }) => {
    const isMe = item.senderId === currentUserId;
    const isSystem = item.type === 'system';

    if (isSystem) {
        return (
            <View style={styles.systemMessageContainer}>
                <Text style={styles.systemMessageText}>{item.text}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
            {!isMe && (
                <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>
                        {(item.senderName || '?').charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                {!isMe && (
                    <Text style={styles.senderName}>{item.senderName || 'User'}</Text>
                )}
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {item.text}
                </Text>
                <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextThem]}>
                    {formatTime(item.createdAt)}
                </Text>
            </View>
        </View>
    );
});

// ─── ChatScreen ───────────────────────────────────────────────────────────────

const ChatScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { chatId: routeChatId, requestId, proposalId } = route.params || {};
    const chatId = routeChatId || proposalId; // fallback

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatMeta, setChatMeta] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatDisabled, setChatDisabled] = useState(false);
    const [expiryLabel, setExpiryLabel] = useState('');
    const [sending, setSending] = useState(false);
    const [isRequestOwner, setIsRequestOwner] = useState(false);
    const [isProposer, setIsProposer] = useState(false);
    const [exchangeCompleted, setExchangeCompleted] = useState(false);
    const [showSubmissionPanel, setShowSubmissionPanel] = useState(false);

    const flatListRef = useRef(null);
    const inputRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ── Load current user ────────────────────────────────────────────────────
    useEffect(() => {
        const loadUser = async () => {
            const uid = await tokenStorage.getUserId();
            setCurrentUserId(uid);

            try {
                const token = await tokenStorage.getAccessToken();
                const res = await fetch(`${API_BASE_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUserName(data.fullName || data.email || 'Me');
                }
            } catch (_) { }
        };
        loadUser();
    }, []);

    // ── Load chat metadata from Firestore ────────────────────────────────────
    useEffect(() => {
        if (!chatId) return;

        const fetchChatMeta = async () => {
            try {
                const chatRef = doc(db, 'chats', chatId);
                const snap = await getDoc(chatRef);

                if (!snap.exists()) {
                    Alert.alert('Error', 'Chat room not found.');
                    navigation.goBack();
                    return;
                }

                const data = snap.data();
                setChatMeta(data);

                const expired = isExpired(data.offerExpiresAt);
                const inactive = !data.isActive;

                if (expired || inactive) {
                    setChatDisabled(true);
                    setExpiryLabel(expired ? 'Offer has expired' : 'This chat has been closed');
                } else if (data.offerExpiresAt) {
                    const expiryDate = data.offerExpiresAt.toDate
                        ? data.offerExpiresAt.toDate()
                        : new Date(data.offerExpiresAt);
                    const diff = expiryDate - new Date();
                    const days = Math.ceil(diff / 86400000);
                    setExpiryLabel(
                        days <= 1
                            ? `Expires in less than 1 day`
                            : `Expires in ${days} days`
                    );
                }
            } catch (err) {
                console.error('Error fetching chat meta:', err);
            } finally {
                setLoading(false);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }
        };

        fetchChatMeta();

        const chatRef = doc(db, 'chats', chatId);
        const unsubMeta = onSnapshot(chatRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            const expired = isExpired(data.offerExpiresAt);
            if (!data.isActive || expired) {
                setChatDisabled(true);
                setExpiryLabel(!data.isActive ? 'This chat has been closed' : 'Offer has expired');
            }
        });

        return () => unsubMeta();
    }, [chatId]);

    // ── Real-time messages listener ──────────────────────────────────────────
    useEffect(() => {
        if (!chatId) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubMessages = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        return () => unsubMessages();
    }, [chatId]);

    // ── Send message ─────────────────────────────────────────────────────────
    const sendMessage = useCallback(async () => {
        const text = newMessage.trim();
        if (!text || !chatId || !currentUserId || chatDisabled || sending) return;

        if (chatMeta) {
            const expired = isExpired(chatMeta.offerExpiresAt);
            if (expired || !chatMeta.isActive) {
                setChatDisabled(true);
                return;
            }
        }

        setSending(true);
        setNewMessage('');

        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const messageData = {
                text,
                senderId: currentUserId,
                senderName: currentUserName,
                type: 'text',
                createdAt: serverTimestamp(),
            };

            await addDoc(messagesRef, messageData);

            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                lastMessageAt: serverTimestamp(),
                lastMessageText: text.length > 60 ? text.substring(0, 60) + '...' : text,
            });
        } catch (err) {
            console.error('Error sending message:', err);
            Alert.alert('Error', 'Failed to send message. Please try again.');
            setNewMessage(text);
        } finally {
            setSending(false);
        }
    }, [newMessage, chatId, currentUserId, currentUserName, chatDisabled, sending, chatMeta]);

    // ── Determine if current user is the request owner ────────────────────────
    useEffect(() => {
        if (chatMeta && currentUserId) {
            const ownerId = chatMeta.requestOwnerInfo?.id || chatMeta.requestOwnerId;
            const proposerId = chatMeta.proposerInfo?.id;
            setIsRequestOwner(ownerId === currentUserId);
            setIsProposer(proposerId === currentUserId);
            // Check if already completed
            if (chatMeta.status === 'completed' || chatMeta.isActive === false) {
                setExchangeCompleted(chatMeta.status === 'completed');
            } else {
                setShowSubmissionPanel(true);
            }
        }
    }, [chatMeta, currentUserId]);

    // ── Handle exchange completed (called from SubmissionPanel) ────────────────
    const handleExchangeCompleted = useCallback(() => {
        setExchangeCompleted(true);
        setChatDisabled(true);
        setShowSubmissionPanel(false);
        setExpiryLabel('Exchange completed ✓');
        // Close the chat room in Firestore
        try {
            const chatRef = doc(db, 'chats', chatId);
            updateDoc(chatRef, { isActive: false, status: 'completed' });
        } catch (_) { }
    }, [chatId]);

    // ── Derive other user's name for header ──────────────────────────────────
    const otherUserName = chatMeta
        ? chatMeta.participants?.find((id) => id !== currentUserId)
            ? currentUserId === chatMeta.requestOwnerInfo?.id
                ? chatMeta.proposerInfo?.name
                : chatMeta.requestOwnerInfo?.name
            : 'Chat'
        : 'Chat';

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading chat…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#007AFF" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>
                            {(otherUserName || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {otherUserName || 'Chat'}
                        </Text>
                        {chatMeta?.requestTitle ? (
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                📋 {chatMeta.requestTitle}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.headerRight} />
            </View>

            {/* ── Expiry Banner ── */}
            {expiryLabel ? (
                <View style={[styles.expiryBanner, chatDisabled && styles.expiryBannerDisabled]}>
                    <Ionicons
                        name={chatDisabled ? 'lock-closed' : 'time-outline'}
                        size={14}
                        color={chatDisabled ? '#FF3B30' : '#FF9500'}
                    />
                    <Text style={[styles.expiryText, chatDisabled && styles.expiryTextDisabled]}>
                        {expiryLabel}
                    </Text>
                </View>
            ) : null}

            {/* ── Submission Panel (work submission & review) ── */}
            {showSubmissionPanel && !exchangeCompleted && requestId && proposalId && (
                <SubmissionPanel
                    requestId={requestId}
                    proposalId={proposalId}
                    chatId={chatId}
                    isRequestOwner={isRequestOwner}
                    onExchangeCompleted={handleExchangeCompleted}
                    otherUserId={
                        isRequestOwner
                            ? chatMeta?.proposerInfo?.id || ''
                            : chatMeta?.requestOwnerInfo?.id || chatMeta?.requestOwnerId || ''
                    }
                />
            )}

            {/* ── Messages ── */}
            <Animated.View style={[styles.messagesWrapper, { opacity: fadeAnim }]}>
                {messages.length === 0 ? (
                    <View style={styles.emptyChat}>
                        <Ionicons name="chatbubbles-outline" size={60} color="#007AFF" style={{ opacity: 0.3 }} />
                        <Text style={styles.emptyChatText}>No messages yet</Text>
                        <Text style={styles.emptyChatSub}>Start the conversation!</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <MessageBubble item={item} currentUserId={currentUserId} />
                        )}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                )}
            </Animated.View>

            {/* ── Input area ── */}
            {chatDisabled ? (
                <View style={styles.disabledBar}>
                    <Ionicons name="lock-closed" size={18} color="#FF3B30" />
                    <Text style={styles.disabledText}>
                        This chat is now read-only — the offer has ended.
                    </Text>
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Type a message…"
                            placeholderTextColor="#8E8E93"
                            multiline
                            maxLength={1000}
                            returnKeyType="send"
                            onSubmitEditing={sendMessage}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
                            onPress={sendMessage}
                            disabled={!newMessage.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#8E8E93',
        marginTop: 12,
        fontSize: 15,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    backBtn: {
        padding: 8,
        borderRadius: 20,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    headerAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    headerTitle: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        maxWidth: 180,
    },
    headerSubtitle: {
        color: '#8E8E93',
        fontSize: 12,
        maxWidth: 180,
        marginTop: 1,
    },
    headerRight: {
        width: 36,
    },

    // Expiry banner
    expiryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        paddingVertical: 7,
        paddingHorizontal: 14,
        gap: 6,
    },
    expiryBannerDisabled: {
        backgroundColor: 'rgba(255, 59, 48, 0.08)',
    },
    expiryText: {
        color: '#FF9500',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    expiryTextDisabled: {
        color: '#FF3B30',
    },

    // Messages
    messagesWrapper: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    messageList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
        marginTop: 60,
    },
    emptyChatText: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyChatSub: {
        color: '#C7C7CC',
        fontSize: 13,
        marginTop: 6,
    },

    // Bubbles
    bubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    bubbleRowMe: {
        justifyContent: 'flex-end',
    },
    bubbleRowThem: {
        justifyContent: 'flex-start',
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        marginBottom: 2,
    },
    avatarSmallText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    bubbleMe: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    senderName: {
        color: '#007AFF',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 3,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 20,
    },
    bubbleTextMe: {
        color: '#FFFFFF',
    },
    bubbleTextThem: {
        color: '#000000',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
    },
    timeTextMe: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'right',
    },
    timeTextThem: {
        color: '#8E8E93',
        textAlign: 'left',
    },

    // System message
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    systemMessageText: {
        color: '#8E8E93',
        fontSize: 12,
        backgroundColor: 'rgba(0,122,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },

    // Input
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    input: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        color: '#000000',
        fontSize: 15,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        marginRight: 10,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    sendBtnDisabled: {
        backgroundColor: '#C7C7CC',
        shadowOpacity: 0,
        elevation: 0,
    },

    // Disabled bar
    disabledBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,59,48,0.08)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,59,48,0.15)',
        gap: 8,
    },
    disabledText: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
        textAlign: 'center',
    },
});

export default ChatScreen;
