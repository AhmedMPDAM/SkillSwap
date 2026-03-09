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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const CreditHistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/profile/credits/history?limit=100`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Error fetching credit history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'gain':
                return {
                    icon: 'arrow-down-circle',
                    color: '#34C759',
                    bgColor: '#E8FAE8',
                    prefix: '+',
                    label: 'Credit Received',
                };
            case 'depense':
                return {
                    icon: 'arrow-up-circle',
                    color: '#FF3B30',
                    bgColor: '#FFE8E6',
                    prefix: '-',
                    label: 'Credit Spent',
                };
            case 'bonus_demarrage':
                return {
                    icon: 'gift',
                    color: '#AF52DE',
                    bgColor: '#F3E8FF',
                    prefix: '+',
                    label: 'Welcome Bonus',
                };
            default:
                return {
                    icon: 'swap-horizontal',
                    color: '#007AFF',
                    bgColor: '#E3F2FD',
                    prefix: '',
                    label: 'Transaction',
                };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 1) {
            const mins = Math.floor(diffMs / (1000 * 60));
            return `${mins}m ago`;
        }
        if (diffHrs < 24) {
            return `${Math.floor(diffHrs)}h ago`;
        }
        if (diffHrs < 48) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const renderItem = ({ item }) => {
        const config = getTypeConfig(item.type);

        return (
            <View style={styles.historyItem}>
                <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={24} color={config.color} />
                </View>
                <View style={styles.itemContent}>
                    <Text style={styles.itemLabel}>{config.label}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                    {item.relatedRequest && (
                        <Text style={styles.itemRelated} numberOfLines={1}>
                            📋 {item.relatedRequest.title || 'Exchange'}
                        </Text>
                    )}
                    <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.itemAmount, { color: config.color }]}>
                        {config.prefix}{item.amount}
                    </Text>
                    <Text style={styles.balanceAfter}>
                        Bal: {item.balanceAfter}
                    </Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>
                Your credit history will appear here once you start making exchanges.
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Stats summary
    const totalGains = history
        .filter((h) => h.type === 'gain' || h.type === 'bonus_demarrage')
        .reduce((sum, h) => sum + h.amount, 0);
    const totalSpent = history
        .filter((h) => h.type === 'depense')
        .reduce((sum, h) => sum + h.amount, 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Credit History</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { borderLeftColor: '#34C759' }]}>
                    <Ionicons name="trending-up" size={20} color="#34C759" />
                    <Text style={styles.summaryLabel}>Total Earned</Text>
                    <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                        +{Math.round(totalGains * 10) / 10}
                    </Text>
                </View>
                <View style={[styles.summaryCard, { borderLeftColor: '#FF3B30' }]}>
                    <Ionicons name="trending-down" size={20} color="#FF3B30" />
                    <Text style={styles.summaryLabel}>Total Spent</Text>
                    <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
                        -{Math.round(totalSpent * 10) / 10}
                    </Text>
                </View>
            </View>

            {/* History List */}
            <FlatList
                data={history}
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
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 6,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
        marginRight: 8,
    },
    itemLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    itemDescription: {
        fontSize: 12,
        color: '#636366',
        lineHeight: 16,
    },
    itemRelated: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 3,
    },
    itemDate: {
        fontSize: 11,
        color: '#AEAEB2',
        marginTop: 3,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    itemAmount: {
        fontSize: 17,
        fontWeight: '800',
    },
    balanceAfter: {
        fontSize: 11,
        color: '#AEAEB2',
        marginTop: 3,
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

export default CreditHistoryScreen;
