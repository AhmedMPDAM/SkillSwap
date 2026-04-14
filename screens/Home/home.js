import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Alert,
    Image,
    TextInput,
    FlatList,
    Animated,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import { useSocket } from '../../context/SocketContext';
import { API_BASE_URL } from '../../config/apiConfig';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userCredits, setUserCredits] = useState(null);
    const [userName, setUserName] = useState('');
    const { unreadCount, clearNotifications, notifications } = useSocket();
    const [userRole, setUserRole] = useState(null);
    const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
    const scrollViewRef = useRef(null);

    // Dynamic data states
    const [marketplaceItems, setMarketplaceItems] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [loadingCredits, setLoadingCredits] = useState(true);
    const [loadingMarketplace, setLoadingMarketplace] = useState(true);
    const [loadingTopUsers, setLoadingTopUsers] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Static data
    const features = [
        { id: '1', title: 'New Mentorship Program', color: ['#4facfe', '#00f2fe'], description: 'Connect with experienced mentors' },
        { id: '2', title: 'Advanced Skill Analytics', color: ['#43e97b', '#38f9d7'], description: 'Track your progress' },
        { id: '3', title: 'Community Events', color: ['#fa709a', '#fee140'], description: 'Join live sessions' },
    ];

    const quickActions = [
        { id: '1', label: 'Find Skills', icon: 'search-outline', color: '#4facfe' },
        { id: '2', label: 'Messages', icon: 'chatbubble-outline', color: '#fa709a' },
        { id: '3', label: 'Settings', icon: 'settings-outline', color: '#ffa502' },
    ];

    // ── Fetch user profile (credits + name) ──────────────────────────────
    const fetchUserProfile = useCallback(async () => {
        try {
            setLoadingCredits(true);
            const token = await tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserCredits(data.credits ?? 0);
                setUserName(data.fullName || '');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoadingCredits(false);
        }
    }, []);

    // ── Fetch marketplace requests ───────────────────────────────────────
    const fetchMarketplace = useCallback(async () => {
        try {
            setLoadingMarketplace(true);
            const token = await tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch(
                `${API_BASE_URL}/api/marketplace/requests/feed?page=1&limit=6`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'ngrok-skip-browser-warning': 'true',
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setMarketplaceItems(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching marketplace:', error);
        } finally {
            setLoadingMarketplace(false);
        }
    }, []);

    // ── Fetch top-rated users ────────────────────────────────────────────
    const fetchTopUsers = useCallback(async () => {
        try {
            setLoadingTopUsers(true);
            const token = await tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch(
                `${API_BASE_URL}/api/profile/top-rated?limit=3`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'ngrok-skip-browser-warning': 'true',
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setTopUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching top users:', error);
        } finally {
            setLoadingTopUsers(false);
        }
    }, []);

    // ── Initial load & refresh on focus ──────────────────────────────────
    const loadAllData = useCallback(async () => {
        const role = await tokenStorage.getUserRole();
        setUserRole(role);
        await Promise.all([fetchUserProfile(), fetchMarketplace(), fetchTopUsers()]);
    }, [fetchUserProfile, fetchMarketplace, fetchTopUsers]);

    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [loadAllData]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    }, [loadAllData]);

    // ── Derive recent activity from real notifications ───────────────────
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'proposal_received': return 'newspaper-outline';
            case 'chat_ready': return 'chatbubble-outline';
            case 'examiner_approved':
            case 'examiner_approved_owner': return 'checkmark-circle-outline';
            default: return 'notifications-outline';
        }
    };

    const getActivityIconColor = (type) => {
        switch (type) {
            case 'proposal_received': return '#007AFF';
            case 'chat_ready': return '#34C759';
            case 'examiner_approved':
            case 'examiner_approved_owner': return '#667eea';
            default: return '#007AFF';
        }
    };

    const recentActivity = (notifications || []).slice(0, 5);

    // ── Helper to build image URLs ───────────────────────────────────────
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        let cleanPath = imagePath.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('uploads/')) return `${API_BASE_URL}/${cleanPath}`;
        return `${API_BASE_URL}/uploads/${cleanPath}`;
    };

    // Toggle Menu with Animation
    const toggleMenu = () => {
        if (menuVisible) {
            Animated.timing(slideAnim, {
                toValue: -width * 0.75,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setMenuVisible(false));
        } else {
            setMenuVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleMenuNavigation = (screen) => {
        toggleMenu();
        navigation.navigate(screen);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: async () => {
                        try {
                            // Clear this user's notifications before switching accounts
                            clearNotifications();

                            // Clear all tokens from AsyncStorage
                            await tokenStorage.clearTokens();

                            // Close menu
                            toggleMenu();

                            // Navigate to login screen and reset navigation stack
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleNextFeature = () => {
        if (currentFeatureIndex < features.length - 1) {
            setCurrentFeatureIndex(prev => prev + 1);
        } else {
            setCurrentFeatureIndex(0);
        }
    };

    const handlePrevFeature = () => {
        if (currentFeatureIndex > 0) {
            setCurrentFeatureIndex(prev => prev - 1);
        } else {
            setCurrentFeatureIndex(features.length - 1);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length > 0) {
            navigation.navigate('Marketplace');
        }
    };

    const handleQuickAction = (action) => {
        switch (action) {
            case 'Find Skills':
                navigation.navigate('Marketplace');
                break;

            case 'Messages':
                navigation.navigate('Messages');
                break;
            case 'Settings':
                navigation.navigate('Settings');
                break;
            default:
                break;
        }
    };

    const currentFeature = features[currentFeatureIndex];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* Side Menu Drawer */}
            {menuVisible && (
                <TouchableOpacity
                    style={styles.menuBackdrop}
                    activeOpacity={1}
                    onPress={toggleMenu}
                />
            )}

            <Animated.View
                style={[
                    styles.sideMenu,
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <View style={styles.menuHeader}>
                    <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                        <Ionicons name="close-outline" size={28} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.menuHeaderTitle}>Menu</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView
                    style={styles.menuContent}
                    showsVerticalScrollIndicator={false}
                >
                    {userRole === 'admin' && (
                        <TouchableOpacity
                            style={styles.menuItemFull}
                            onPress={() => handleMenuNavigation('AdminDashboard')}
                        >
                            <Ionicons name="shield-checkmark-outline" size={24} color="#FF3B30" />
                            <Text style={styles.menuItemText}>Admin Dashboard</Text>
                        </TouchableOpacity>
                    )}

                    {(userRole === 'examiner' || userRole === 'admin') && (
                        <TouchableOpacity
                            style={styles.menuItemFull}
                            onPress={() => handleMenuNavigation('ExaminerDashboard')}
                        >
                            <Ionicons name="eye-outline" size={24} color="#667eea" />
                            <Text style={styles.menuItemText}>Examination Queue</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.menuItemFull}
                        onPress={() => handleMenuNavigation('Profile')}
                    >
                        <Ionicons name="person-outline" size={24} color="#007AFF" />
                        <Text style={styles.menuItemText}>My Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItemFull}
                        onPress={() => handleMenuNavigation('Marketplace')}
                    >
                        <Ionicons name="cart-outline" size={24} color="#007AFF" />
                        <Text style={styles.menuItemText}>Marketplace</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItemFull}
                        onPress={() => handleMenuNavigation('TopRated')}
                    >
                        <Ionicons name="star-outline" size={24} color="#FFD700" />
                        <Text style={styles.menuItemText}>Top Rated Users</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItemFull}
                        onPress={() => handleMenuNavigation('Messages')}
                    >
                        <Ionicons name="chatbubble-outline" size={24} color="#43e97b" />
                        <Text style={styles.menuItemText}>Messages</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItemFull}
                        onPress={() => handleMenuNavigation('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color="#ffa502" />
                        <Text style={styles.menuItemText}>Settings</Text>
                    </TouchableOpacity>



                </ScrollView>

                {/* Disconnect Button */}
                <TouchableOpacity
                    style={[styles.disconnectButton]}
                    onPress={handleLogout}
                >
                    <Ionicons
                        name={"log-out-outline"}
                        size={24}
                        color="#FF3B30"
                    />
                    <Text style={styles.disconnectButtonText}>
                        Disconnect
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleMenu}>
                    <Ionicons name="menu-outline" size={32} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Skill Swap</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={28} color="#007AFF" />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-circle-outline" size={32} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                }
            >

                {/* Credit Balance Card */}
                <View style={styles.section}>
                    <LinearGradient
                        colors={['#007AFF', '#0051D5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.creditCard}
                    >
                        <View style={styles.creditContent}>
                            <View>
                                <Text style={styles.creditLabel}>Available Credits</Text>
                                {loadingCredits ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 8 }} />
                                ) : (
                                    <Text style={styles.creditAmount}>{userCredits ?? '—'}</Text>
                                )}
                            </View>
                            <TouchableOpacity style={styles.addCreditsButton}>
                                <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#8E8E93" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search skills..."
                            placeholderTextColor="#8E8E93"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                    <FlatList
                        data={quickActions}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.quickActionCard}
                                onPress={() => handleQuickAction(item.label)}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={24} color={item.color} />
                                </View>
                                <Text style={styles.actionLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item.id}
                        numColumns={4}
                        scrollEnabled={false}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                    />
                </View>

                {/* Features Carousel */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Latest Features</Text>
                    <View style={styles.carouselContainer}>
                        <TouchableOpacity onPress={handlePrevFeature} style={styles.arrowButton}>
                            <Ionicons name="chevron-back" size={24} color="#007AFF" />
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.9} style={styles.featureCardContainer}>
                            <LinearGradient
                                colors={currentFeature.color}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.featureCard}
                            >
                                <View>
                                    <Text style={styles.featureTitle}>{currentFeature.title}</Text>
                                    <Text style={styles.featureDescription}>{currentFeature.description}</Text>
                                </View>
                                <View style={styles.featureButton}>
                                    <Text style={styles.featureButtonText}>Explore</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleNextFeature} style={styles.arrowButton}>
                            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.paginationDots}>
                        {features.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentFeatureIndex === index && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Marketplace Preview Section — Dynamic */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Marketplace</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {loadingMarketplace ? (
                        <ActivityIndicator size="small" color="#007AFF" style={{ paddingVertical: 30 }} />
                    ) : marketplaceItems.length === 0 ? (
                        <View style={styles.emptySection}>
                            <Ionicons name="cart-outline" size={40} color="#D1D1D6" />
                            <Text style={styles.emptySectionText}>No marketplace requests yet</Text>
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalScrollContent}
                        >
                            {marketplaceItems.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    activeOpacity={0.9}
                                    style={styles.marketCard}
                                    onPress={() => navigation.navigate('ExchangeRequestDetail', { requestId: item._id })}
                                >
                                    <View style={styles.marketImagePlaceholder}>
                                        <Ionicons name="briefcase-outline" size={32} color="#007AFF" />
                                    </View>
                                    <View style={styles.marketContent}>
                                        <Text style={styles.marketCategory}>{item.category || item.skillSearched || 'Skill'}</Text>
                                        <Text style={styles.marketTitle} numberOfLines={1}>{item.title}</Text>
                                        <View style={styles.marketCreditsRow}>
                                            <Ionicons name="star" size={12} color="#FFA500" />
                                            <Text style={styles.marketPrice}>{item.estimatedCredits} Credits</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Top Rated Users Preview Section — Dynamic */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top Rated Users</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TopRated')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {loadingTopUsers ? (
                        <ActivityIndicator size="small" color="#007AFF" style={{ paddingVertical: 30 }} />
                    ) : topUsers.length === 0 ? (
                        <View style={styles.emptySection}>
                            <Ionicons name="trophy-outline" size={40} color="#D1D1D6" />
                            <Text style={styles.emptySectionText}>No rated users yet</Text>
                        </View>
                    ) : (
                        topUsers.map((user) => {
                            const profileImageUri = getImageUrl(user.profileImage);
                            return (
                                <TouchableOpacity
                                    key={user._id}
                                    activeOpacity={0.9}
                                    style={styles.userCard}
                                    onPress={() => navigation.navigate('UserPublicProfile', { userId: user._id })}
                                >
                                    <View style={styles.userImageContainer}>
                                        {profileImageUri ? (
                                            <Image source={{ uri: profileImageUri }} style={styles.userImage} />
                                        ) : (
                                            <View style={[styles.userImage, styles.userImagePlaceholder]}>
                                                <Ionicons name="person" size={24} color="#C7C7CC" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName} numberOfLines={1}>{user.fullName}</Text>
                                        <Text style={styles.userRole} numberOfLines={1}>
                                            {user.skills && user.skills.length > 0 ? user.skills.slice(0, 2).join(' · ') : 'Member'}
                                        </Text>
                                        <View style={styles.ratingContainer}>
                                            <Ionicons name="star" size={14} color="#FFD700" />
                                            <Text style={styles.userRating}>{user.averageRating}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewProfileButton}
                                        onPress={() => navigation.navigate('UserPublicProfile', { userId: user._id })}
                                    >
                                        <Text style={styles.viewProfileText}>View</Text>
                                        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Recent Activity Section — Dynamic from notifications */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivity.length === 0 ? (
                        <View style={styles.emptySection}>
                            <Ionicons name="notifications-off-outline" size={40} color="#D1D1D6" />
                            <Text style={styles.emptySectionText}>No recent activity</Text>
                        </View>
                    ) : (
                        recentActivity.map((activity) => (
                            <TouchableOpacity
                                key={activity.id}
                                style={styles.activityItem}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: getActivityIconColor(activity.type) + '20' }]}>
                                    <Ionicons
                                        name={getActivityIcon(activity.type)}
                                        size={20}
                                        color={getActivityIconColor(activity.type)}
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityText} numberOfLines={2}>
                                        {activity.message}
                                    </Text>
                                    <Text style={styles.activityTime}>{getTimeAgo(activity.timestamp)}</Text>
                                </View>
                                {!activity.read && <View style={styles.unreadDot} />}
                                <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    notificationButton: {
        position: 'relative',
        padding: 4,
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    iconButton: {
        padding: 4,
    },
    // Side Menu Drawer Styles
    menuBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 500,
    },
    sideMenu: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: width * 0.75,
        backgroundColor: '#FFFFFF',
        zIndex: 600,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    menuHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
    closeButton: {
        padding: 4,
    },
    menuContent: {
        flex: 1,
        paddingVertical: 8,
    },
    menuItemFull: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginLeft: 16,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 8,
    },
    // Disconnect Button Styles
    disconnectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginHorizontal: 12,
        marginVertical: 16,
        borderRadius: 16,
        backgroundColor: '#FFE5E5',
        borderWidth: 1.5,
        borderColor: '#FF3B30',
    },
    disconnectButtonDisabled: {
        opacity: 0.6,
    },
    disconnectButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF3B30',
        marginLeft: 8,
    },
    scrollContent: {
        paddingTop: 10,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000000',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    carouselContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    arrowButton: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    featureCardContainer: {
        width: width * 0.7,
        height: 200,
        marginHorizontal: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    featureCard: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        justifyContent: 'space-between',
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    featureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    featureButtonText: {
        color: '#007AFF',
        fontWeight: '700',
        fontSize: 14,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D1D6',
    },
    activeDot: {
        backgroundColor: '#007AFF',
        width: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#000000',
    },
    quickActionsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    quickActionCard: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
    },
    creditCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    creditContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    creditLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: 8,
    },
    creditAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    addCreditsButton: {
        padding: 8,
    },
    horizontalScrollContent: {
        paddingHorizontal: 20,
    },
    marketCard: {
        width: width * 0.6,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    marketImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#F2F2F7',
    },
    marketContent: {
        padding: 16,
    },
    marketCategory: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 4,
    },
    marketTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    marketPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    userImageContainer: {
        position: 'relative',
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F2F2F7',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    statusAvailable: {
        backgroundColor: '#34C759',
    },
    statusAway: {
        backgroundColor: '#FF9500',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    userRating: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFD700',
    },
    viewProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    viewProfileText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginRight: 4,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5F1FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    activityUser: {
        fontWeight: '700',
    },
    activityTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    bottomSpacer: {
        height: 40,
    },
    emptySection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emptySectionText: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 8,
        fontWeight: '500',
    },
    marketImagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    marketCreditsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    userImagePlaceholder: {
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginRight: 8,
    },
});

export default HomeScreen;
