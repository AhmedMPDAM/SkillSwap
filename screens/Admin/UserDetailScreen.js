import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, StatusBar, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const { width } = Dimensions.get('window');

const STATUS_COLORS = {
    open: { bg: '#E3F2FD', text: '#1976D2' },
    in_progress: { bg: '#FFF3E0', text: '#F57C00' },
    completed: { bg: '#E8F5E9', text: '#388E3C' },
    cancelled: { bg: '#FFEBEE', text: '#D32F2F' },
    pending: { bg: '#FFF8E1', text: '#F9A825' },
    accepted: { bg: '#E8F5E9', text: '#388E3C' },
    rejected: { bg: '#FFEBEE', text: '#D32F2F' },
    admin_processing: { bg: '#E8EAF6', text: '#3F51B5' },
    examiner_approved: { bg: '#E0F7FA', text: '#00838F' },
};

const ROLE_COLORS = {
    admin: { bg: '#FFEBEE', text: '#D32F2F', label: 'Admin' },
    examiner: { bg: '#E8EAF6', text: '#3F51B5', label: 'Examiner' },
    user: { bg: '#E8F5E9', text: '#388E3C', label: 'User' },
};

const UserDetailScreen = ({ navigation, route }) => {
    const { userId } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchUserDetails = useCallback(async () => {
        try {
            setLoading(true);
            const token = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
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
            console.error('User detail fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            fetchUserDetails();
        }, [fetchUserDetails])
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderStatusBadge = (status) => {
        const config = STATUS_COLORS[status] || { bg: '#F5F5F5', text: '#757575' };
        return (
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.statusBadgeText, { color: config.text }]}>
                    {(status || '').replace('_', ' ').toUpperCase()}
                </Text>
            </View>
        );
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
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
                    <Text style={styles.headerTitle}>User Details</Text>
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
                    <Text style={styles.headerTitle}>User Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={64} color="#C7C7CC" />
                    <Text style={styles.emptyText}>User not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { user, stats, requests, proposals, ratingsReceived, creditHistory } = data;
    const roleConfig = ROLE_COLORS[user.role] || ROLE_COLORS.user;

    const tabs = [
        { key: 'overview', label: 'Overview', icon: 'person-outline' },
        { key: 'requests', label: 'Requests', icon: 'document-text-outline' },
        { key: 'proposals', label: 'Proposals', icon: 'send-outline' },
        { key: 'ratings', label: 'Ratings', icon: 'star-outline' },
        { key: 'credits', label: 'Credits', icon: 'wallet-outline' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.profileRow}>
                        {user.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.profileAvatar} />
                        ) : (
                            <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={styles.profileAvatarInitial}>
                                    {(user.fullName || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user.fullName}</Text>
                            <Text style={styles.profileEmail}>{user.email}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                                <Text style={[styles.roleBadgeText, { color: '#FFFFFF' }]}>{roleConfig.label}</Text>
                            </View>
                        </View>
                    </View>
                    {user.bio ? <Text style={styles.profileBio}>{user.bio}</Text> : null}

                    {/* Stats Grid */}
                    <View style={styles.profileStatsGrid}>
                        <View style={styles.profileStatItem}>
                            <Text style={styles.profileStatValue}>{user.credits}</Text>
                            <Text style={styles.profileStatLabel}>Credits</Text>
                        </View>
                        <View style={styles.profileStatItem}>
                            <Text style={styles.profileStatValue}>{stats.totalRequests}</Text>
                            <Text style={styles.profileStatLabel}>Requests</Text>
                        </View>
                        <View style={styles.profileStatItem}>
                            <Text style={styles.profileStatValue}>{stats.completedRequests}</Text>
                            <Text style={styles.profileStatLabel}>Completed</Text>
                        </View>
                        <View style={styles.profileStatItem}>
                            <Text style={styles.profileStatValue}>{stats.averageRating || '-'}</Text>
                            <Text style={styles.profileStatLabel}>Avg Rating</Text>
                        </View>
                    </View>

                    <Text style={styles.profileJoined}>
                        Member since {formatDate(user.createdAt)}
                    </Text>
                </LinearGradient>

                {/* Info sections */}
                <View style={styles.infoSection}>
                    {user.location ? (
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={18} color="#8E8E93" />
                            <Text style={styles.infoText}>{user.location}</Text>
                        </View>
                    ) : null}
                    {user.languages && user.languages.length > 0 ? (
                        <View style={styles.infoRow}>
                            <Ionicons name="globe-outline" size={18} color="#8E8E93" />
                            <Text style={styles.infoText}>{user.languages.join(', ')}</Text>
                        </View>
                    ) : null}
                    {user.skills && user.skills.length > 0 ? (
                        <View style={styles.skillsContainer}>
                            <Text style={styles.sectionLabel}>Skills</Text>
                            <View style={styles.skillsWrap}>
                                {user.skills.map((skill, idx) => (
                                    <View key={idx} style={styles.skillChip}>
                                        <Text style={styles.skillChipText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? '#007AFF' : '#8E8E93'} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <View>
                            <View style={styles.overviewCard}>
                                <Text style={styles.overviewTitle}>Social Links</Text>
                                {user.socialLinks && Object.entries(user.socialLinks).filter(([_, v]) => v).length > 0 ? (
                                    Object.entries(user.socialLinks).filter(([_, v]) => v).map(([key, val]) => (
                                        <View key={key} style={styles.socialRow}>
                                            <Ionicons name={`logo-${key}`} size={16} color="#8E8E93" />
                                            <Text style={styles.socialText} numberOfLines={1}>{val}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>No social links added</Text>
                                )}
                            </View>

                            {user.certificates && user.certificates.length > 0 && (
                                <View style={styles.overviewCard}>
                                    <Text style={styles.overviewTitle}>Certificates ({user.certificates.length})</Text>
                                    {user.certificates.map((cert, idx) => (
                                        <View key={idx} style={styles.certRow}>
                                            <Ionicons name="ribbon-outline" size={16} color="#FFB800" />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.certName}>{cert.name}</Text>
                                                <Text style={styles.certIssuer}>{cert.issuedBy} • {formatDate(cert.date)}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'requests' && (
                        <View>
                            {requests.length === 0 ? (
                                <View style={styles.emptyTab}><Text style={styles.noDataText}>No exchange requests</Text></View>
                            ) : (
                                requests.map((req) => (
                                    <View key={req._id} style={styles.itemCard}>
                                        <View style={styles.itemCardHeader}>
                                            <Text style={styles.itemTitle} numberOfLines={1}>{req.title}</Text>
                                            {renderStatusBadge(req.status)}
                                        </View>
                                        <View style={styles.itemMeta}>
                                            <Text style={styles.itemMetaText}>{req.category} • {req.complexity}</Text>
                                            <Text style={styles.itemMetaText}>{req.estimatedCredits} credits</Text>
                                        </View>
                                        <Text style={styles.itemDate}>{formatDate(req.createdAt)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'proposals' && (
                        <View>
                            {proposals.length === 0 ? (
                                <View style={styles.emptyTab}><Text style={styles.noDataText}>No proposals</Text></View>
                            ) : (
                                proposals.map((prop) => (
                                    <View key={prop._id} style={styles.itemCard}>
                                        <View style={styles.itemCardHeader}>
                                            <Text style={styles.itemTitle} numberOfLines={1}>
                                                {prop.exchangeRequestId?.title || 'Unknown Request'}
                                            </Text>
                                            {renderStatusBadge(prop.status)}
                                        </View>
                                        <View style={styles.itemMeta}>
                                            <Text style={styles.itemMetaText}>Type: {prop.acceptanceType?.replace('_', ' ')}</Text>
                                        </View>
                                        <Text style={styles.itemDate}>{formatDate(prop.createdAt)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'ratings' && (
                        <View>
                            <View style={styles.ratingsSummary}>
                                <Text style={styles.ratingBig}>{stats.averageRating || '-'}</Text>
                                {renderStars(stats.averageRating)}
                                <Text style={styles.ratingsCount}>{stats.ratingsCount} rating{stats.ratingsCount !== 1 ? 's' : ''}</Text>
                            </View>
                            {ratingsReceived.length === 0 ? (
                                <View style={styles.emptyTab}><Text style={styles.noDataText}>No ratings received</Text></View>
                            ) : (
                                ratingsReceived.map((r) => (
                                    <View key={r._id} style={styles.itemCard}>
                                        <View style={styles.ratingHeader}>
                                            <Text style={styles.raterName}>{r.raterId?.fullName || 'Unknown'}</Text>
                                            {renderStars(r.stars)}
                                        </View>
                                        {r.comment ? <Text style={styles.ratingComment}>"{r.comment}"</Text> : null}
                                        <Text style={styles.itemDate}>
                                            For: {r.exchangeRequestId?.title || 'Unknown'} • {formatDate(r.createdAt)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'credits' && (
                        <View>
                            <View style={styles.creditBalanceCard}>
                                <Ionicons name="wallet" size={28} color="#43e97b" />
                                <Text style={styles.creditBalanceValue}>{user.credits}</Text>
                                <Text style={styles.creditBalanceLabel}>Current Balance</Text>
                            </View>
                            {creditHistory.length === 0 ? (
                                <View style={styles.emptyTab}><Text style={styles.noDataText}>No credit history</Text></View>
                            ) : (
                                creditHistory.map((h) => (
                                    <View key={h._id} style={styles.itemCard}>
                                        <View style={styles.creditHistoryRow}>
                                            <View style={[styles.creditTypeIcon, { backgroundColor: h.type === 'gain' ? '#E8F5E9' : h.type === 'depense' ? '#FFEBEE' : '#E3F2FD' }]}>
                                                <Ionicons
                                                    name={h.type === 'gain' ? 'arrow-down' : h.type === 'depense' ? 'arrow-up' : 'gift'}
                                                    size={16}
                                                    color={h.type === 'gain' ? '#388E3C' : h.type === 'depense' ? '#D32F2F' : '#1976D2'}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.creditDesc} numberOfLines={2}>{h.description}</Text>
                                                <Text style={styles.itemDate}>{formatDate(h.createdAt)}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.creditAmount, { color: h.type === 'gain' ? '#388E3C' : h.type === 'depense' ? '#D32F2F' : '#1976D2' }]}>
                                                    {h.type === 'gain' ? '+' : h.type === 'depense' ? '-' : '+'}{h.amount}
                                                </Text>
                                                <Text style={styles.creditBalance}>Bal: {h.balanceAfter}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
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

    // Profile card
    profileCard: { margin: 20, borderRadius: 20, padding: 24 },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    profileAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
    profileAvatarInitial: { fontSize: 28, fontWeight: '700', color: '#FFF' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    profileBio: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12, lineHeight: 18 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    roleBadgeText: { fontSize: 11, fontWeight: '700' },
    profileStatsGrid: {
        flexDirection: 'row', marginTop: 16, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
    },
    profileStatItem: { flex: 1, alignItems: 'center' },
    profileStatValue: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    profileStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    profileJoined: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 12, textAlign: 'right' },

    // Info section
    infoSection: { paddingHorizontal: 20, marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    infoText: { fontSize: 14, color: '#3C3C43' },
    skillsContainer: { marginTop: 4 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    skillChip: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    skillChipText: { fontSize: 12, color: '#1976D2', fontWeight: '500' },

    // Tabs
    tabsContainer: { marginBottom: 4 },
    tabsContent: { paddingHorizontal: 20, gap: 4 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#FFFFFF', marginRight: 4,
    },
    tabActive: { backgroundColor: '#E3F2FD' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
    tabTextActive: { color: '#007AFF' },

    // Tab content
    tabContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },

    // Items
    itemCard: {
        backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    itemCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    itemTitle: { fontSize: 15, fontWeight: '600', color: '#000', flex: 1, marginRight: 8 },
    itemMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    itemMetaText: { fontSize: 12, color: '#8E8E93' },
    itemDate: { fontSize: 11, color: '#C7C7CC' },

    // Status badge
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },

    // Ratings
    starsRow: { flexDirection: 'row', gap: 2 },
    ratingsSummary: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16 },
    ratingBig: { fontSize: 40, fontWeight: '800', color: '#000' },
    ratingsCount: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
    ratingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    raterName: { fontSize: 14, fontWeight: '600', color: '#000' },
    ratingComment: { fontSize: 13, color: '#3C3C43', fontStyle: 'italic', marginBottom: 6 },

    // Credits
    creditBalanceCard: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, gap: 4 },
    creditBalanceValue: { fontSize: 36, fontWeight: '800', color: '#000' },
    creditBalanceLabel: { fontSize: 13, color: '#8E8E93' },
    creditHistoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    creditTypeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    creditDesc: { fontSize: 13, color: '#3C3C43', marginBottom: 2 },
    creditAmount: { fontSize: 15, fontWeight: '700' },
    creditBalance: { fontSize: 11, color: '#C7C7CC' },

    // Overview
    overviewCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12 },
    overviewTitle: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
    socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    socialText: { fontSize: 13, color: '#3C3C43', flex: 1 },
    certRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    certName: { fontSize: 14, fontWeight: '600', color: '#000' },
    certIssuer: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
    noDataText: { fontSize: 14, color: '#C7C7CC', textAlign: 'center', paddingVertical: 16 },

    // Empty
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
    emptyTab: { paddingVertical: 20 },
});

export default UserDetailScreen;
