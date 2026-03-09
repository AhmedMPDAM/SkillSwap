import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    StatusBar,
    Image,
    Modal,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { tokenStorage } from '../../utils/tokenStorage';
import { useSocket } from '../../context/SocketContext';




const ProfileScreen = ({ navigation }) => {
    const { clearNotifications } = useSocket();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Stats & reputation
    const [stats, setStats] = useState(null);

    // Profile fields
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [profileImageFile, setProfileImageFile] = useState(null);

    // Social links
    const [socialLinks, setSocialLinks] = useState({
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
        github: '',
        portfolio: '',
    });

    // Certificates
    const [certificates, setCertificates] = useState([]);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState(null);
    const [certificateForm, setCertificateForm] = useState({
        name: '',
        date: '',
        issuedBy: '',
        documentFile: null,
    });

    const API_URL = 'https://zoologically-unindentured-sol.ngrok-free.dev/api';
    const BASE_URL = 'https://zoologically-unindentured-sol.ngrok-free.dev';

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            if (!accessToken) return;

            const response = await fetch(`${API_URL}/profile/stats`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getBadgeColor = (threshold) => {
        switch (threshold) {
            case 5: return { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' };
            case 10: return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
            case 25: return { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' };
            case 50: return { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' };
            case 100: return { bg: '#FCE4EC', text: '#C62828', border: '#EF9A9A' };
            default: return { bg: '#F5F5F5', text: '#616161', border: '#BDBDBD' };
        }
    };

    const renderStars = (stars, size = 16) => {
        const els = [];
        for (let i = 1; i <= 5; i++) {
            els.push(
                <Ionicons
                    key={i}
                    name={i <= stars ? 'star' : i - 0.5 <= stars ? 'star-half' : 'star-outline'}
                    size={size}
                    color={i <= stars || i - 0.5 <= stars ? '#FFD700' : '#D1D1D6'}
                />
            );
        }
        return <View style={{ flexDirection: 'row', gap: 2 }}>{els}</View>;
    };

    // Helper function to construct full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Clean up backslashes just in case (windows paths)
        let cleanPath = imagePath.replace(/\\/g, '/');

        // Remove leading slash if present to standardize
        if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }

        // If path already starts with 'uploads/', don't add it again
        if (cleanPath.startsWith('uploads/')) {
            return `${BASE_URL}/${cleanPath}`;
        }

        // Otherwise, assume it needs the uploads prefix
        return `${BASE_URL}/uploads/${cleanPath}`;
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const accessToken = await tokenStorage.getAccessToken();

            if (!accessToken) {
                Alert.alert('Error', 'Please login to view your profile');
                navigation.navigate('Login');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true', // Required for ngrok
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);

                // Populate form fields with existing user data
                // Handle case where user might not have profile data yet
                setFullName(data.fullName || '');
                setBio(data.bio || '');
                setLocation(data.location || '');

                // Construct full URL for profile image
                const imageUrl = getImageUrl(data.profileImage);
                setProfileImage(imageUrl);

                // Populate social links - handle both object and undefined cases
                if (data.socialLinks && typeof data.socialLinks === 'object') {
                    setSocialLinks({
                        facebook: data.socialLinks.facebook || '',
                        instagram: data.socialLinks.instagram || '',
                        twitter: data.socialLinks.twitter || '',
                        linkedin: data.socialLinks.linkedin || '',
                        github: data.socialLinks.github || '',
                        portfolio: data.socialLinks.portfolio || '',
                    });
                } else {
                    setSocialLinks({
                        facebook: '',
                        instagram: '',
                        twitter: '',
                        linkedin: '',
                        github: '',
                        portfolio: '',
                    });
                }

                // Populate certificates
                setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
            } else if (response.status === 401 || response.status === 403) {
                const errorData = await response.json().catch(() => ({}));
                Alert.alert('Session Expired', 'Please login again');
                navigation.navigate('Login');
            } else if (response.status === 404) {
                // User doesn't have profile data yet - that's okay, show empty form
                setProfile({ email: null }); // Set minimal profile to allow form to show
            } else {
                const errorData = await response.json().catch(() => ({}));
                // Don't block the UI - allow user to still edit
                Alert.alert('Warning', errorData.message || `Could not load existing profile (Status: ${response.status}). You can still update your profile.`);
            }
        } catch (error) {
            // Don't block the UI - allow user to still edit even if fetch fails
            Alert.alert('Warning', `Could not load profile: ${error.message}. You can still update your profile.`);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                // IMPORTANT: Disable editing to avoid blob URIs
                // allowsEditing: true,
                // aspect: [1, 1],
                quality: 1.0, // Use full quality since we're not editing
            });

            if (!result.canceled) {
                const asset = result.assets[0];

                setProfileImage(asset.uri);
                setProfileImageFile(asset);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                // IMPORTANT: Disable editing to avoid blob URIs
                // allowsEditing: true,
                // aspect: [1, 1],
                quality: 1.0, // Use full quality since we're not editing
            });

            if (!result.canceled) {
                const asset = result.assets[0];


                setProfileImage(asset.uri);
                setProfileImageFile(asset);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            });

            if (result.type === 'success') {
                setCertificateForm({ ...certificateForm, documentFile: result });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const saveProfile = async () => {
        try {
            if (!fullName.trim()) {
                Alert.alert('Error', 'Full name is required');
                return;
            }

            setSaving(true);
            const accessToken = await tokenStorage.getAccessToken();

            if (!accessToken) {
                Alert.alert('Error', 'Please login to update your profile');
                navigation.navigate('Login');
                return;
            }

            const formData = new FormData();
            formData.append('fullName', fullName.trim());
            formData.append('bio', bio.trim());
            formData.append('location', location.trim());
            formData.append('socialLinks', JSON.stringify(socialLinks));

            // Handle image upload
            if (profileImageFile && profileImageFile.uri) {
                // Determine proper MIME type
                let mimeType = 'image/jpeg'; // Default
                if (profileImageFile.type) {
                    if (profileImageFile.type === 'image') {
                        // Expo returns 'image', convert to proper MIME type
                        const fileName = profileImageFile.fileName || '';
                        if (fileName.endsWith('.png')) {
                            mimeType = 'image/png';
                        } else if (fileName.endsWith('.gif')) {
                            mimeType = 'image/gif';
                        } else if (fileName.endsWith('.webp')) {
                            mimeType = 'image/webp';
                        }
                    } else if (profileImageFile.type.startsWith('image/')) {
                        mimeType = profileImageFile.type;
                    }
                }

                const fileName = profileImageFile.fileName || `profile-${Date.now()}.jpg`;

                // For blob URIs, we need to fetch and convert to binary
                if (profileImageFile.uri.startsWith('blob:')) {
                    try {
                        const response = await fetch(profileImageFile.uri);
                        const blob = await response.blob();
                        formData.append('profileImage', blob, fileName);
                    } catch (blobError) {
                        formData.append('profileImage', {
                            uri: profileImageFile.uri,
                            type: mimeType,
                            name: fileName,
                        });
                    }
                } else {
                    // Regular file: URI from device
                    formData.append('profileImage', {
                        uri: profileImageFile.uri,
                        type: mimeType,
                        name: fileName,
                    });
                }
            }

            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'ngrok-skip-browser-warning': 'true',
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const updatedUser = data.user || data;

                setProfile(updatedUser);

                if (updatedUser.profileImage) {
                    const imageUrl = getImageUrl(updatedUser.profileImage);
                    setProfileImage(imageUrl);
                }

                setProfileImageFile(null);
                Alert.alert('Success', 'Profile updated successfully!');
            } else if (response.status === 401 || response.status === 403) {
                Alert.alert('Session Expired', 'Please login again');
                navigation.navigate('Login');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Update failed:', errorData);
                Alert.alert('Error', errorData.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('❌ Profile save error:', error);
            Alert.alert('Error', 'Network error. Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddCertificate = async () => {
        try {
            if (!certificateForm.name.trim() || !certificateForm.date || !certificateForm.issuedBy.trim()) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            setSaving(true);
            const accessToken = await tokenStorage.getAccessToken();

            const formData = new FormData();
            formData.append('name', certificateForm.name);
            formData.append('date', certificateForm.date);
            formData.append('issuedBy', certificateForm.issuedBy);

            if (certificateForm.documentFile) {
                formData.append('document', {
                    uri: certificateForm.documentFile.uri,
                    type: certificateForm.documentFile.mimeType || 'application/pdf',
                    name: certificateForm.documentFile.name,
                });
            }

            const response = await fetch(`${API_URL}/profile/certificates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'ngrok-skip-browser-warning': 'true', // Required for ngrok
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setCertificates(data.user.certificates || []);
                setShowCertificateModal(false);
                resetCertificateForm();
                Alert.alert('Success', 'Certificate added successfully!');
            } else {
                Alert.alert('Error', 'Failed to add certificate');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCertificate = async () => {
        try {
            if (!certificateForm.name.trim() || !certificateForm.date || !certificateForm.issuedBy.trim()) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            setSaving(true);
            const accessToken = await tokenStorage.getAccessToken();

            const formData = new FormData();
            formData.append('name', certificateForm.name);
            formData.append('date', certificateForm.date);
            formData.append('issuedBy', certificateForm.issuedBy);

            if (certificateForm.documentFile) {
                formData.append('document', {
                    uri: certificateForm.documentFile.uri,
                    type: certificateForm.documentFile.mimeType || 'application/pdf',
                    name: certificateForm.documentFile.name,
                });
            }

            const response = await fetch(`${API_URL}/profile/certificates/${editingCertificate._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'ngrok-skip-browser-warning': 'true', // Required for ngrok
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setCertificates(data.user.certificates || []);
                setShowCertificateModal(false);
                resetCertificateForm();
                Alert.alert('Success', 'Certificate updated successfully!');
            } else {
                Alert.alert('Error', 'Failed to update certificate');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCertificate = async (certificateId) => {
        Alert.alert(
            'Delete Certificate',
            'Are you sure you want to delete this certificate?',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            const accessToken = await tokenStorage.getAccessToken();

                            const response = await fetch(`${API_URL}/profile/certificates/${certificateId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'ngrok-skip-browser-warning': 'true', // Required for ngrok
                                },
                            });

                            if (response.ok) {
                                const data = await response.json();
                                setCertificates(data.user.certificates || []);
                                Alert.alert('Success', 'Certificate deleted successfully!');
                            } else {
                                Alert.alert('Error', 'Failed to delete certificate');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Network error. Please try again.');
                        } finally {
                            setSaving(false);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const openCertificateForm = (certificate = null) => {
        if (certificate) {
            setEditingCertificate(certificate);
            setCertificateForm({
                name: certificate.name,
                date: certificate.date,
                issuedBy: certificate.issuedBy,
                documentFile: null,
            });
        } else {
            setEditingCertificate(null);
            resetCertificateForm();
        }
        setShowCertificateModal(true);
    };

    const resetCertificateForm = () => {
        setCertificateForm({
            name: '',
            date: '',
            issuedBy: '',
            documentFile: null,
        });
        setEditingCertificate(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
                            const accessToken = await tokenStorage.getAccessToken();

                            // Call backend logout endpoint
                            if (accessToken) {
                                await fetch(`${API_URL}/auth/logout`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json',
                                        'ngrok-skip-browser-warning': 'true',
                                    },
                                });
                            }

                            // Clear notifications for this user before logging out
                            clearNotifications();

                            // Clear tokens from local storage
                            await tokenStorage.clearTokens();

                            // Navigate to login screen
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                            // Even if the API call fails, clear notifications/tokens and navigate to login
                            clearNotifications();
                            await tokenStorage.clearTokens();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const getSocialIcon = (platform) => {
        const iconMap = {
            facebook: 'logo-facebook',
            instagram: 'logo-instagram',
            twitter: 'logo-twitter',
            linkedin: 'logo-linkedin',
            github: 'logo-github',
            portfolio: 'globe',
        };
        return iconMap[platform] || 'link';
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />

                {/* Header with Back Arrow */}
                <View style={styles.profileHeaderBar}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={28} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <TouchableOpacity
                            style={styles.profileImageContainer}
                            onPress={pickImage}
                        >
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <Ionicons name="person-circle-outline" size={120} color="#007AFF" />
                            )}
                            <View style={styles.cameraButton}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.profileName}>{fullName || 'Your Name'}</Text>
                    </View>

                    {/* ── Stats & Reputation ──────────────────────────── */}
                    {stats && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Reputation & Stats</Text>

                            {/* Stats Row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#FFF9E6' }]}>
                                        <Ionicons name="star" size={20} color="#FFD700" />
                                    </View>
                                    <Text style={styles.statValue}>
                                        {stats.averageRating > 0 ? stats.averageRating : '—'}
                                    </Text>
                                    <Text style={styles.statLabel}>Rating</Text>
                                    {stats.averageRating > 0 && renderStars(Math.round(stats.averageRating), 12)}
                                </View>

                                <View style={styles.statDivider} />

                                <View style={styles.statBox}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#E8FAE8' }]}>
                                        <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                    </View>
                                    <Text style={styles.statValue}>{stats.completedExchanges}</Text>
                                    <Text style={styles.statLabel}>Completed</Text>
                                </View>

                                <View style={styles.statDivider} />

                                <View style={styles.statBox}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#E3F2FD' }]}>
                                        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
                                    </View>
                                    <Text style={styles.statValue}>{stats.totalRatings}</Text>
                                    <Text style={styles.statLabel}>Reviews</Text>
                                </View>
                            </View>

                            {/* Badges */}
                            {stats.badges && stats.badges.length > 0 && (
                                <View style={{ marginTop: 14 }}>
                                    <Text style={[styles.label, { marginBottom: 10 }]}>Badges Earned</Text>
                                    <View style={styles.badgesRow}>
                                        {stats.badges.map((badge, index) => {
                                            const c = getBadgeColor(badge.threshold);
                                            return (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.badgeChip,
                                                        { backgroundColor: c.bg, borderColor: c.border },
                                                    ]}
                                                >
                                                    <Ionicons name={badge.icon} size={16} color={c.text} />
                                                    <Text style={[styles.badgeChipText, { color: c.text }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Next Badge Progress */}
                            {stats.nextBadge && (
                                <View style={styles.nextBadgeBar}>
                                    <Ionicons name="flag-outline" size={14} color="#8E8E93" />
                                    <Text style={styles.nextBadgeText}>
                                        {stats.nextBadge.remaining} more exchange{stats.nextBadge.remaining !== 1 ? 's' : ''} until "{stats.nextBadge.label}"
                                    </Text>
                                </View>
                            )}

                            {/* Quick Links */}
                            <View style={styles.quickLinksRow}>
                                <TouchableOpacity
                                    style={styles.quickLink}
                                    onPress={() => navigation.navigate('CreditHistory')}
                                >
                                    <Ionicons name="receipt-outline" size={18} color="#007AFF" />
                                    <Text style={styles.quickLinkText}>Credit History</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                                </TouchableOpacity>

                                <View style={styles.quickLinkDivider} />

                                <TouchableOpacity
                                    style={styles.quickLink}
                                    onPress={() => navigation.navigate('ReceivedRatings')}
                                >
                                    <Ionicons name="star-outline" size={18} color="#007AFF" />
                                    <Text style={styles.quickLinkText}>My Ratings</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Basic Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>

                        {profile?.email && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.readOnlyInput}>
                                    <Ionicons name="mail" size={20} color="#666" />
                                    <Text style={styles.readOnlyText}>{profile.email}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Tell us about yourself"
                                value={bio}
                                onChangeText={setBio}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor="#999"
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <View style={styles.inputWithIcon}>
                                <Ionicons name="location" size={20} color="#007AFF" />
                                <TextInput
                                    style={styles.inputWithIconText}
                                    placeholder="Enter your location"
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Social Links */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Social Links</Text>

                        {Object.keys(socialLinks).map((key) => (
                            <View key={key} style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Text>
                                <View style={styles.inputWithIcon}>
                                    <Ionicons
                                        name={getSocialIcon(key)}
                                        size={20}
                                        color="#007AFF"
                                    />
                                    <TextInput
                                        style={styles.inputWithIconText}
                                        placeholder={`Your ${key} profile link`}
                                        value={socialLinks[key]}
                                        onChangeText={(text) =>
                                            setSocialLinks({ ...socialLinks, [key]: text })
                                        }
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Certificates */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Certificates</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => openCertificateForm()}
                            >
                                <Ionicons name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {certificates.length > 0 ? (
                            certificates.map((cert) => (
                                <View key={cert._id} style={styles.certificateCard}>
                                    <View style={styles.certificateHeader}>
                                        <View style={styles.certificateInfo}>
                                            <Text style={styles.certificateName}>{cert.name}</Text>
                                            <Text style={styles.certificateDate}>
                                                {formatDate(cert.date)}
                                            </Text>
                                            <Text style={styles.certificateIssuer}>
                                                Issued by: {cert.issuedBy}
                                            </Text>
                                        </View>
                                        <View style={styles.certificateActions}>
                                            <TouchableOpacity
                                                onPress={() => openCertificateForm(cert)}
                                                style={styles.iconButton}
                                            >
                                                <Ionicons name="pencil" size={20} color="#007AFF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteCertificate(cert._id)}
                                                style={[styles.iconButton, styles.deleteButton]}
                                            >
                                                <Ionicons name="trash" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {cert.documentUrl && (
                                        <TouchableOpacity
                                            style={styles.documentLink}
                                            onPress={() => {
                                                const docUrl = getImageUrl(cert.documentUrl);
                                                if (docUrl) {
                                                    // You can open the URL in a browser or handle it as needed
                                                    Alert.alert('Document', `Document URL: ${docUrl}`);
                                                }
                                            }}
                                        >
                                            <Ionicons name="document" size={16} color="#007AFF" />
                                            <Text style={styles.documentLinkText}>
                                                View Document
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No certificates yet. Add one to get started!</Text>
                        )}
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.disabledButton]}
                        onPress={saveProfile}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Save Profile</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>

                    <View style={styles.spacing} />
                </ScrollView>

                {/* Certificate Modal */}
                <Modal
                    visible={showCertificateModal}
                    animationType="slide"
                    transparent={true}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingCertificate ? 'Edit Certificate' : 'Add Certificate'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowCertificateModal(false);
                                        resetCertificateForm();
                                    }}
                                >
                                    <Ionicons name="close" size={28} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScroll}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Certificate Name *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., AWS Certified Solutions Architect"
                                        value={certificateForm.name}
                                        onChangeText={(text) =>
                                            setCertificateForm({ ...certificateForm, name: text })
                                        }
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Date Issued *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        value={certificateForm.date}
                                        onChangeText={(text) =>
                                            setCertificateForm({ ...certificateForm, date: text })
                                        }
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Issued By *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Amazon Web Services"
                                        value={certificateForm.issuedBy}
                                        onChangeText={(text) =>
                                            setCertificateForm({ ...certificateForm, issuedBy: text })
                                        }
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Upload Document (Optional)</Text>
                                    <TouchableOpacity
                                        style={styles.documentButton}
                                        onPress={pickDocument}
                                    >
                                        <Ionicons name="document-attach" size={20} color="#007AFF" />
                                        <Text style={styles.documentButtonText}>
                                            {certificateForm.documentFile
                                                ? certificateForm.documentFile.name
                                                : 'Choose File'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.modalButton, saving && styles.disabledButton]}
                                    onPress={editingCertificate ? handleUpdateCertificate : handleAddCertificate}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.modalButtonText}>
                                            {editingCertificate ? 'Update Certificate' : 'Add Certificate'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        </KeyboardAvoidingView>
    );
}

const getSocialIcon = (platform) => {
    const iconMap = {
        facebook: 'logo-facebook',
        instagram: 'logo-instagram',
        twitter: 'logo-twitter',
        linkedin: 'logo-linkedin',
        github: 'logo-github',
        portfolio: 'globe',
    };
    return iconMap[platform] || 'link';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        paddingVertical: 12,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f9f9f9',
    },
    inputWithIconText: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 14,
        color: '#000',
    },
    readOnlyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
    },
    readOnlyText: {
        flex: 1,
        paddingHorizontal: 8,
        fontSize: 14,
        color: '#666',
    },
    certificateCard: {
        backgroundColor: '#f9f9f9',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    certificateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    certificateInfo: {
        flex: 1,
    },
    certificateName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    certificateDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    certificateIssuer: {
        fontSize: 12,
        color: '#999',
    },
    certificateActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 6,
    },
    deleteButton: {
        marginLeft: 4,
    },
    documentLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    documentLinkText: {
        color: '#007AFF',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    addButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        marginHorizontal: 15,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    modalScroll: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    documentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#f0f8ff',
    },
    documentButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 10,
        flex: 1,
    },
    modalButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    profileHeaderBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    headerSpacer: {
        width: 36, // Same width as back button to center title
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    logoutButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    spacing: {
        height: 20,
    },
    // ── Stats & Reputation styles ───────────────────────────────────────────
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        padding: 14,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statIconBg: {
        width: 38,
        height: 38,
        borderRadius: 19,
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
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 2,
    },
    statDivider: {
        width: 1,
        height: 50,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 4,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    badgeChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    nextBadgeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 10,
        marginTop: 12,
        gap: 8,
    },
    nextBadgeText: {
        fontSize: 12,
        color: '#636366',
        flex: 1,
        lineHeight: 16,
    },
    quickLinksRow: {
        marginTop: 14,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        overflow: 'hidden',
    },
    quickLink: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    quickLinkText: {
        flex: 1,
        fontSize: 15,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    quickLinkDivider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 14,
    },
});

export default ProfileScreen;
