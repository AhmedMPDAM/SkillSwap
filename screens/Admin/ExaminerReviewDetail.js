import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const complexityColors = {
    simple: '#34C759',
    medium: '#FF9500',
    advanced: '#FF6B35',
    expert: '#FF3B30',
};
const complexityLabel = {
    simple: 'Simple',
    medium: 'Medium',
    advanced: 'Advanced',
    expert: 'Expert',
};

const InfoRow = ({ icon, label, value, color }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoIconWrap}>
            <Ionicons name={icon} size={18} color={color || '#007AFF'} />
        </View>
        <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
    </View>
);

const ExaminerReviewDetail = ({ navigation, route }) => {
    const { proposalId } = route.params || {};

    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Examiner decision fields
    const [modifyCredits, setModifyCredits] = useState(false);
    const [assignedCredits, setAssignedCredits] = useState('');
    const [examinerNote, setExaminerNote] = useState('');

    useEffect(() => {
        fetchProposal();
    }, [proposalId]);

    const fetchProposal = async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/examiner/queue/${proposalId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setProposal(data.proposal);
                // Pre-fill credits with the request estimated credits
                setAssignedCredits(String(data.proposal.exchangeRequestId?.estimatedCredits ?? ''));
            } else {
                Alert.alert('Error', 'Failed to load proposal details.');
                navigation.goBack();
            }
        } catch (err) {
            console.error('Fetch proposal error:', err);
            Alert.alert('Error', 'Network error.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;

        const creditsToSend = modifyCredits ? Number(assignedCredits) : null;
        if (modifyCredits && (isNaN(creditsToSend) || creditsToSend <= 0)) {
            Alert.alert('Validation', 'Please enter a valid credit amount.');
            return;
        }

        Alert.alert(
            'Confirm Review',
            modifyCredits
                ? `Approve this proposal with ${creditsToSend} credit(s)${examinerNote ? ' and a note' : ''}?`
                : `Approve this proposal with the original estimated credits (${proposal?.exchangeRequestId?.estimatedCredits})?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'default',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const token = await tokenStorage.getAccessToken();
                            const body = {};
                            if (modifyCredits) body.assignedCredits = creditsToSend;
                            if (examinerNote.trim()) body.examinerNote = examinerNote.trim();

                            const res = await fetch(
                                `${API_BASE_URL}/api/admin/examiner/queue/${proposalId}/review`,
                                {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                        'ngrok-skip-browser-warning': 'true',
                                    },
                                    body: JSON.stringify(body),
                                }
                            );

                            const data = await res.json();
                            if (res.ok) {
                                Alert.alert(
                                    '✅ Approved',
                                    `Proposal approved with ${data.assignedCredits} credit(s). The proposer has been notified and a chat room has been opened.`,
                                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                                );
                            } else {
                                Alert.alert('Error', data.message || 'Review failed.');
                            }
                        } catch (err) {
                            console.error('Submit review error:', err);
                            Alert.alert('Error', 'Network error. Please try again.');
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading proposal…</Text>
            </SafeAreaView>
        );
    }

    const request = proposal?.exchangeRequestId || {};
    const requestOwner = request.userId || {};
    const proposer = proposal?.proposerId || {};
    const complexity = request.complexity || 'medium';
    const complexityColor = complexityColors[complexity] || '#FF9500';

    const deadline = request.desiredDeadline
        ? new Date(request.desiredDeadline).toLocaleDateString([], {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '—';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Proposal Review</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Proposer card ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Proposer</Text>
                        <View style={styles.personCard}>
                            <View style={[styles.personAvatar, { backgroundColor: '#667eea' }]}>
                                <Text style={styles.personAvatarText}>
                                    {(proposer.fullName || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personName}>{proposer.fullName || 'Unknown'}</Text>
                                <Text style={styles.personEmail}>{proposer.email}</Text>
                                <Text style={styles.personCredits}>
                                    Credits: {proposer.credits ?? '—'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Request details ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Exchange Request</Text>
                        <View style={styles.card}>
                            <Text style={styles.requestTitle}>{request.title}</Text>
                            <Text style={styles.requestDescription}>{request.description}</Text>

                            <View style={styles.divider} />

                            <InfoRow icon="search-outline" label="Skill searched" value={request.skillSearched} />
                            <InfoRow icon="layers-outline" label="Category" value={request.category} />
                            <InfoRow icon="trending-up-outline" label="Level" value={request.level} />
                            <InfoRow icon="gift-outline" label="What they offer" value={request.whatYouOffer} />
                            <InfoRow icon="time-outline" label="Estimated duration" value={`${request.estimatedDuration} hrs`} />
                            <InfoRow icon="calendar-outline" label="Deadline" value={deadline} color="#FF3B30" />

                            {/* Credits & Complexity */}
                            <View style={styles.creditComplexityRow}>
                                <LinearGradient
                                    colors={['#007AFF', '#0051D5']}
                                    style={styles.creditChip}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="star" size={14} color="#FFF" />
                                    <Text style={styles.creditChipText}>
                                        {request.estimatedCredits} credits
                                    </Text>
                                </LinearGradient>
                                <View style={[styles.complexityChip, { backgroundColor: complexityColor + '18', borderColor: complexityColor }]}>
                                    <View style={[styles.complexityDot, { backgroundColor: complexityColor }]} />
                                    <Text style={[styles.complexityChipText, { color: complexityColor }]}>
                                        {complexityLabel[complexity]}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ── Request owner ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Request Owner</Text>
                        <View style={styles.personCard}>
                            <View style={[styles.personAvatar, { backgroundColor: '#34C759' }]}>
                                <Text style={styles.personAvatarText}>
                                    {(requestOwner.fullName || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personName}>{requestOwner.fullName || 'Unknown'}</Text>
                                <Text style={styles.personEmail}>{requestOwner.email}</Text>
                                <Text style={styles.personCredits}>
                                    Credits: {requestOwner.credits ?? '—'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Proposer's cover letter ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cover Letter from Proposer</Text>
                        <View style={styles.coverCard}>
                            <Ionicons name="document-text-outline" size={20} color="#667eea" style={{ marginBottom: 8 }} />
                            <Text style={styles.coverText}>{proposal?.coverLetter}</Text>
                        </View>
                    </View>

                    {/* ── Examiner decision ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Decision</Text>

                        {/* Toggle: approve as-is vs. modify */}
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, !modifyCredits && styles.toggleBtnActive]}
                                onPress={() => setModifyCredits(false)}
                            >
                                <Ionicons name="checkmark-circle" size={18} color={!modifyCredits ? '#FFF' : '#8E8E93'} />
                                <Text style={[styles.toggleBtnText, !modifyCredits && styles.toggleBtnTextActive]}>
                                    Approve as-is
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, modifyCredits && styles.toggleBtnActiveOrange]}
                                onPress={() => setModifyCredits(true)}
                            >
                                <Ionicons name="pencil" size={18} color={modifyCredits ? '#FFF' : '#8E8E93'} />
                                <Text style={[styles.toggleBtnText, modifyCredits && styles.toggleBtnTextActive]}>
                                    Modify credits
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Credit input (only when modifying) */}
                        {modifyCredits && (
                            <View style={styles.inputBlock}>
                                <Text style={styles.inputLabel}>
                                    Assigned Credits
                                    <Text style={styles.inputHint}> (original: {request.estimatedCredits})</Text>
                                </Text>
                                <View style={styles.creditInput}>
                                    <Ionicons name="star-outline" size={18} color="#007AFF" />
                                    <TextInput
                                        style={styles.creditTextInput}
                                        value={assignedCredits}
                                        onChangeText={setAssignedCredits}
                                        keyboardType="numeric"
                                        placeholder="Enter credits"
                                        placeholderTextColor="#C7C7CC"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Examiner note */}
                        <View style={styles.inputBlock}>
                            <Text style={styles.inputLabel}>
                                Examiner Note{' '}
                                <Text style={styles.inputHint}>(optional — sent to proposer)</Text>
                            </Text>
                            <TextInput
                                style={styles.noteInput}
                                value={examinerNote}
                                onChangeText={setExaminerNote}
                                placeholder="Add a covering note for the proposer…"
                                placeholderTextColor="#C7C7CC"
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>{examinerNote.length}/500</Text>
                        </View>
                    </View>

                    {/* Bottom spacer */}
                    <View style={{ height: 16 }} />
                </ScrollView>

                {/* ── Sticky Submit Button ── */}
                <View style={styles.stickyFooter}>
                    <TouchableOpacity
                        style={[styles.approveBtn, submitting && styles.approveBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={submitting ? ['#C7C7CC', '#C7C7CC'] : ['#34C759', '#2DB14E']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.approveBtnGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                                    <Text style={styles.approveBtnText}>
                                        {modifyCredits ? 'Approve with Modified Credits' : 'Approve Proposal'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    center: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#8E8E93',
        fontSize: 15,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },

    // Scroll
    scrollContent: {
        padding: 16,
    },

    // Section
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        paddingLeft: 4,
    },

    // Person card
    personCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    personAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    personAvatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
    personInfo: { flex: 1 },
    personName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },
    personEmail: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    personCredits: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 4,
    },

    // Request card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    requestTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000000',
        marginBottom: 8,
    },
    requestDescription: {
        fontSize: 14,
        color: '#636366',
        lineHeight: 20,
        marginBottom: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 14,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    infoIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextWrap: { flex: 1 },
    infoLabel: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    infoValue: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
        marginTop: 2,
    },
    creditComplexityRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
        flexWrap: 'wrap',
    },
    creditChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 7,
        gap: 6,
    },
    creditChipText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    complexityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1.5,
        gap: 6,
    },
    complexityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    complexityChipText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Cover letter
    coverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    coverText: {
        fontSize: 14,
        color: '#1C1C1E',
        lineHeight: 22,
        fontStyle: 'italic',
    },

    // Decision toggle
    toggleRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#F2F2F7',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
    },
    toggleBtnActive: {
        backgroundColor: '#34C759',
        borderColor: '#34C759',
    },
    toggleBtnActiveOrange: {
        backgroundColor: '#FF9500',
        borderColor: '#FF9500',
    },
    toggleBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    toggleBtnTextActive: {
        color: '#FFFFFF',
    },

    // Inputs
    inputBlock: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '400',
    },
    creditInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: '#007AFF',
        gap: 10,
    },
    creditTextInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    noteInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        fontSize: 14,
        color: '#000000',
        minHeight: 100,
        lineHeight: 20,
    },
    charCount: {
        fontSize: 11,
        color: '#8E8E93',
        textAlign: 'right',
        marginTop: 4,
    },

    // Footer
    stickyFooter: {
        padding: 16,
        backgroundColor: '#F2F2F7',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    approveBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    approveBtnDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    approveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    approveBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default ExaminerReviewDetail;
