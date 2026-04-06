import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Dimensions,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../../config/apiConfig';
import { tokenStorage } from '../../utils/tokenStorage';

const { width } = Dimensions.get('window');

// Category color palette
const CATEGORY_COLORS = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'],
    ['#e0c3fc', '#8ec5fc'],
    ['#f5576c', '#ff6a88'],
    ['#667eea', '#6c5ce7'],
];

const CATEGORY_ICONS = {
    'Technology': 'code-slash-outline',
    'Design': 'color-palette-outline',
    'Marketing': 'megaphone-outline',
    'Business': 'briefcase-outline',
    'Music': 'musical-notes-outline',
    'Photography': 'camera-outline',
    'Writing': 'create-outline',
    'Education': 'school-outline',
    'Fitness': 'fitness-outline',
    'Cooking': 'restaurant-outline',
    'Language': 'language-outline',
    'Art': 'brush-outline',
    'Finance': 'cash-outline',
    'Health': 'heart-outline',
    'Science': 'flask-outline',
    'default': 'apps-outline',
};

const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
};

const getCategoryColors = (index) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

const RATING_FILTERS = [
    { label: 'All', value: null },
    { label: '4.5+', value: 4.5 },
    { label: '4.0+', value: 4.0 },
    { label: '3.5+', value: 3.5 },
    { label: '3.0+', value: 3.0 },
];

