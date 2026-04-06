import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const STATUS_CONFIG = {
    open: { color: '#1976D2', bg: '#E3F2FD', gradient: ['#4facfe', '#00f2fe'], label: 'Open' },
    in_progress: { color: '#F57C00', bg: '#FFF3E0', gradient: ['#f093fb', '#f5576c'], label: 'In Progress' },
    completed: { color: '#388E3C', bg: '#E8F5E9', gradient: ['#43e97b', '#38f9d7'], label: 'Completed' },
    cancelled: { color: '#D32F2F', bg: '#FFEBEE', gradient: ['#ff6a6a', '#ee5a24'], label: 'Cancelled' },
};

const PROPOSAL_STATUS = {
    pending: { bg: '#FFF8E1', text: '#F9A825' },
    accepted: { bg: '#E8F5E9', text: '#388E3C' },
    rejected: { bg: '#FFEBEE', text: '#D32F2F' },
    cancelled: { bg: '#F5F5F5', text: '#757575' },
    admin_processing: { bg: '#E8EAF6', text: '#3F51B5' },
    examiner_approved: { bg: '#E0F7FA', text: '#00838F' },
};

const ExchangeDetailScreen = ({ navigation, route }) => {
    const { exchangeId } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const token = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/exchanges/${exchangeId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Exchange detail fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [exchangeId]);

    useFocusEffect(
        useCallback(() => {
            fetchDetails();
        }, [fetchDetails])
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatShortDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={14}
                    color="#FFB800"
                />
            );
        }
        return <View style={styles.starsRow}>{stars}</View>;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Exchange Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!data) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Exchange Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={64} color="#C7C7CC" />
                    <Text style={styles.emptyText}>Exchange not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { exchange, proposals, ratings } = data;
    const sc = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.open;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Exchange Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Status Banner */}
                <LinearGradient
                    colors={sc.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statusBanner}
                >
                    <Ionicons name="swap-horizontal" size={28} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.statusBannerLabel}>{sc.label}</Text>
                    <Text style={styles.bannerTitle}>{exchange.title}</Text>
                </LinearGradient>

                {/* Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionTitle}>Exchange Information</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailValue}>{exchange.description}</Text>
                    </View>

                    <View style={styles.detailGrid}>
                        <View style={styles.detailGridItem}>
                            <Ionicons name="code-slash-outline" size={16} color="#667eea" />
                            <Text style={styles.detailGridLabel}>Skill</Text>
                            <Text style={styles.detailGridValue}>{exchange.skillSearched}</Text>
                        </View>
                        <View style={styles.detailGridItem}>
                            <Ionicons name="grid-outline" size={16} color="#fa709a" />
                            <Text style={styles.detailGridLabel}>Category</Text>
                            <Text style={styles.detailGridValue}>{exchange.category}</Text>
                        </View>
                        <View style={styles.detailGridItem}>
                            <Ionicons name="bar-chart-outline" size={16} color="#43e97b" />
                            <Text style={styles.detailGridLabel}>Level</Text>
                            <Text style={styles.detailGridValue}>{exchange.level}</Text>
                        </View>
                        <View style={styles.detailGridItem}>
                            <Ionicons name="speedometer-outline" size={16} color="#4facfe" />
                            <Text style={styles.detailGridLabel}>Complexity</Text>
                            <Text style={styles.detailGridValue}>{exchange.complexity}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>What They Offer</Text>
                        <Text style={styles.detailValue}>{exchange.whatYouOffer || 'N/A'}</Text>
                    </View>

                    <View style={styles.creditInfoRow}>
                        <View style={styles.creditInfoBox}>
                            <Ionicons name="wallet-outline" size={20} color="#43e97b" />
                            <Text style={styles.creditInfoValue}>{exchange.estimatedCredits}</Text>
                            <Text style={styles.creditInfoLabel}>Est. Credits</Text>
                        </View>
                        <View style={styles.creditInfoBox}>
                            <Ionicons name="lock-closed-outline" size={20} color="#FF9800" />
                            <Text style={styles.creditInfoValue}>{exchange.lockedCredits || 0}</Text>
                            <Text style={styles.creditInfoLabel}>Locked</Text>
                        </View>
                        <View style={styles.creditInfoBox}>
                            <Ionicons name="time-outline" size={20} color="#667eea" />
                            <Text style={styles.creditInfoValue}>{exchange.estimatedDuration}h</Text>
                            <Text style={styles.creditInfoLabel}>Duration</Text>
                        </View>
                        <View style={styles.creditInfoBox}>
                            <Ionicons name="eye-outline" size={20} color="#fa709a" />
                            <Text style={styles.creditInfoValue}>{exchange.views || 0}</Text>
                            <Text style={styles.creditInfoLabel}>Views</Text>
                        </View>
                    </View>

                    <View style={styles.dateInfo}>
                        <View style={styles.dateInfoItem}>
                            <Text style={styles.dateInfoLabel}>Created</Text>
                            <Text style={styles.dateInfoValue}>{formatDate(exchange.createdAt)}</Text>
                        </View>
                        <View style={styles.dateInfoItem}>
                            <Text style={styles.dateInfoLabel}>Deadline</Text>
                            <Text style={[styles.dateInfoValue, { color: '#FA709A' }]}>{formatShortDate(exchange.desiredDeadline)}</Text>
                        </View>
                    </View>
                </View>

                {/* Owner Card */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionTitle}>Request Owner</Text>
                    {exchange.userId ? (
                        <TouchableOpacity
                            style={styles.userRow}
                            onPress={() => navigation.navigate('UserDetail', { userId: exchange.userId._id })}
                        >
                            {exchange.userId.profileImage ? (
                                <Image source={{ uri: exchange.userId.profileImage }} style={styles.userAvatar} />
                            ) : (
                                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.userAvatar}>
                                    <Text style={styles.avatarInitial}>
                                        {(exchange.userId.fullName || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userRowName}>{exchange.userId.fullName}</Text>
                                <Text style={styles.userRowEmail}>{exchange.userId.email}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.userCredits}>{exchange.userId.credits} credits</Text>
                                <Text style={styles.userRole}>{exchange.userId.role}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.noDataText}>Owner info unavailable</Text>
                    )}
                </View>

                {/* Selected Proposal / Proposer */}
                {exchange.selectedProposal && exchange.selectedProposal.proposerId && (
                    <View style={styles.card}>
                        <Text style={styles.cardSectionTitle}>Selected Proposer</Text>
                        <TouchableOpacity
                            style={styles.userRow}
                            onPress={() => navigation.navigate('UserDetail', { userId: exchange.selectedProposal.proposerId._id })}
                        >
                            {exchange.selectedProposal.proposerId.profileImage ? (
                                <Image source={{ uri: exchange.selectedProposal.proposerId.profileImage }} style={styles.userAvatar} />
                            ) : (
                                <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.userAvatar}>
                                    <Text style={styles.avatarInitial}>
                                        {(exchange.selectedProposal.proposerId.fullName || 'P').charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userRowName}>{exchange.selectedProposal.proposerId.fullName}</Text>
                                <Text style={styles.userRowEmail}>{exchange.selectedProposal.proposerId.email}</Text>
                            </View>
                            <Text style={styles.userCredits}>{exchange.selectedProposal.proposerId.credits} credits</Text>
                            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Proposals */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionTitle}>Proposals ({proposals.length})</Text>
                    {proposals.length === 0 ? (
                        <Text style={styles.noDataText}>No proposals yet</Text>
                    ) : (
                        proposals.map((prop) => {
                            const ps = PROPOSAL_STATUS[prop.status] || { bg: '#F5F5F5', text: '#757575' };
                            return (
                                <View key={prop._id} style={styles.proposalCard}>
                                    <View style={styles.proposalHeader}>
                                        <View style={styles.proposalUser}>
                                            {prop.proposerId?.profileImage ? (
                                                <Image source={{ uri: prop.proposerId.profileImage }} style={styles.proposalAvatar} />
                                            ) : (
                                                <View style={[styles.proposalAvatar, { backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#667eea' }}>
                                                        {(prop.proposerId?.fullName || 'P').charAt(0)}
                                                    </Text>
                                                </View>
                                            )}
                                            <View>
                                                <Text style={styles.proposalName}>{prop.proposerId?.fullName || 'Unknown'}</Text>
                                                <Text style={styles.proposalEmail}>{prop.proposerId?.email || ''}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.proposalStatusBadge, { backgroundColor: ps.bg }]}>
                                            <Text style={[styles.proposalStatusText, { color: ps.text }]}>
                                                {(prop.status || '').replace('_', ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.proposalCoverLetter} numberOfLines={3}>{prop.coverLetter}</Text>

                                    <View style={styles.proposalMeta}>
                                        <Text style={styles.proposalMetaText}>Type: {prop.acceptanceType?.replace('_', ' ')}</Text>
                                        <Text style={styles.proposalMetaText}>{formatShortDate(prop.createdAt)}</Text>
                                    </View>

                                    {prop.examinerReview && prop.examinerReview.examinerId && (
                                        <View style={styles.examinerBox}>
                                            <Ionicons name="shield-checkmark-outline" size={14} color="#667eea" />
                                            <Text style={styles.examinerText}>
                                                Reviewed by {prop.examinerReview.examinerId.fullName || 'Examiner'}
                                                {prop.examinerReview.assignedCredits != null ? ` • ${prop.examinerReview.assignedCredits} credits assigned` : ''}
                                            </Text>
                                        </View>
                                    )}
                                    {prop.examinerReview && prop.examinerReview.examinerNote ? (
                                        <Text style={styles.examinerNote}>Note: "{prop.examinerReview.examinerNote}"</Text>
                                    ) : null}
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Ratings */}
                {ratings.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardSectionTitle}>Ratings ({ratings.length})</Text>
                        {ratings.map((r) => (
                            <View key={r._id} style={styles.ratingCard}>
                                <View style={styles.ratingHeader}>
                                    <View>
                                        <Text style={styles.ratingFromTo}>
                                            {r.raterId?.fullName || 'Unknown'} → {r.ratedUserId?.fullName || 'Unknown'}
                                        </Text>
                                    </View>
                                    {renderStars(r.stars)}
                                </View>
                                {r.comment ? (
                                    <Text style={styles.ratingComment}>"{r.comment}"</Text>
                                ) : null}
                                <Text style={styles.ratingDate}>{formatShortDate(r.createdAt)}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    scrollContent: { paddingBottom: 40 },

    // Status Banner
    statusBanner: { margin: 20, marginBottom: 0, borderRadius: 20, padding: 24, alignItems: 'center', gap: 6 },
    statusBannerLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1 },
    bannerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center', marginTop: 4 },

    // Card
    card: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 20, margin: 20, marginBottom: 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    cardSectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 16 },

    // Details
    detailRow: { marginBottom: 14 },
    detailLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 14, color: '#3C3C43', lineHeight: 20 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    detailGridItem: {
        width: '47%', backgroundColor: '#F9F9FB', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4,
    },
    detailGridLabel: { fontSize: 11, color: '#8E8E93' },
    detailGridValue: { fontSize: 14, fontWeight: '600', color: '#000' },

    // Credits
    creditInfoRow: {
        flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F2F2F7',
        paddingTop: 14, marginTop: 4, marginBottom: 14,
    },
    creditInfoBox: { flex: 1, alignItems: 'center', gap: 4 },
    creditInfoValue: { fontSize: 16, fontWeight: '700', color: '#000' },
    creditInfoLabel: { fontSize: 10, color: '#8E8E93' },

    // Date
    dateInfo: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 12,
    },
    dateInfoItem: {},
    dateInfoLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 2 },
    dateInfoValue: { fontSize: 13, fontWeight: '600', color: '#3C3C43' },

    // User row
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    userRowName: { fontSize: 15, fontWeight: '600', color: '#000' },
    userRowEmail: { fontSize: 12, color: '#8E8E93' },
    userCredits: { fontSize: 13, fontWeight: '600', color: '#43e97b' },
    userRole: { fontSize: 11, color: '#8E8E93', marginTop: 2 },

    // Proposal
    proposalCard: {
        backgroundColor: '#F9F9FB', borderRadius: 14, padding: 14, marginBottom: 10,
    },
    proposalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    proposalUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    proposalAvatar: { width: 32, height: 32, borderRadius: 16 },
    proposalName: { fontSize: 14, fontWeight: '600', color: '#000' },
    proposalEmail: { fontSize: 11, color: '#8E8E93' },
    proposalStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    proposalStatusText: { fontSize: 10, fontWeight: '700' },
    proposalCoverLetter: { fontSize: 13, color: '#3C3C43', lineHeight: 18, marginBottom: 8 },
    proposalMeta: { flexDirection: 'row', justifyContent: 'space-between' },
    proposalMetaText: { fontSize: 11, color: '#C7C7CC' },
    examinerBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
        backgroundColor: '#E8EAF6', borderRadius: 8, padding: 8,
    },
    examinerText: { fontSize: 12, color: '#3F51B5', fontWeight: '500', flex: 1 },
    examinerNote: { fontSize: 12, color: '#3F51B5', fontStyle: 'italic', marginTop: 4, marginLeft: 4 },

    // Ratings
    starsRow: { flexDirection: 'row', gap: 2 },
    ratingCard: { backgroundColor: '#F9F9FB', borderRadius: 12, padding: 12, marginBottom: 8 },
    ratingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    ratingFromTo: { fontSize: 13, fontWeight: '600', color: '#000' },
    ratingComment: { fontSize: 13, color: '#3C3C43', fontStyle: 'italic', marginBottom: 6 },
    ratingDate: { fontSize: 11, color: '#C7C7CC' },

    noDataText: { fontSize: 14, color: '#C7C7CC', textAlign: 'center', paddingVertical: 16 },
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
});

export default ExchangeDetailScreen;
