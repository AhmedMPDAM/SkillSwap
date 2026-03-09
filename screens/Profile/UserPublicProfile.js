import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const UserPublicProfile = ({ navigation, route }) => {
    const { userId } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicProfile();
    }, [userId]);

    const fetchPublicProfile = async () => {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/public`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching public profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        let cleanPath = imagePath.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('uploads/')) return `${API_BASE_URL}/${cleanPath}`;
        return `${API_BASE_URL}/uploads/${cleanPath}`;
    };

    const renderStars = (stars, size = 18) => {
        const starElements = [];
        for (let i = 1; i <= 5; i++) {
            starElements.push(
                <Ionicons
                    key={i}
                    name={i <= stars ? 'star' : i - 0.5 <= stars ? 'star-half' : 'star-outline'}
                    size={size}
                    color={i <= stars || i - 0.5 <= stars ? '#FFD700' : '#D1D1D6'}
                />
            );
        }
        return <View style={styles.starsRow}>{starElements}</View>;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getBadgeColors = (threshold) => {
        switch (threshold) {
            case 5:
                return { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' };
            case 10:
                return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
            case 25:
                return { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' };
            case 50:
                return { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' };
            case 100:
                return { bg: '#FCE4EC', text: '#C62828', border: '#EF9A9A' };
            default:
                return { bg: '#F5F5F5', text: '#616161', border: '#BDBDBD' };
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="person-outline" size={64} color="#C7C7CC" />
                <Text style={styles.errorText}>Could not load profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchPublicProfile}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { user, stats, recentRatings } = data;
    const profileImageUrl = getImageUrl(user.profileImage);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {profileImageUrl ? (
                        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={50} color="#8E8E93" />
                        </View>
                    )}
                    <Text style={styles.profileName}>{user.fullName}</Text>
                    {user.location ? (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color="#8E8E93" />
                            <Text style={styles.locationText}>{user.location}</Text>
                        </View>
                    ) : null}
                    {user.bio ? <Text style={styles.bioText}>{user.bio}</Text> : null}

                    {/* Skills */}
                    {user.skills && user.skills.length > 0 && (
                        <View style={styles.skillsRow}>
                            {user.skills.slice(0, 5).map((skill, index) => (
                                <View key={index} style={styles.skillTag}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))}
                            {user.skills.length > 5 && (
                                <View style={[styles.skillTag, { backgroundColor: '#F2F2F7' }]}>
                                    <Text style={[styles.skillText, { color: '#8E8E93' }]}>
                                        +{user.skills.length - 5}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF9E6' }]}>
                            <Ionicons name="star" size={22} color="#FFD700" />
                        </View>
                        <Text style={styles.statValue}>
                            {stats.averageRating > 0 ? stats.averageRating : '—'}
                        </Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8FAE8' }]}>
                            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                        </View>
                        <Text style={styles.statValue}>{stats.completedExchanges}</Text>
                        <Text style={styles.statLabel}>Exchanges</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="chatbubbles" size={22} color="#007AFF" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalRatings}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                </View>

                {/* Badges Section */}
                {stats.badges && stats.badges.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Badges Earned</Text>
                        <View style={styles.badgesGrid}>
                            {stats.badges.map((badge, index) => {
                                const colors = getBadgeColors(badge.threshold);
                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.badgeCard,
                                            { backgroundColor: colors.bg, borderColor: colors.border },
                                        ]}
                                    >
                                        <Ionicons name={badge.icon} size={28} color={colors.text} />
                                        <Text style={[styles.badgeLabel, { color: colors.text }]}>
                                            {badge.label}
                                        </Text>
                                        <Text style={[styles.badgeThreshold, { color: colors.text }]}>
                                            {badge.threshold}+ exchanges
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {stats.nextBadge && (
                            <View style={styles.nextBadgeContainer}>
                                <Ionicons name="flag-outline" size={16} color="#8E8E93" />
                                <Text style={styles.nextBadgeText}>
                                    Next badge: <Text style={{ fontWeight: '700' }}>{stats.nextBadge.label}</Text> — {stats.nextBadge.remaining} more exchange{stats.nextBadge.remaining !== 1 ? 's' : ''} to go!
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* If no badges yet, show progress to first badge */}
                {(!stats.badges || stats.badges.length === 0) && stats.nextBadge && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Badges</Text>
                        <View style={styles.noBadgesContainer}>
                            <Ionicons name="trophy-outline" size={40} color="#C7C7CC" />
                            <Text style={styles.noBadgesText}>
                                No badges yet. {stats.nextBadge.remaining} more exchange{stats.nextBadge.remaining !== 1 ? 's' : ''} until "{stats.nextBadge.label}"!
                            </Text>
                        </View>
                    </View>
                )}

                {/* Recent Ratings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Reviews</Text>

                    {recentRatings && recentRatings.length > 0 ? (
                        recentRatings.map((rating) => {
                            const raterImage = rating.raterId ? getImageUrl(rating.raterId.profileImage) : null;
                            return (
                                <View key={rating._id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewerInfo}>
                                            {raterImage ? (
                                                <Image source={{ uri: raterImage }} style={styles.reviewerImage} />
                                            ) : (
                                                <View style={styles.reviewerImagePlaceholder}>
                                                    <Ionicons name="person" size={16} color="#8E8E93" />
                                                </View>
                                            )}
                                            <View>
                                                <Text style={styles.reviewerName}>
                                                    {rating.raterId?.fullName || 'User'}
                                                </Text>
                                                <Text style={styles.reviewDate}>
                                                    {formatDate(rating.createdAt)}
                                                </Text>
                                            </View>
                                        </View>
                                        {renderStars(rating.stars, 14)}
                                    </View>

                                    {rating.exchangeRequestId && (
                                        <View style={styles.reviewExchangeTag}>
                                            <Ionicons name="swap-horizontal" size={12} color="#007AFF" />
                                            <Text style={styles.reviewExchangeTitle} numberOfLines={1}>
                                                {rating.exchangeRequestId.title || 'Exchange'}
                                            </Text>
                                        </View>
                                    )}

                                    {rating.comment ? (
                                        <Text style={styles.reviewComment}>{rating.comment}</Text>
                                    ) : null}
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.noReviewsContainer}>
                            <Ionicons name="chatbubble-outline" size={32} color="#C7C7CC" />
                            <Text style={styles.noReviewsText}>No reviews yet</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
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
        backgroundColor: '#F2F2F7',
    },
    errorText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 12,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 10,
    },
    retryText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F2F2F7',
        marginBottom: 12,
    },
    profileImagePlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    bioText: {
        fontSize: 14,
        color: '#636366',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 14,
        gap: 6,
    },
    skillTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
    },
    skillText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 12,
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 4,
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 12,
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 14,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    badgeCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        alignItems: 'center',
        width: '47%',
    },
    badgeLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
    },
    badgeThreshold: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '500',
    },
    nextBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        gap: 8,
    },
    nextBadgeText: {
        fontSize: 13,
        color: '#636366',
        flex: 1,
        lineHeight: 18,
    },
    noBadgesContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    noBadgesText: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    reviewCard: {
        backgroundColor: '#F9F9FB',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    reviewerImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
        marginRight: 10,
    },
    reviewerImagePlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    reviewDate: {
        fontSize: 11,
        color: '#AEAEB2',
        marginTop: 1,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 1,
    },
    reviewExchangeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        gap: 4,
    },
    reviewExchangeTitle: {
        fontSize: 11,
        color: '#007AFF',
        fontWeight: '500',
    },
    reviewComment: {
        fontSize: 13,
        color: '#3A3A3C',
        lineHeight: 18,
    },
    noReviewsContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    noReviewsText: {
        fontSize: 14,
        color: '#C7C7CC',
        marginTop: 8,
    },
});

export default UserPublicProfile;
