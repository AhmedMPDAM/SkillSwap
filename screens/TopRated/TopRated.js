import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TopRatedScreen = ({ navigation }) => {
    const topUsers = [
        { id: '1', name: 'Sarah J.', rating: 4.9, role: 'Web Developer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
        { id: '2', name: 'Mike T.', rating: 4.8, role: 'Graphic Designer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
        { id: '3', name: 'Emily R.', rating: 5.0, role: 'Digital Marketer', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
        { id: '4', name: 'David L.', rating: 4.7, role: 'Photographer', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
        { id: '5', name: 'Jessica M.', rating: 4.9, role: 'Content Writer', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
        { id: '6', name: 'Robert K.', rating: 4.6, role: 'SEO Specialist', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80' },
    ];

    const renderUserItem = (item) => (
        <TouchableOpacity key={item.id} activeOpacity={0.9} style={styles.userCard}>
            <Image source={{ uri: item.image }} style={styles.userImage} />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userRole}>{item.role}</Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.userRating}>{item.rating}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.viewProfileButton}>
                <Text style={styles.viewProfileText}>View</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
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
                <Text style={styles.headerTitle}>Top Rated Users</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {topUsers.map((item) => renderUserItem(item))}
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
        padding: 16,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    userImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F2F2F7',
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
});

export default TopRatedScreen;