const TopRatedScreen = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [users, setUsers] = useState([]);
    const [groupedData, setGroupedData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRatingFilter, setSelectedRatingFilter] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [minExchanges, setMinExchanges] = useState(null);
    const [totalResults, setTotalResults] = useState(0);

    const searchTimeout = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            const data = await response.json();
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    // Fetch top-rated users
    const fetchTopRated = useCallback(async (options = {}) => {
        try {
            const token = await tokenStorage.getAccessToken();
            const params = new URLSearchParams();

            if (options.category && options.category !== 'All') {
                params.append('category', options.category);
            }
            if (options.search) {
                params.append('search', options.search);
            }
            if (options.minRating) {
                params.append('minRating', options.minRating);
            }
            if (options.minExchanges) {
                params.append('minExchanges', options.minExchanges);
            }
            params.append('limit', '50');

            const url = `${API_BASE_URL}/api/profile/top-rated?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            const data = await response.json();
            setUsers(data.users || []);
            setTotalResults(data.total || 0);
        } catch (error) {
            console.error('Error fetching top rated users:', error);
            setUsers([]);
        }
    }, []);

    // Fetch grouped data
    const fetchGroupedData = useCallback(async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/profile/top-rated/by-category`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            const data = await response.json();
            setGroupedData(data || []);
        } catch (error) {
            console.error('Error fetching grouped data:', error);
            setGroupedData([]);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCategories(), fetchTopRated(), fetchGroupedData()]);
            setLoading(false);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        };
        loadData();
    }, []);

    // Reload when filters change
    useEffect(() => {
        if (!loading) {
            fetchTopRated({
                category: selectedCategory,
                search: searchQuery,
                minRating: selectedRatingFilter,
                minExchanges: minExchanges,
            });
        }
    }, [selectedCategory, selectedRatingFilter, minExchanges]);

    // Debounced search
    const handleSearchChange = (text) => {
        setSearchQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchTopRated({
                category: selectedCategory,
                search: text,
                minRating: selectedRatingFilter,
                minExchanges: minExchanges,
            });
        }, 500);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchCategories(),
            fetchTopRated({
                category: selectedCategory,
                search: searchQuery,
                minRating: selectedRatingFilter,
                minExchanges: minExchanges,
            }),
            fetchGroupedData(),
        ]);
        setRefreshing(false);
    };

    const resetFilters = () => {
        setSelectedCategory('All');
        setSelectedRatingFilter(null);
        setMinExchanges(null);
        setSearchQuery('');
        setShowFilterModal(false);
        fetchTopRated();
    };

    const hasActiveFilters = selectedCategory !== 'All' || selectedRatingFilter || minExchanges || searchQuery;

    // Render star rating component
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Ionicons key={i} name="star" size={12} color="#FFD700" />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Ionicons key={i} name="star-half" size={12} color="#FFD700" />
                );
            } else {
                stars.push(
                    <Ionicons key={i} name="star-outline" size={12} color="#D1D1D6" />
                );
            }
        }
        return stars;
    };

    const renderUserCard = (item, index, showRank = false) => {
        const profileImageUri = item.profileImage
            ? item.profileImage.startsWith('http')
                ? item.profileImage
                : `${API_BASE_URL}/${item.profileImage}`
            : null;

        return (
            <TouchableOpacity
                key={item._id}
                activeOpacity={0.85}
                style={styles.userCard}
                onPress={() => navigation.navigate('UserPublicProfile', { userId: item._id })}
            >
                {showRank && (
                    <View style={[
                        styles.rankBadge,
                        index === 0 ? styles.goldRank : index === 1 ? styles.silverRank : index === 2 ? styles.bronzeRank : styles.defaultRank,
                    ]}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                )}
                <View style={styles.userImageWrapper}>
                    {profileImageUri ? (
                        <Image source={{ uri: profileImageUri }} style={styles.userImage} />
                    ) : (
                        <View style={[styles.userImage, styles.userImagePlaceholder]}>
                            <Ionicons name="person" size={28} color="#C7C7CC" />
                        </View>
                    )}
                    {index < 3 && showRank && (
                        <View style={styles.crownContainer}>
                            <Ionicons
                                name="trophy"
                                size={14}
                                color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                            />
                        </View>
                    )}
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{item.fullName}</Text>
                    {item.skills && item.skills.length > 0 && (
                        <Text style={styles.userSkills} numberOfLines={1}>
                            {item.skills.slice(0, 3).join(' · ')}
                        </Text>
                    )}
                    <View style={styles.ratingRow}>
                        <View style={styles.starsContainer}>
                            {renderStars(item.averageRating)}
                        </View>
                        <Text style={styles.ratingValue}>{item.averageRating}</Text>
                        <View style={styles.ratingDivider} />
                        <Ionicons name="swap-horizontal" size={12} color="#8E8E93" />
                        <Text style={styles.exchangeCount}>{item.totalRatings}</Text>
                    </View>
                    {item.categories && item.categories.length > 0 && (
                        <View style={styles.categoryTags}>
                            {item.categories.slice(0, 2).map((cat, i) => (
                                <View key={i} style={styles.categoryTag}>
                                    <Text style={styles.categoryTagText}>{cat}</Text>
                                </View>
                            ))}
                            {item.categories.length > 2 && (
                                <Text style={styles.moreCategoriesText}>+{item.categories.length - 2}</Text>
                            )}
                        </View>
                    )}
                </View>
                <View style={styles.viewButton}>
                    <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderCategorySection = (categoryData, catIndex) => {
        const colors = getCategoryColors(catIndex);
        const icon = getCategoryIcon(categoryData.category);

        return (
            <View key={categoryData.category} style={styles.categorySection}>
                <TouchableOpacity
                    style={styles.categorySectionHeader}
                    onPress={() => {
                        setSelectedCategory(categoryData.category);
                    }}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categorySectionGradient}
                    >
                        <Ionicons name={icon} size={20} color="#FFFFFF" />
                        <Text style={styles.categorySectionTitle}>{categoryData.category}</Text>
                        <View style={styles.categorySectionCount}>
                            <Text style={styles.categorySectionCountText}>{categoryData.users.length}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                </TouchableOpacity>
                {categoryData.users.slice(0, 3).map((user, index) =>
                    renderUserCard(user, index, true)
                )}
            </View>
        );
    };

    // Filter Modal
    const renderFilterModal = () => (
        <Modal
            visible={showFilterModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowFilterModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Ionicons name="close-circle" size={28} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {/* Rating Filter */}
                    <Text style={styles.filterLabel}>Minimum Rating</Text>
                    <View style={styles.filterOptions}>
                        {RATING_FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter.label}
                                style={[
                                    styles.filterChip,
                                    selectedRatingFilter === filter.value && styles.filterChipActive,
                                ]}
                                onPress={() => setSelectedRatingFilter(filter.value)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    selectedRatingFilter === filter.value && styles.filterChipTextActive,
                                ]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Minimum Exchanges Filter */}
                    <Text style={styles.filterLabel}>Minimum Exchanges</Text>
                    <View style={styles.filterOptions}>
                        {[null, 1, 3, 5, 10].map((val) => (
                            <TouchableOpacity
                                key={val === null ? 'all' : val}
                                style={[
                                    styles.filterChip,
                                    minExchanges === val && styles.filterChipActive,
                                ]}
                                onPress={() => setMinExchanges(val)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    minExchanges === val && styles.filterChipTextActive,
                                ]}>
                                    {val === null ? 'All' : `${val}+`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                            <Text style={styles.resetButtonText}>Reset All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <LinearGradient
                                colors={['#007AFF', '#0051D5']}
                                style={styles.applyButtonGradient}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading top rated users...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Top Rated</Text>
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="options-outline" size={22} color={hasActiveFilters ? '#FFFFFF' : '#007AFF'} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, skill..."
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearchChange(''); }}>
                            <Ionicons name="close-circle" size={20} color="#C7C7CC" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Tabs */}
            <View style={styles.categoryTabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryTabsContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.categoryTab,
                            selectedCategory === 'All' && styles.categoryTabActive,
                        ]}
                        onPress={() => setSelectedCategory('All')}
                    >
                        <Ionicons
                            name="grid-outline"
                            size={16}
                            color={selectedCategory === 'All' ? '#FFFFFF' : '#007AFF'}
                        />
                        <Text style={[
                            styles.categoryTabText,
                            selectedCategory === 'All' && styles.categoryTabTextActive,
                        ]}>All</Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat._id}
                            style={[
                                styles.categoryTab,
                                selectedCategory === cat.name && styles.categoryTabActive,
                            ]}
                            onPress={() => setSelectedCategory(cat.name)}
                        >
                            <Ionicons
                                name={getCategoryIcon(cat.name)}
                                size={16}
                                color={selectedCategory === cat.name ? '#FFFFFF' : '#007AFF'}
                            />
                            <Text style={[
                                styles.categoryTabText,
                                selectedCategory === cat.name && styles.categoryTabTextActive,
                            ]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Active Filters Indicator */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersBar}>
                    <Text style={styles.activeFiltersText}>
                        {totalResults} result{totalResults !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                        <Text style={styles.clearFiltersText}>Clear all</Text>
                        <Ionicons name="close" size={14} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            <Animated.View style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                    }
                >
                    {selectedCategory === 'All' && !searchQuery && !selectedRatingFilter && !minExchanges ? (
                        // Show grouped by category view
                        groupedData.length > 0 ? (
                            groupedData.map((catData, index) => renderCategorySection(catData, index))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="trophy-outline" size={64} color="#D1D1D6" />
                                <Text style={styles.emptyTitle}>No Ratings Yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    Complete some exchanges and rate users to see them here!
                                </Text>
                            </View>
                        )
                    ) : (
                        // Show filtered flat list
                        users.length > 0 ? (
                            <View>
                                {selectedCategory !== 'All' && (
                                    <LinearGradient
                                        colors={getCategoryColors(categories.findIndex(c => c.name === selectedCategory))}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.selectedCategoryBanner}
                                    >
                                        <Ionicons name={getCategoryIcon(selectedCategory)} size={24} color="#FFFFFF" />
                                        <View style={styles.bannerTextContainer}>
                                            <Text style={styles.bannerTitle}>{selectedCategory}</Text>
                                            <Text style={styles.bannerSubtitle}>
                                                {totalResults} top rated user{totalResults !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                )}
                                {users.map((user, index) => renderUserCard(user, index, true))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={64} color="#D1D1D6" />
                                <Text style={styles.emptyTitle}>No Results</Text>
                                <Text style={styles.emptySubtitle}>
                                    Try adjusting your filters or search query
                                </Text>
                                <TouchableOpacity style={styles.clearButton} onPress={resetFilters}>
                                    <Text style={styles.clearButtonText}>Clear Filters</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </Animated.View>

            {renderFilterModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000000',
    },
    filterButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    // Search
    searchSection: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#000000',
    },
    // Category Tabs
    categoryTabsWrapper: {
        marginBottom: 8,
    },
    categoryTabsContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    categoryTabActive: {
        backgroundColor: '#007AFF',
    },
    categoryTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    categoryTabTextActive: {
        color: '#FFFFFF',
    },
    // Active Filters Bar
    activeFiltersBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    activeFiltersText: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearFiltersText: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
    },
    // Content
    scrollContent: {
        paddingBottom: 20,
    },
    // Category Section (Grouped View)
    categorySection: {
        marginBottom: 24,
    },
    categorySectionHeader: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    categorySectionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 10,
    },
    categorySectionTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    categorySectionCount: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    categorySectionCountText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // User Card
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 18,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    rankBadge: {
        position: 'absolute',
        top: -4,
        left: -4,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    goldRank: {
        backgroundColor: '#FFD700',
    },
    silverRank: {
        backgroundColor: '#C0C0C0',
    },
    bronzeRank: {
        backgroundColor: '#CD7F32',
    },
    defaultRank: {
        backgroundColor: '#E5E5EA',
    },
    rankText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    userImageWrapper: {
        position: 'relative',
    },
    userImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F2F2F7',
    },
    userImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    crownContainer: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 2,
    },
    userSkills: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 1,
    },
    ratingValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFD700',
        marginLeft: 4,
    },
    ratingDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 6,
    },
    exchangeCount: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 2,
    },
    categoryTags: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryTag: {
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    categoryTagText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
    },
    moreCategoriesText: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
    },
    viewButton: {
        padding: 8,
    },
    // Banner
    selectedCategoryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 18,
        borderRadius: 18,
        gap: 12,
    },
    bannerTextContainer: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    bannerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    clearButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 16,
    },
    clearButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    bottomSpacer: {
        height: 40,
    },
    // Filter Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000000',
    },
    filterLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 12,
        marginTop: 8,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
    },
    filterChipActive: {
        backgroundColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#8E8E93',
    },
    applyButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    applyButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default TopRatedScreen;
