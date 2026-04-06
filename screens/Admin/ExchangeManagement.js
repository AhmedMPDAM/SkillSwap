import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, StatusBar, TextInput, FlatList,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const STATUS_CONFIG = {
    open: { color: '#1976D2', bg: '#E3F2FD', icon: 'radio-button-on', label: 'Open' },
    in_progress: { color: '#F57C00', bg: '#FFF3E0', icon: 'time-outline', label: 'In Progress' },
    completed: { color: '#388E3C', bg: '#E8F5E9', icon: 'checkmark-circle', label: 'Completed' },
    cancelled: { color: '#D32F2F', bg: '#FFEBEE', icon: 'close-circle', label: 'Cancelled' },
};

const ExchangeManagement = ({ navigation }) => {
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [statusCounts, setStatusCounts] = useState({});
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchExchanges = useCallback(async (page = 1, append = false) => {
        try {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            const token = await tokenStorage.getAccessToken();
            const params = new URLSearchParams({ page, limit: 20 });
            if (search.trim()) params.append('search', search.trim());
            if (selectedStatus) params.append('status', selectedStatus);

            const response = await fetch(`${API_BASE_URL}/api/admin/exchanges?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setExchanges(append ? prev => [...prev, ...data.exchanges] : data.exchanges);
                setPagination(data.pagination);
                setStatusCounts(data.statusCounts || {});
            }
        } catch (error) {
            console.error('Exchanges fetch error:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [search, selectedStatus]);

    useFocusEffect(
        useCallback(() => {
            fetchExchanges(1);
        }, [fetchExchanges])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchExchanges(1);
    };

    const loadMore = () => {
        if (pagination.page < pagination.pages && !loadingMore) {
            fetchExchanges(pagination.page + 1, true);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatDeadline = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Expired';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `${diffDays} days left`;
    };

    const renderExchangeCard = ({ item }) => {
        const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
        return (
            <TouchableOpacity
                style={styles.exchangeCard}
                onPress={() => navigation.navigate('ExchangeDetail', { exchangeId: item._id })}
                activeOpacity={0.7}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                </View>

                {/* Description */}
                {item.description ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Meta Row */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="code-slash-outline" size={14} color="#8E8E93" />
                        <Text style={styles.metaText}>{item.skillSearched}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="grid-outline" size={14} color="#8E8E93" />
                        <Text style={styles.metaText}>{item.category}</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Ionicons name="wallet-outline" size={14} color="#43e97b" />
                        <Text style={styles.statValue}>{item.estimatedCredits}</Text>
                        <Text style={styles.statLabel}>Credits</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Ionicons name="people-outline" size={14} color="#4facfe" />
                        <Text style={styles.statValue}>{item.proposalCount}</Text>
                        <Text style={styles.statLabel}>Proposals</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Ionicons name="eye-outline" size={14} color="#fa709a" />
                        <Text style={styles.statValue}>{item.views || 0}</Text>
                        <Text style={styles.statLabel}>Views</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Ionicons name="speedometer-outline" size={14} color="#667eea" />
                        <Text style={styles.statValue}>{item.complexity}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.ownerRow}>
                        <Ionicons name="person-circle-outline" size={16} color="#8E8E93" />
                        <Text style={styles.ownerName}>{item.userId?.fullName || 'Unknown'}</Text>
                    </View>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={12} color="#C7C7CC" />
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                        <Text style={styles.deadlineText}>• {formatDeadline(item.desiredDeadline)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const filters = [
        { key: null, label: 'All', count: statusCounts.all },
        { key: 'open', label: 'Open', count: statusCounts.open },
        { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
        { key: 'completed', label: 'Completed', count: statusCounts.completed },
        { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Exchange Management</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search-outline" size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title or skill..."
                        placeholderTextColor="#8E8E93"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={() => fetchExchanges(1)}
                        returnKeyType="search"
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => { setSearch(''); }}>
                            <Ionicons name="close-circle" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Status Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filters.map((f) => {
                        const isActive = selectedStatus === f.key;
                        return (
                            <TouchableOpacity
                                key={f.key || 'all'}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setSelectedStatus(f.key)}
                            >
                                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                    {f.label}
                                </Text>
                                {f.count != null ? (
                                    <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                                        <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                                            {f.count}
                                        </Text>
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Total */}
            <View style={styles.totalBar}>
                <Text style={styles.totalText}>{pagination.total} exchange{pagination.total !== 1 ? 's' : ''} found</Text>
            </View>

            {/* Exchange List */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={exchanges}
                    renderItem={renderExchangeCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#007AFF" style={{ padding: 16 }} /> : null}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="swap-horizontal-outline" size={64} color="#C7C7CC" />
                            <Text style={styles.emptyText}>No exchanges found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
    searchContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    searchInputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#000' },
    filterContainer: { paddingBottom: 8 },
    filterScroll: { paddingHorizontal: 20, gap: 8 },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA',
    },
    filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
    filterChipTextActive: { color: '#FFFFFF' },
    filterCountBadge: {
        backgroundColor: '#F2F2F7', borderRadius: 10, minWidth: 22, height: 20,
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
    },
    filterCountBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
    filterCountText: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },
    filterCountTextActive: { color: '#FFFFFF' },
    totalBar: { paddingHorizontal: 20, paddingVertical: 8 },
    totalText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },

    // Exchange Card
    exchangeCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#000', marginRight: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardDescription: { fontSize: 13, color: '#8E8E93', marginBottom: 10, lineHeight: 18 },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#8E8E93' },

    // Stats
    statsRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#F2F2F7', borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
    },
    statBox: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: 14, fontWeight: '700', color: '#000' },
    statLabel: { fontSize: 10, color: '#8E8E93' },
    statDivider: { width: 1, height: 24, backgroundColor: '#F2F2F7' },

    // Footer
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10,
    },
    ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ownerName: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 11, color: '#C7C7CC' },
    deadlineText: { fontSize: 11, color: '#FA709A', fontWeight: '500' },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
});

export default ExchangeManagement;
