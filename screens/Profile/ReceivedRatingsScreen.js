import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    StatusBar,
    TouchableOpacity,
    RefreshControl,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const ReceivedRatingsScreen = ({ navigation }) => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRatings();
    }, []);

    const fetchRatings = async () => {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/profile/ratings/received?limit=100`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRatings(data.ratings || []);
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRatings();
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        let cleanPath = imagePath.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('uploads/')) return `${API_BASE_URL}/${cleanPath}`;
        return `${API_BASE_URL}/uploads/${cleanPath}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderStars = (stars) => {
        const starElements = [];
        for (let i = 1; i <= 5; i++) {
            starElements.push(
                <Ionicons
                    key={i}
                    name={i <= stars ? 'star' : 'star-outline'}
                    size={16}
                    color={i <= stars ? '#FFD700' : '#D1D1D6'}
                />
            );
        }
        return <View style={styles.starsRow}>{starElements}</View>;
    };

    const renderItem = ({ item }) => {
        const raterImage = item.raterId ? getImageUrl(item.raterId.profileImage) : null;
        const raterName = item.raterId?.fullName || 'Anonymous';

        return (
            <View style={styles.ratingCard}>
                <View style={styles.ratingHeader}>
                    <View style={styles.raterInfo}>
                        {raterImage ? (
                            <Image source={{ uri: raterImage }} style={styles.raterImage} />
                        ) : (
                            <View style={styles.raterImagePlaceholder}>
                                <Ionicons name="person" size={20} color="#8E8E93" />
                            </View>
                        )}
                        <View style={styles.raterDetails}>
                            <Text style={styles.raterName}>{raterName}</Text>
                            <Text style={styles.ratingDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    {renderStars(item.stars)}
                </View>

                {item.exchangeRequestId && (
                    <View style={styles.exchangeTag}>
                        <Ionicons name="swap-horizontal" size={14} color="#007AFF" />
                        <Text style={styles.exchangeTitle} numberOfLines={1}>
                            {item.exchangeRequestId.title || 'Exchange'}
                        </Text>
                    </View>
                )}

                {item.comment ? (
                    <Text style={styles.commentText}>{item.comment}</Text>
                ) : (
                    <Text style={styles.noComment}>No comment provided</Text>
                )}
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Ratings Yet</Text>
            <Text style={styles.emptySubtitle}>
                Complete exchanges to receive ratings from other users.
            </Text>
        </View>
    );

    // Compute stats
    const avgRating =
        ratings.length > 0
            ? Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10
            : 0;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Ratings</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Rating Summary */}
            {ratings.length > 0 && (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryAvg}>{avgRating}</Text>
                    {renderStars(Math.round(avgRating))}
                    <Text style={styles.summaryCount}>
                        Based on {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            {/* Ratings List */}
            <FlatList
                data={ratings}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                }
                showsVerticalScrollIndicator={false}
            />
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
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryAvg: {
        fontSize: 42,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    summaryCount: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 6,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 30,
    },
    ratingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    raterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    raterImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
    },
    raterImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    raterDetails: {
        marginLeft: 10,
        flex: 1,
    },
    raterName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    ratingDate: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    exchangeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginBottom: 10,
        gap: 5,
    },
    exchangeTitle: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    commentText: {
        fontSize: 14,
        color: '#3A3A3C',
        lineHeight: 20,
    },
    noComment: {
        fontSize: 13,
        color: '#C7C7CC',
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3A3A3C',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});

export default ReceivedRatingsScreen;
