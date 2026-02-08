import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const ExchangeRequestDetail = ({ route, navigation }) => {
    const { requestId } = route.params;
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [proposalModalVisible, setProposalModalVisible] = useState(false);
    const [submittingProposal, setSubmittingProposal] = useState(false);
    const [proposalData, setProposalData] = useState({
        coverLetter: '',
        acceptanceType: '', // 'accept_deal' or 'admin_quantification'
    });

    useEffect(() => {
        loadRequest();
    }, [requestId]);

    const loadRequest = async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            if (!token) {
                Alert.alert('Error', 'Please login to view request details');
                navigation.navigate('Login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/marketplace/requests/${requestId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
                },
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', responseText.substring(0, 200));
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                setRequest(data);
            } else {
                Alert.alert('Error', data.message || 'Failed to load request');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading request:', error);
            Alert.alert('Error', 'Failed to load request details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleProposeServices = () => {
        if (request?.userId?._id && request.userId._id === 'current_user_id') {
            Alert.alert('Error', 'You cannot propose on your own request');
            return;
        }
        setProposalModalVisible(true);
    };

    const handleSubmitProposal = async () => {
        if (!proposalData.coverLetter.trim()) {
            Alert.alert('Error', 'Please write a cover letter');
            return;
        }
        if (!proposalData.acceptanceType) {
            Alert.alert('Error', 'Please select an acceptance option');
            return;
        }

        setSubmittingProposal(true);
        try {
            const token = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/marketplace/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
                },
                body: JSON.stringify({
                    requestId: requestId,
                    coverLetter: proposalData.coverLetter,
                    acceptanceType: proposalData.acceptanceType,
                }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', responseText.substring(0, 200));
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                const successMessage = proposalData.acceptanceType === 'admin_quantification'
                    ? 'Request being processed. Admin will verify and quantify the deal.'
                    : 'Your proposal has been submitted!';
                Alert.alert('Success', successMessage, [
                    {
                        text: 'OK', onPress: () => {
                            setProposalModalVisible(false);
                            setProposalData({ coverLetter: '', acceptanceType: '' });
                            loadRequest();
                        }
                    }
                ]);
            } else {
                Alert.alert('Error', data.message || 'Failed to submit proposal');
            }
        } catch (error) {
            console.error('Error submitting proposal:', error);
            Alert.alert('Error', 'Failed to submit proposal. Please try again.');
        } finally {
            setSubmittingProposal(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </SafeAreaView>
        );
    }

    if (!request) {
        return null;
    }

    const isOwner = false; // You would check this against current user ID

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.userCard}>
                    <View style={styles.userInfo}>
                        {request.userId?.profileImage ? (
                            <Image source={{ uri: request.userId.profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={24} color="#007AFF" />
                            </View>
                        )}
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{request.userId?.fullName || 'User'}</Text>
                            <Text style={styles.userLocation}>{request.location || 'Remote'}</Text>
                        </View>
                    </View>
                    <View style={styles.creditsBadge}>
                        <Ionicons name="star" size={16} color="#FFA500" />
                        <Text style={styles.creditsText}>{request.estimatedCredits}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.title}>{request.title}</Text>
                    <Text style={styles.description}>{request.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skill Sought</Text>
                    <View style={styles.skillTag}>
                        <Text style={styles.skillTagText}>{request.skillSearched}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What They Offer</Text>
                    <Text style={styles.offerText}>{request.whatYouOffer}</Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={20} color="#007AFF" />
                        <Text style={styles.infoLabel}>Duration</Text>
                        <Text style={styles.infoValue}>{request.estimatedDuration} hours</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                        <Text style={styles.infoLabel}>Deadline</Text>
                        <Text style={styles.infoValue}>
                            {new Date(request.desiredDeadline).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="layers-outline" size={20} color="#007AFF" />
                        <Text style={styles.infoLabel}>Level</Text>
                        <Text style={styles.infoValue}>{request.level}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="pricetag-outline" size={20} color="#007AFF" />
                        <Text style={styles.infoLabel}>Credits</Text>
                        <Text style={styles.infoValue}>{request.estimatedCredits}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Status</Text>
                    <View style={[styles.statusBadge, styles[`status${request.status}`]]}>
                        <Text style={styles.statusText}>
                            {request.status.replace(/_/g, ' ')}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {!isOwner && request.status === 'open' && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.proposeButton}
                        onPress={handleProposeServices}
                    >
                        <Ionicons name="hand-left-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.proposeButtonText}>Propose My Services</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={proposalModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setProposalModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Proposal</Text>
                            <TouchableOpacity onPress={() => setProposalModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Cover Letter *</Text>
                                <TextInput
                                    style={[styles.modalInput, styles.modalTextArea]}
                                    placeholder="Explain why you're the right person for this project..."
                                    value={proposalData.coverLetter}
                                    onChangeText={(text) => setProposalData({ ...proposalData, coverLetter: text })}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Response Option *</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.checkboxOption,
                                        proposalData.acceptanceType === 'accept_deal' && styles.checkboxOptionActive
                                    ]}
                                    onPress={() => setProposalData({ ...proposalData, acceptanceType: 'accept_deal' })}
                                >
                                    <View style={styles.checkboxOptionLeft}>
                                        <View style={[
                                            styles.checkbox,
                                            proposalData.acceptanceType === 'accept_deal' && styles.checkboxActive
                                        ]}>
                                            {proposalData.acceptanceType === 'accept_deal' && (
                                                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                            )}
                                        </View>
                                        <View style={styles.checkboxTextContainer}>
                                            <Text style={styles.checkboxTitle}>Accept Deal</Text>
                                            <Text style={styles.checkboxDescription}>
                                                Submit and immediately accept the offer
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.checkboxOption,
                                        proposalData.acceptanceType === 'admin_quantification' && styles.checkboxOptionActive
                                    ]}
                                    onPress={() => setProposalData({ ...proposalData, acceptanceType: 'admin_quantification' })}
                                >
                                    <View style={styles.checkboxOptionLeft}>
                                        <View style={[
                                            styles.checkbox,
                                            proposalData.acceptanceType === 'admin_quantification' && styles.checkboxActive
                                        ]}>
                                            {proposalData.acceptanceType === 'admin_quantification' && (
                                                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                            )}
                                        </View>
                                        <View style={styles.checkboxTextContainer}>
                                            <Text style={styles.checkboxTitle}>Admin Quantification</Text>
                                            <Text style={styles.checkboxDescription}>
                                                Costs 4 credits (deducted from offer value)
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <Text style={styles.modalHelperText}>
                                    Estimated Credits: {request.estimatedCredits} credits
                                </Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setProposalModalVisible(false)}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={handleSubmitProposal}
                                disabled={submittingProposal}
                            >
                                {submittingProposal ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    userLocation: {
        fontSize: 14,
        color: '#8E8E93',
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF4E6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    creditsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF8C00',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#000000',
        lineHeight: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    skillTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    skillTagText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },
    offerText: {
        fontSize: 16,
        color: '#000000',
        lineHeight: 24,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    infoItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    infoLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 8,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusopen: {
        backgroundColor: '#E8F5E9',
    },
    statusin_progress: {
        backgroundColor: '#FFF3E0',
    },
    statuscompleted: {
        backgroundColor: '#E3F2FD',
    },
    statuscancelled: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        textTransform: 'capitalize',
    },
    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    proposeButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    proposeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    modalBody: {
        padding: 16,
    },
    modalInputGroup: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#000000',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    modalTextArea: {
        height: 120,
        paddingTop: 16,
    },
    modalHelperText: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 8,
    },
    checkboxOption: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E5EA',
    },
    checkboxOptionActive: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F8FF',
    },
    checkboxOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkboxTextContainer: {
        flex: 1,
    },
    checkboxTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    checkboxDescription: {
        fontSize: 13,
        color: '#8E8E93',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: '#007AFF',
    },
    modalButtonSecondary: {
        backgroundColor: '#F2F2F7',
    },
    modalButtonPrimaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalButtonSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default ExchangeRequestDetail;

