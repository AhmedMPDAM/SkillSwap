import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, StatusBar, TextInput, Image, FlatList,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const ROLE_COLORS = {
    admin: { bg: '#FFEBEE', text: '#D32F2F', label: 'Admin' },
    examiner: { bg: '#E8EAF6', text: '#3F51B5', label: 'Examiner' },
    user: { bg: '#E8F5E9', text: '#388E3C', label: 'User' },
};

const UserManagement = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchUsers = useCallback(async (page = 1, append = false) => {
        try {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            const token = await tokenStorage.getAccessToken();
            const params = new URLSearchParams({ page, limit: 20 });
            if (search.trim()) params.append('search', search.trim());
            if (selectedRole) params.append('role', selectedRole);

            const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(append ? prev => [...prev, ...data.users] : data.users);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Users fetch error:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [search, selectedRole]);

    useFocusEffect(
        useCallback(() => {
            fetchUsers(1);
        }, [fetchUsers])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers(1);
    };

    const loadMore = () => {
        if (pagination.page < pagination.pages && !loadingMore) {
            fetchUsers(pagination.page + 1, true);
        }
    };

    const handleSearch = () => {
        fetchUsers(1);
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderRoleBadge = (role) => {
        const config = ROLE_COLORS[role] || ROLE_COLORS.user;
        return (
            <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.roleBadgeText, { color: config.text }]}>{config.label}</Text>
            </View>
        );
    };

    const renderUserCard = ({ item }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('UserDetail', { userId: item._id })}
            activeOpacity={0.7}
        >
            <View style={styles.userCardTop}>
                <View style={styles.userAvatarContainer}>
                    {item.profileImage ? (
                        <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
                    ) : (
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.userAvatar}
                        >
                            <Text style={styles.avatarInitial}>
                                {(item.fullName || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                        <Text style={styles.userName} numberOfLines={1}>{item.fullName}</Text>
                        {renderRoleBadge(item.role)}
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                    {item.location ? (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={12} color="#8E8E93" />
                            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                        </View>
                    ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </View>

            <View style={styles.userStatsRow}>
                <View style={styles.userStat}>
                    <Ionicons name="wallet-outline" size={16} color="#43e97b" />
                    <Text style={styles.userStatValue}>{item.credits}</Text>
                    <Text style={styles.userStatLabel}>Credits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.userStat}>
                    <Ionicons name="document-text-outline" size={16} color="#4facfe" />
                    <Text style={styles.userStatValue}>{item.requestsCount}</Text>
                    <Text style={styles.userStatLabel}>Requests</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.userStat}>
                    <Ionicons name="send-outline" size={16} color="#fa709a" />
                    <Text style={styles.userStatValue}>{item.proposalsCount}</Text>
                    <Text style={styles.userStatLabel}>Proposals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.userStat}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#38f9d7" />
                    <Text style={styles.userStatValue}>{item.completedCount}</Text>
                    <Text style={styles.userStatLabel}>Completed</Text>
                </View>
            </View>

            <Text style={styles.joinedDate}>Joined {formatDate(item.createdAt)}</Text>
        </TouchableOpacity>
    );

    const roles = [
        { key: null, label: 'All' },
        { key: 'user', label: 'Users' },
        { key: 'admin', label: 'Admins' },
        { key: 'examiner', label: 'Examiners' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search-outline" size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or email..."
                        placeholderTextColor="#8E8E93"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => { setSearch(''); }}>
                            <Ionicons name="close-circle" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Role Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {roles.map((r) => (
                        <TouchableOpacity
                            key={r.key || 'all'}
                            style={[styles.filterChip, selectedRole === r.key && styles.filterChipActive]}
                            onPress={() => setSelectedRole(r.key)}
                        >
                            <Text style={[styles.filterChipText, selectedRole === r.key && styles.filterChipTextActive]}>
                                {r.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Total Count */}
            <View style={styles.totalBar}>
                <Text style={styles.totalText}>{pagination.total} user{pagination.total !== 1 ? 's' : ''} found</Text>
            </View>

            {/* User List */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#007AFF" style={{ padding: 16 }} /> : null}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
                            <Text style={styles.emptyText}>No users found</Text>
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
    searchContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#F2F2F7' },
    searchInputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#000' },
    filterContainer: { paddingBottom: 8 },
    filterScroll: { paddingHorizontal: 20, gap: 8 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA',
    },
    filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
    filterChipTextActive: { color: '#FFFFFF' },
    totalBar: { paddingHorizontal: 20, paddingVertical: 8 },
    totalText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    userCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    userCardTop: { flexDirection: 'row', alignItems: 'center' },
    userAvatarContainer: { marginRight: 12 },
    userAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    userInfo: { flex: 1 },
    userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { fontSize: 16, fontWeight: '600', color: '#000', flexShrink: 1 },
    userEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    locationText: { fontSize: 12, color: '#8E8E93' },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    roleBadgeText: { fontSize: 11, fontWeight: '700' },
    userStatsRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: 14,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2F2F7',
    },
    userStat: { flex: 1, alignItems: 'center', gap: 2 },
    userStatValue: { fontSize: 15, fontWeight: '700', color: '#000' },
    userStatLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '500' },
    statDivider: { width: 1, height: 24, backgroundColor: '#F2F2F7' },
    joinedDate: { fontSize: 11, color: '#C7C7CC', marginTop: 10, textAlign: 'right' },
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
});

export default UserManagement;
