import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MarketplaceScreen = ({ navigation }) => {
    const marketplaceItems = [
        { id: '1', title: 'Web Development', price: '15 Credits', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&q=80' },
        { id: '2', title: 'Graphic Design', price: '10 Credits', image: 'https://images.unsplash.com/photo-1626785774573-4b799314346d?w=500&q=80' },
        { id: '3', title: 'Digital Marketing', price: '12 Credits', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80' },
        { id: '4', title: 'Photography', price: '20 Credits', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80' },
        { id: '5', title: 'Video Editing', price: '18 Credits', image: 'https://images.unsplash.com/photo-1574717436423-a75a68c65567?w=500&q=80' },
        { id: '6', title: 'SEO Optimization', price: '14 Credits', image: 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?w=500&q=80' },
    ];

    const renderMarketplaceItem = (item) => (
        <TouchableOpacity key={item.id} activeOpacity={0.9} style={styles.marketCard}>
            <Image source={{ uri: item.image }} style={styles.marketImage} />
            <View style={styles.marketContent}>
                <Text style={styles.marketTitle}>{item.title}</Text>
                <Text style={styles.marketPrice}>{item.price}</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Marketplace</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.gridContainer}>
                    {marketplaceItems.map((item) => (
                        <View key={item.id} style={styles.gridItemWrapper}>
                            {renderMarketplaceItem(item)}
                        </View>
                    ))}
                </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    gridItemWrapper: {
        width: '50%',
        padding: 8,
    },
    marketCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    marketImage: {
        width: '100%',
        height: 120,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#F2F2F7',
    },
    marketContent: {
        marginBottom: 8,
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
    addButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#007AFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MarketplaceScreen;
