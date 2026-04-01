import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const complexityColors = {
    simple: '#34C759',
    medium: '#FF9500',
    advanced: '#FF6B35',
    expert: '#FF3B30',
};

const complexityLabel = {
    simple: 'Simple',
    medium: 'Medium',
    advanced: 'Advanced',
    expert: 'Expert',
};

const ExaminerDashboard = ({ navigation }) => {
    const [proposals, setProposals] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const headers = {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
            };

            const [queueRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/examiner/queue`, { headers }),
                fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
            ]);

            if (queueRes.ok) {
                const data = await queueRes.json();
                setProposals(data.proposals || []);
                setTotal(data.total || 0);
            }

            if (statsRes.ok) {
                const s = await statsRes.json();
                setStats(s);
            }
        } catch (err) {
            console.error('ExaminerDashboard fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refresh whenever screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderProposalCard = ({ item }) => {
        const proposer = item.proposerId || {};
        const request = item.exchangeRequestId || {};
        const requestOwner = request.userId || {};
        const complexity = request.complexity || 'medium';
        const color = complexityColors[complexity] || '#FF9500';
        const since = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ExaminerReviewDetail', { proposalId: item._id })}
            >
                {/* Top row */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardAvatar}>
                        <Text style={styles.cardAvatarText}>
                            {(proposer.fullName || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.cardHeaderText}>
                        <Text style={styles.cardProposerName} numberOfLines={1}>
                            {proposer.fullName || 'Unknown'}
                        </Text>
                        <Text style={styles.cardProposerEmail} numberOfLines={1}>
                            {proposer.email || ''}
                        </Text>
                    </View>
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                </View>

                {/* Request title */}
                <Text style={styles.cardRequestTitle} numberOfLines={2}>
                    📋 {request.title || 'Untitled Request'}
                </Text>

                {/* Meta row */}
                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="star-outline" size={14} color="#007AFF" />
                        <Text style={styles.metaText}>{request.estimatedCredits ?? '—'} credits</Text>
                    </View>
                    <View style={[styles.complexityTag, { backgroundColor: color + '18' }]}>
                        <View style={[styles.complexityDot, { backgroundColor: color }]} />
                        <Text style={[styles.complexityText, { color }]}>
                            {complexityLabel[complexity] || complexity}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                        <Text style={styles.metaTextGray}>{since}</Text>
                    </View>
                </View>

                {/* Cover letter preview */}
                <Text style={styles.coverPreview} numberOfLines={2}>
                    "{item.coverLetter}"
                </Text>

                {/* CTA */}
                <View style={styles.cardFooter}>
                    <Text style={styles.cardOwner}>
                        Requested by {requestOwner.fullName || 'User'}
                    </Text>
                    <View style={styles.reviewBtn}>
                        <Text style={styles.reviewBtnText}>Review</Text>
                        <Ionicons name="arrow-forward" size={14} color="#007AFF" />
                    </View>
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
                <Text style={styles.headerTitle}>Examination Queue</Text>
                <View style={styles.headerBadgeContainer}>
                    {total > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{total}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats banner */}
            {stats && (
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.statsBanner}
                >
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{total}</Text>
                        <Text style={styles.statLabel}>Pending{'\n'}Reviews</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.requests ?? '—'}</Text>
                        <Text style={styles.statLabel}>Total{'\n'}Requests</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.users ?? '—'}</Text>
                        <Text style={styles.statLabel}>Total{'\n'}Users</Text>
                    </View>
                </LinearGradient>
            )}

            {/* Queue list */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading queue…</Text>
                </View>
            ) : proposals.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="checkmark-circle-outline" size={72} color="#34C759" />
                    <Text style={styles.emptyTitle}>All caught up!</Text>
                    <Text style={styles.emptySubtitle}>No proposals are awaiting examination.</Text>
                </View>
            ) : (
                <FlatList
                    data={proposals}
                    keyExtractor={(item) => item._id}
                    renderItem={renderProposalCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#007AFF"
                        />
                    }
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
    },
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
    headerBadgeContainer: {
        minWidth: 32,
        alignItems: 'flex-end',
    },
    headerBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    headerBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Stats banner
    statsBanner: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 15,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // List
    listContent: {
        padding: 16,
        paddingTop: 12,
    },

    // Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardAvatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    cardHeaderText: {
        flex: 1,
    },
    cardProposerName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
    },
    cardProposerEmail: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 1,
    },
    pendingBadge: {
        backgroundColor: '#FFF3CD',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#FF9500',
    },
    pendingBadgeText: {
        color: '#FF9500',
        fontSize: 11,
        fontWeight: '700',
    },
    cardRequestTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 12,
        lineHeight: 21,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
    },
    metaTextGray: {
        fontSize: 13,
        color: '#8E8E93',
    },
    complexityTag: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 4,
    },
    complexityDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    complexityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    coverPreview: {
        fontSize: 13,
        color: '#636366',
        fontStyle: 'italic',
        lineHeight: 19,
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 10,
        marginBottom: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardOwner: {
        fontSize: 12,
        color: '#8E8E93',
    },
    reviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E8F0FE',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    reviewBtnText: {
        color: '#007AFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // Empty/Loading
    center: {
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
        fontSize: 22,
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

export default ExaminerDashboard;
