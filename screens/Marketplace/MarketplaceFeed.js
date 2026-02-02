import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const MarketplaceFeed = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        level: '',
        location: '',
        minCredits: '',
        maxCredits: '',
    });

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async (pageNum = 1, reset = false) => {
        try {
            const token = await tokenStorage.getAccessToken();
            if (!token) {
                Alert.alert('Error', 'Please login to view marketplace');
                navigation.navigate('Login');
                return;
            }

            let url = `${API_BASE_URL}/api/marketplace/requests/feed?page=${pageNum}&limit=10`;
            
            if (searchQuery || Object.values(filters).some(f => f)) {
                url = `${API_BASE_URL}/api/marketplace/requests/search?page=${pageNum}&limit=10`;
                if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
                if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
                if (filters.level) url += `&level=${encodeURIComponent(filters.level)}`;
                if (filters.location) url += `&location=${encodeURIComponent(filters.location)}`;
                if (filters.minCredits) url += `&minCredits=${filters.minCredits}`;
                if (filters.maxCredits) url += `&maxCredits=${filters.maxCredits}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
                },
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', responseText.substring(0, 200));
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                if (reset) {
                    setRequests(data.requests || []);
                } else {
                    setRequests(prev => [...prev, ...(data.requests || [])]);
                }
                setHasMore(data.pagination?.page < data.pagination?.pages);
            } else {
                Alert.alert('Error', data.message || 'Failed to load requests');
            }
        } catch (error) {
            console.error('Error loading requests:', error);
            Alert.alert('Error', 'Failed to load marketplace requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadRequests(1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadRequests(nextPage);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadRequests(1, true);
    };

    const applyFilters = () => {
        setFiltersVisible(false);
        setPage(1);
        loadRequests(1, true);
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            level: '',
            location: '',
            minCredits: '',
            maxCredits: '',
        });
        setSearchQuery('');
        setPage(1);
        loadRequests(1, true);
    };

    const renderRequestCard = ({ item }) => (
        <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('ExchangeRequestDetail', { requestId: item._id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    {item.userId?.profileImage ? (
                        <Image source={{ uri: item.userId.profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#007AFF" />
                        </View>
                    )}
                    <View>
                        <Text style={styles.userName}>{item.userId?.fullName || 'User'}</Text>
                        <Text style={styles.location}>{item.location || 'Remote'}</Text>
                    </View>
                </View>
                <View style={styles.creditsBadge}>
                    <Ionicons name="star" size={14} color="#FFA500" />
                    <Text style={styles.creditsText}>{item.estimatedCredits}</Text>
                </View>
            </View>

            <Text style={styles.requestTitle}>{item.title}</Text>
            <Text style={styles.requestDescription} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.skillTags}>
                <View style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{item.skillSearched}</Text>
                </View>
                <View style={[styles.levelTag, styles[`level${item.level}`]]}>
                    <Text style={styles.levelTagText}>{item.level}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={14} color="#8E8E93" />
                    <Text style={styles.footerText}>{item.estimatedDuration}h</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                    <Text style={styles.footerText}>
                        {new Date(item.desiredDeadline).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="eye-outline" size={14} color="#8E8E93" />
                    <Text style={styles.footerText}>{item.views || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && requests.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Marketplace</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateExchangeRequest')}>
                        <Ionicons name="add-circle" size={28} color="#007AFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Marketplace</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreateExchangeRequest')}>
                    <Ionicons name="add-circle" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search requests..."
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch(); }}>
                            <Ionicons name="close-circle" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFiltersVisible(!filtersVisible)}
                >
                    <Ionicons name="filter" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {filtersVisible && (
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterRow}>
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Category"
                                value={filters.category}
                                onChangeText={(text) => setFilters({ ...filters, category: text })}
                            />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Level"
                                value={filters.level}
                                onChangeText={(text) => setFilters({ ...filters, level: text })}
                            />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Location"
                                value={filters.location}
                                onChangeText={(text) => setFilters({ ...filters, location: text })}
                            />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Min Credits"
                                value={filters.minCredits}
                                onChangeText={(text) => setFilters({ ...filters, minCredits: text })}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Max Credits"
                                value={filters.maxCredits}
                                onChangeText={(text) => setFilters({ ...filters, maxCredits: text })}
                                keyboardType="numeric"
                            />
                        </View>
                    </ScrollView>
                    <View style={styles.filterActions}>
                        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                data={requests}
                renderItem={renderRequestCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={64} color="#C7C7CC" />
                        <Text style={styles.emptyText}>No requests found</Text>
                        <Text style={styles.emptySubtext}>Be the first to create a request!</Text>
                    </View>
                }
                ListFooterComponent={
                    hasMore && requests.length > 0 ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        gap: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    filterInput: {
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        minWidth: 100,
    },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    clearButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    clearButtonText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
    },
    location: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF4E6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    creditsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF8C00',
    },
    requestTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
    },
    requestDescription: {
        fontSize: 14,
        color: '#8E8E93',
        lineHeight: 20,
        marginBottom: 12,
    },
    skillTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    skillTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    skillTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
    },
    levelTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    levelbeginner: { backgroundColor: '#E8F5E9' },
    levelintermediate: { backgroundColor: '#FFF3E0' },
    leveladvanced: { backgroundColor: '#E3F2FD' },
    levelexpert: { backgroundColor: '#F3E5F5' },
    levelTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#C7C7CC',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
    },
});

export default MarketplaceFeed;

