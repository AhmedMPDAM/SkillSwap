import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
    const [stats, setStats] = useState({ users: 0, totalCredits: 0, requests: 0, completedExchanges: 0, pendingExaminations: 0 });
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const role = await tokenStorage.getUserRole();
            setUserRole(role);

            const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                Alert.alert('Error', 'Failed to fetch stats');
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchStats();
        }, [fetchStats])
    );

    const StatusCard = ({ title, count, icon, colors, badge }) => (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <View style={styles.cardContent}>
                <View>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardCount}>{count}</Text>
                </View>
                <View style={{ position: 'relative' }}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name={icon} size={32} color="#FFFFFF" />
                    </View>
                    {badge > 0 && (
                        <View style={styles.cardBadge}>
                            <Text style={styles.cardBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                        </View>
                    )}
                </View>
            </View>
        </LinearGradient>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {userRole === 'examiner' ? 'Examiner Dashboard' : 'Admin Dashboard'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            <StatusCard
                                title="Total Users"
                                count={stats.users}
                                icon="people-outline"
                                colors={['#4facfe', '#00f2fe']}
                            />
                            <StatusCard
                                title="Active Credits"
                                count={stats.totalCredits}
                                icon="wallet-outline"
                                colors={['#43e97b', '#38f9d7']}
                            />
                            <StatusCard
                                title="Exchange Requests"
                                count={stats.requests}
                                icon="swap-horizontal-outline"
                                colors={['#fa709a', '#fee140']}
                            />
                            <StatusCard
                                title="Completed Exchanges"
                                count={stats.completedExchanges ?? 0}
                                icon="checkmark-circle-outline"
                                colors={['#11998e', '#38ef7d']}
                            />
                            <StatusCard
                                title="Pending Reviews"
                                count={stats.pendingExaminations ?? 0}
                                icon="eye-outline"
                                colors={['#667eea', '#764ba2']}
                                badge={stats.pendingExaminations ?? 0}
                            />
                        </View>

                        {/* ── Examination queue (always visible for both admin & examiner) ── */}
                        <Text style={styles.sectionTitle}>Examination</Text>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('ExaminerDashboard')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: '#EDE7F6' }]}>
                                <Ionicons name="eye-outline" size={24} color="#667eea" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Examination Queue</Text>
                                <Text style={styles.menuSubtitle}>Review admin_quantification proposals</Text>
                            </View>
                            <View style={styles.menuRight}>
                                {stats.pendingExaminations > 0 && (
                                    <View style={styles.menuBadge}>
                                        <Text style={styles.menuBadgeText}>
                                            {stats.pendingExaminations > 9 ? '9+' : stats.pendingExaminations}
                                        </Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                            </View>
                        </TouchableOpacity>

                        {/* ── Admin-only management options ── */}
                        {userRole === 'admin' && (
                            <>
                                <Text style={styles.sectionTitle}>Management</Text>

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigation.navigate('CategoryManagement')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.menuIcon, { backgroundColor: '#E1F5FE' }]}>
                                        <Ionicons name="list-outline" size={24} color="#007AFF" />
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <Text style={styles.menuTitle}>Manage Categories</Text>
                                        <Text style={styles.menuSubtitle}>Add, remove and edit categories</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigation.navigate('UserManagement')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                                        <Ionicons name="person-circle-outline" size={24} color="#FF9800" />
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <Text style={styles.menuTitle}>Manage Users</Text>
                                        <Text style={styles.menuSubtitle}>View and manage all platform users</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigation.navigate('ExchangeManagement')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                                        <Ionicons name="swap-horizontal-outline" size={24} color="#388E3C" />
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <Text style={styles.menuTitle}>Manage Exchanges</Text>
                                        <Text style={styles.menuSubtitle}>View all exchanges and track growth</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    statsGrid: {
        gap: 16,
        marginBottom: 32,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 8,
    },
    cardCount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    cardBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
        marginTop: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    menuBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
});

export default AdminDashboard;
