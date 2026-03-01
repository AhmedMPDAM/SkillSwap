import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Alert, TextInput, ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const STATUS_CONFIG = {
    pending_review: { label: 'Pending Review', color: '#FF9500', icon: 'time-outline', bg: 'rgba(255,149,0,0.1)' },
    revision_requested: { label: 'Revision Requested', color: '#FF3B30', icon: 'refresh-outline', bg: 'rgba(255,59,48,0.1)' },
    approved: { label: 'Approved', color: '#34C759', icon: 'checkmark-circle', bg: 'rgba(52,199,89,0.1)' },
};

// ─── Submission Card ──────────────────────────────────────────────────────────
const SubmissionCard = ({ item, isRequestOwner, onRequestRevision, onApprove }) => {
    const [revisionNotes, setRevisionNotes] = useState('');
    const [showRevisionInput, setShowRevisionInput] = useState(false);
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_review;

    return (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
                    <Text style={[s.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
                <Text style={s.revisionNum}>Rev #{item.revisionNumber}</Text>
            </View>

            <TouchableOpacity style={s.fileRow} onPress={() => {
                const url = `${API_BASE_URL}/uploads/${item.filePath}`;
                Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open file'));
            }}>
                <Ionicons name="document-attach" size={22} color="#007AFF" />
                <View style={s.fileInfo}>
                    <Text style={s.fileName} numberOfLines={1}>{item.fileName}</Text>
                    <Text style={s.fileMeta}>{formatFileSize(item.fileSize)}</Text>
                </View>
                <Ionicons name="download-outline" size={18} color="#007AFF" />
            </TouchableOpacity>

            {item.message ? (
                <View style={s.msgBox}>
                    <Ionicons name="chatbubble-outline" size={13} color="#8E8E93" />
                    <Text style={s.msgText}>{item.message}</Text>
                </View>
            ) : null}

            {item.revisionNotes ? (
                <View style={[s.msgBox, { backgroundColor: 'rgba(255,59,48,0.06)', borderColor: 'rgba(255,59,48,0.15)' }]}>
                    <Ionicons name="alert-circle-outline" size={13} color="#FF3B30" />
                    <Text style={[s.msgText, { color: '#FF3B30' }]}>{item.revisionNotes}</Text>
                </View>
            ) : null}

            <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>

            {isRequestOwner && item.status === 'pending_review' && (
                <View style={s.actionRow}>
                    {showRevisionInput ? (
                        <View style={s.revisionInputWrap}>
                            <TextInput
                                style={s.revisionInput}
                                value={revisionNotes}
                                onChangeText={setRevisionNotes}
                                placeholder="Describe what needs to be changed…"
                                placeholderTextColor="#8E8E93"
                                multiline
                            />
                            <View style={s.revisionBtns}>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowRevisionInput(false); setRevisionNotes(''); }}>
                                    <Text style={s.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.sendRevBtn, !revisionNotes.trim() && { opacity: 0.4 }]}
                                    disabled={!revisionNotes.trim()}
                                    onPress={() => { onRequestRevision(item._id, revisionNotes); setShowRevisionInput(false); setRevisionNotes(''); }}
                                >
                                    <Text style={s.sendRevBtnText}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={s.revisionBtn} onPress={() => setShowRevisionInput(true)}>
                                <Ionicons name="refresh-outline" size={16} color="#FF9500" />
                                <Text style={s.revisionBtnText}>Request Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.approveBtn} onPress={() => onApprove(item._id)}>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={s.approveBtnText}>Approve & Pay</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────
const SubmissionPanel = ({ requestId, proposalId, chatId, isRequestOwner, onExchangeCompleted }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const canSubmit = !isRequestOwner; // proposer submits
    const latestSubmission = submissions[0]; // sorted by newest first
    const needsResubmission = latestSubmission?.status === 'revision_requested';

    const fetchSubmissions = useCallback(async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/marketplace/requests/${requestId}/submissions`, {
                headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.submissions || []);
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setLoading(false);
        }
    }, [requestId]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    // ── Pick & upload file ────────────────────────────────────────────────────
    const handleSubmitWork = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
            if (result.canceled) return;

            const file = result.assets[0];
            setUploading(true);

            const formData = new FormData();
            formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
            formData.append('proposalId', proposalId);
            formData.append('message', submitMessage);

            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/marketplace/requests/${requestId}/submissions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setSubmitMessage('');
                fetchSubmissions();
                // Post system message in chat
                try {
                    const messagesRef = collection(db, 'chats', chatId, 'messages');
                    await addDoc(messagesRef, {
                        text: `📎 Work submitted: "${file.name}" (Revision #${data.submission?.revisionNumber || '?'})`,
                        type: 'system', createdAt: serverTimestamp(),
                    });
                } catch (_) { }
                Alert.alert('✅ Submitted!', 'Your work has been submitted for review.');
            } else {
                Alert.alert('Error', data.message || 'Failed to submit work.');
            }
        } catch (err) {
            console.error('Submit work error:', err);
            Alert.alert('Error', 'Could not submit the file. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [requestId, proposalId, chatId, submitMessage, fetchSubmissions]);

    // ── Request revision ──────────────────────────────────────────────────────
    const handleRequestRevision = useCallback(async (submissionId, notes) => {
        setActionLoading(true);
        try {
            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/marketplace/submissions/${submissionId}/request-revision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ revisionNotes: notes }),
            });
            const data = await res.json();
            if (res.ok) {
                fetchSubmissions();
                try {
                    const messagesRef = collection(db, 'chats', chatId, 'messages');
                    await addDoc(messagesRef, { text: `🔄 Revision requested: "${notes}"`, type: 'system', createdAt: serverTimestamp() });
                } catch (_) { }
            } else {
                Alert.alert('Error', data.message || 'Failed to request revision.');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not request revision.');
        } finally {
            setActionLoading(false);
        }
    }, [chatId, fetchSubmissions]);

    // ── Approve ───────────────────────────────────────────────────────────────
    const handleApprove = useCallback((submissionId) => {
        Alert.alert('Approve & Complete', 'This will release the locked credits to the service provider. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve & Pay', style: 'default', onPress: async () => {
                    setActionLoading(true);
                    try {
                        const token = await tokenStorage.getAccessToken();
                        const res = await fetch(`${API_BASE_URL}/api/marketplace/submissions/${submissionId}/approve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                            body: JSON.stringify({}),
                        });
                        const data = await res.json();
                        if (res.ok) {
                            fetchSubmissions();
                            try {
                                const messagesRef = collection(db, 'chats', chatId, 'messages');
                                await addDoc(messagesRef, { text: '✅ Work approved! Credits have been transferred.', type: 'system', createdAt: serverTimestamp() });
                            } catch (_) { }
                            onExchangeCompleted?.();
                            Alert.alert('✅ Exchange Complete!', 'Credits have been transferred.');
                        } else {
                            Alert.alert('Error', data.message || 'Failed to approve.');
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Could not approve submission.');
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    }, [chatId, fetchSubmissions, onExchangeCompleted]);

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) return <ActivityIndicator style={{ padding: 12 }} size="small" color="#007AFF" />;

    return (
        <View style={s.panel}>
            {/* Toggle header */}
            <TouchableOpacity style={s.panelHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
                <View style={s.panelHeaderLeft}>
                    <Ionicons name="cloud-upload-outline" size={18} color="#007AFF" />
                    <Text style={s.panelTitle}>Work Submissions</Text>
                    {submissions.length > 0 && (
                        <View style={s.countBadge}>
                            <Text style={s.countText}>{submissions.length}</Text>
                        </View>
                    )}
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
            </TouchableOpacity>

            {expanded && (
                <View style={s.panelBody}>
                    {/* Submit work area (for proposer only) */}
                    {canSubmit && (
                        <View style={s.submitSection}>
                            {needsResubmission && (
                                <View style={s.resubBanner}>
                                    <Ionicons name="alert-circle" size={15} color="#FF9500" />
                                    <Text style={s.resubText}>Changes requested — please resubmit</Text>
                                </View>
                            )}
                            <TextInput
                                style={s.submitMsgInput}
                                value={submitMessage}
                                onChangeText={setSubmitMessage}
                                placeholder="Add a note about your submission (optional)…"
                                placeholderTextColor="#8E8E93"
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity style={s.uploadBtn} onPress={handleSubmitWork} disabled={uploading}>
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={18} color="#fff" />
                                        <Text style={s.uploadBtnText}>
                                            {needsResubmission ? 'Resubmit Work' : 'Upload & Submit Work'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Submissions list */}
                    {submissions.length === 0 ? (
                        <View style={s.emptyState}>
                            <Ionicons name="document-outline" size={32} color="#C7C7CC" />
                            <Text style={s.emptyText}>No submissions yet</Text>
                        </View>
                    ) : (
                        <ScrollView style={s.submissionsList} nestedScrollEnabled>
                            {submissions.map((item) => (
                                <SubmissionCard
                                    key={item._id}
                                    item={item}
                                    isRequestOwner={isRequestOwner}
                                    onRequestRevision={handleRequestRevision}
                                    onApprove={handleApprove}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}

            {actionLoading && (
                <View style={s.overlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            )}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    panel: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    panelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    panelTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
    countBadge: { backgroundColor: '#007AFF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    panelBody: { paddingHorizontal: 16, paddingBottom: 14 },

    // Submit section
    submitSection: { marginBottom: 12, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
    resubBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,149,0,0.1)', padding: 8, borderRadius: 8, marginBottom: 10 },
    resubText: { fontSize: 12, fontWeight: '600', color: '#FF9500' },
    submitMsgInput: { backgroundColor: '#fff', borderRadius: 10, padding: 10, fontSize: 13, color: '#1C1C1E', borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10, maxHeight: 80 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 12, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
    uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Submissions list
    submissionsList: { maxHeight: 300 },
    emptyState: { alignItems: 'center', paddingVertical: 20 },
    emptyText: { color: '#8E8E93', fontSize: 13, marginTop: 6 },

    // Card
    card: { backgroundColor: '#F9F9FB', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5EA' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '600' },
    revisionNum: { fontSize: 11, color: '#8E8E93', fontWeight: '600' },

    fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, gap: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 6 },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
    fileMeta: { fontSize: 11, color: '#8E8E93', marginTop: 1 },

    msgBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: 'rgba(0,122,255,0.05)', borderRadius: 8, padding: 8, marginTop: 6, borderWidth: 1, borderColor: 'rgba(0,122,255,0.1)' },
    msgText: { flex: 1, fontSize: 12, color: '#3C3C43', lineHeight: 17 },

    dateText: { fontSize: 10, color: '#8E8E93', marginTop: 6, textAlign: 'right' },

    // Actions
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    revisionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(255,149,0,0.1)', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,149,0,0.2)' },
    revisionBtnText: { fontSize: 12, fontWeight: '700', color: '#FF9500' },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#34C759', borderRadius: 10, paddingVertical: 10, shadowColor: '#34C759', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 2 },
    approveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    // Revision input
    revisionInputWrap: { flex: 1 },
    revisionInput: { backgroundColor: '#fff', borderRadius: 10, padding: 10, fontSize: 13, color: '#1C1C1E', borderWidth: 1, borderColor: '#FF9500', marginBottom: 8, maxHeight: 80 },
    revisionBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F2F2F7' },
    cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
    sendRevBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FF9500' },
    sendRevBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
});

export default SubmissionPanel;
