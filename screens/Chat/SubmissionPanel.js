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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtSize = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};
const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const STATUS = {
    pending_review: { label: 'Pending Review', color: '#FF9500', icon: 'time-outline', bg: 'rgba(255,149,0,0.1)' },
    revision_requested: { label: 'Revision Needed', color: '#FF3B30', icon: 'refresh-outline', bg: 'rgba(255,59,48,0.1)' },
    approved: { label: 'Approved ✓', color: '#34C759', icon: 'checkmark-circle', bg: 'rgba(52,199,89,0.1)' },
};

// ─── Submission Card ──────────────────────────────────────────────────────────
const SubmissionCard = ({ item, canReview, onRequestRevision, onApprove }) => {
    const [notes, setNotes] = useState('');
    const [showInput, setShowInput] = useState(false);
    const st = STATUS[item.status] || STATUS.pending_review;

    return (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <View style={[s.badge, { backgroundColor: st.bg }]}>
                    <Ionicons name={st.icon} size={11} color={st.color} />
                    <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
                <Text style={s.revNum}>Rev #{item.revisionNumber}</Text>
            </View>

            <TouchableOpacity style={s.fileRow} onPress={() => {
                Linking.openURL(`${API_BASE_URL}/uploads/${item.filePath}`).catch(() =>
                    Alert.alert('Error', 'Cannot open file'));
            }}>
                <Ionicons name="document-attach" size={20} color="#007AFF" />
                <View style={{ flex: 1 }}>
                    <Text style={s.fileName} numberOfLines={1}>{item.fileName}</Text>
                    <Text style={s.fileMeta}>{fmtSize(item.fileSize)}</Text>
                </View>
                <Ionicons name="download-outline" size={16} color="#007AFF" />
            </TouchableOpacity>

            {item.message ? (
                <View style={s.noteBox}>
                    <Ionicons name="chatbubble-outline" size={12} color="#8E8E93" />
                    <Text style={s.noteText}>{item.message}</Text>
                </View>
            ) : null}

            {item.revisionNotes ? (
                <View style={[s.noteBox, { backgroundColor: 'rgba(255,59,48,0.06)', borderColor: 'rgba(255,59,48,0.15)' }]}>
                    <Ionicons name="alert-circle-outline" size={12} color="#FF3B30" />
                    <Text style={[s.noteText, { color: '#FF3B30' }]}>{item.revisionNotes}</Text>
                </View>
            ) : null}

            <Text style={s.dateText}>{fmtDate(item.createdAt)}</Text>

            {/* Review actions — only the OTHER party can review, only if pending */}
            {canReview && item.status === 'pending_review' && (
                <View style={s.actionRow}>
                    {showInput ? (
                        <View style={{ flex: 1 }}>
                            <TextInput style={s.revInput} value={notes} onChangeText={setNotes}
                                placeholder="Describe what needs to change…" placeholderTextColor="#8E8E93" multiline />
                            <View style={s.revBtns}>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowInput(false); setNotes(''); }}>
                                    <Text style={s.cancelBtnT}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.sendBtn, !notes.trim() && { opacity: 0.4 }]}
                                    disabled={!notes.trim()}
                                    onPress={() => { onRequestRevision(item._id, notes); setShowInput(false); setNotes(''); }}>
                                    <Text style={s.sendBtnT}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={s.changeBtn} onPress={() => setShowInput(true)}>
                                <Ionicons name="refresh-outline" size={14} color="#FF9500" />
                                <Text style={s.changeBtnT}>Request Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.approveBtn} onPress={() => onApprove(item._id)}>
                                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                                <Text style={s.approveBtnT}>Approve</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

// ─── Side Section (one per party) ─────────────────────────────────────────────
const SideSection = ({ label, icon, color, mySubmissions, canUpload, canReview,
    needsResubmit, onUpload, uploading, onRequestRevision, onApprove }) => {
    const [msg, setMsg] = useState('');
    const [open, setOpen] = useState(true);

    return (
        <View style={[s.sideSection, { borderLeftColor: color }]}>
            <TouchableOpacity style={s.sideHeader} onPress={() => setOpen(!open)} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={icon} size={16} color={color} />
                    <Text style={[s.sideTitle, { color }]}>{label}</Text>
                    {mySubmissions.length > 0 && (
                        <View style={[s.countBadge, { backgroundColor: color }]}>
                            <Text style={s.countText}>{mySubmissions.length}</Text>
                        </View>
                    )}
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#8E8E93" />
            </TouchableOpacity>

            {open && (
                <View style={s.sideBody}>
                    {/* Upload area (only if this is YOUR side) */}
                    {canUpload && (
                        <View style={s.uploadArea}>
                            {needsResubmit && (
                                <View style={s.resubBanner}>
                                    <Ionicons name="alert-circle" size={14} color="#FF9500" />
                                    <Text style={s.resubText}>Changes requested — resubmit</Text>
                                </View>
                            )}
                            <TextInput style={s.msgInput} value={msg} onChangeText={setMsg}
                                placeholder="Add a note (optional)…" placeholderTextColor="#8E8E93"
                                multiline maxLength={500} />
                            <TouchableOpacity style={[s.uploadBtn, { backgroundColor: color }]}
                                onPress={() => { onUpload(msg); setMsg(''); }} disabled={uploading}>
                                {uploading ? <ActivityIndicator size="small" color="#fff" /> : (
                                    <>
                                        <Ionicons name="cloud-upload" size={16} color="#fff" />
                                        <Text style={s.uploadBtnT}>{needsResubmit ? 'Resubmit' : 'Upload & Submit'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {mySubmissions.length === 0 ? (
                        <View style={s.empty}>
                            <Ionicons name="document-outline" size={28} color="#C7C7CC" />
                            <Text style={s.emptyText}>No submissions yet</Text>
                        </View>
                    ) : (
                        mySubmissions.map((item) => (
                            <SubmissionCard key={item._id} item={item}
                                canReview={canReview}
                                onRequestRevision={onRequestRevision}
                                onApprove={onApprove} />
                        ))
                    )}
                </View>
            )}
        </View>
    );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────
const SubmissionPanel = ({ requestId, proposalId, chatId, isRequestOwner, onExchangeCompleted }) => {
    const [submissions, setSubmissions] = useState([]);
    const [approvalStatus, setApprovalStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const myRole = isRequestOwner ? 'owner' : 'proposer';
    const theirRole = isRequestOwner ? 'proposer' : 'owner';

    const mySubmissions = submissions.filter(s => s.role === myRole);
    const theirSubmissions = submissions.filter(s => s.role === theirRole);

    const myLatest = mySubmissions[0]; // newest first
    const myNeedsResubmit = myLatest?.status === 'revision_requested';

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchSubmissions = useCallback(async () => {
        try {
            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/marketplace/requests/${requestId}/submissions`, {
                headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.submissions || []);
                setApprovalStatus(data.approvalStatus || {});
            }
        } catch (err) {
            console.error('Fetch submissions error:', err);
        } finally {
            setLoading(false);
        }
    }, [requestId]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleUpload = useCallback(async (message) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            const file = result.assets[0];
            setUploading(true);

            const formData = new FormData();
            formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
            formData.append('proposalId', proposalId);
            formData.append('message', message || '');

            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/marketplace/requests/${requestId}/submissions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                fetchSubmissions();
                try {
                    const msgsRef = collection(db, 'chats', chatId, 'messages');
                    await addDoc(msgsRef, {
                        text: `📎 ${isRequestOwner ? 'Request owner' : 'Proposer'} submitted work: "${file.name}"`,
                        type: 'system', createdAt: serverTimestamp(),
                    });
                } catch (_) { }
                Alert.alert('✅ Submitted!', 'Your work has been submitted for review.');
            } else {
                Alert.alert('Error', data.message || 'Failed to submit.');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not submit the file.');
        } finally {
            setUploading(false);
        }
    }, [requestId, proposalId, chatId, isRequestOwner, fetchSubmissions]);

    // ── Request revision ──────────────────────────────────────────────────────
    const handleRevision = useCallback(async (submissionId, notes) => {
        setActionLoading(true);
        try {
            const token = await tokenStorage.getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/marketplace/submissions/${submissionId}/request-revision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ revisionNotes: notes }),
            });
            if (res.ok) {
                fetchSubmissions();
                try {
                    const msgsRef = collection(db, 'chats', chatId, 'messages');
                    await addDoc(msgsRef, { text: `🔄 Revision requested: "${notes}"`, type: 'system', createdAt: serverTimestamp() });
                } catch (_) { }
            } else {
                const d = await res.json();
                Alert.alert('Error', d.message || 'Failed.');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not request revision.');
        } finally { setActionLoading(false); }
    }, [chatId, fetchSubmissions]);

    // ── Approve ───────────────────────────────────────────────────────────────
    const handleApprove = useCallback((submissionId) => {
        Alert.alert('Approve Work', 'Are you sure you want to approve this submission?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
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
                                const msgsRef = collection(db, 'chats', chatId, 'messages');
                                await addDoc(msgsRef, {
                                    text: data.approvalStatus?.bothApproved
                                        ? '✅ Both sides approved! The exchange is complete.'
                                        : `✅ Submission approved. Waiting for the other side.`,
                                    type: 'system', createdAt: serverTimestamp(),
                                });
                            } catch (_) { }

                            if (data.approvalStatus?.bothApproved) {
                                onExchangeCompleted?.();
                                Alert.alert('🎉 Exchange Complete!', 'Both parties have approved each other\'s work.');
                            } else {
                                Alert.alert('✅ Approved!', 'Waiting for the other party to also submit and approve.');
                            }
                        } else {
                            Alert.alert('Error', data.message || 'Failed.');
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Could not approve.');
                    } finally { setActionLoading(false); }
                },
            },
        ]);
    }, [chatId, fetchSubmissions, onExchangeCompleted]);

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) return <ActivityIndicator style={{ padding: 12 }} size="small" color="#007AFF" />;

    const bothDone = approvalStatus.bothApproved;

    return (
        <View style={s.panel}>
            <TouchableOpacity style={s.panelHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
                <View style={s.panelLeft}>
                    <Ionicons name="swap-horizontal" size={18} color="#007AFF" />
                    <Text style={s.panelTitle}>Work Exchange</Text>
                    {bothDone && (
                        <View style={[s.countBadge, { backgroundColor: '#34C759' }]}>
                            <Text style={s.countText}>✓</Text>
                        </View>
                    )}
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
            </TouchableOpacity>

            {expanded && (
                <ScrollView style={s.panelBody} nestedScrollEnabled>
                    {bothDone && (
                        <View style={s.completeBanner}>
                            <Ionicons name="checkmark-done-circle" size={20} color="#34C759" />
                            <Text style={s.completeBannerText}>Both sides approved! Exchange complete.</Text>
                        </View>
                    )}

                    {/* YOUR WORK — you upload, they review */}
                    <SideSection
                        label="Your Work"
                        icon="arrow-up-circle"
                        color="#007AFF"
                        mySubmissions={mySubmissions}
                        canUpload={!bothDone}
                        canReview={false}
                        needsResubmit={myNeedsResubmit}
                        onUpload={handleUpload}
                        uploading={uploading}
                        onRequestRevision={handleRevision}
                        onApprove={handleApprove}
                    />

                    {/* THEIR WORK — they upload, you review */}
                    <SideSection
                        label="Their Work"
                        icon="arrow-down-circle"
                        color="#FF9500"
                        mySubmissions={theirSubmissions}
                        canUpload={false}
                        canReview={!bothDone}
                        needsResubmit={false}
                        onUpload={() => { }}
                        uploading={false}
                        onRequestRevision={handleRevision}
                        onApprove={handleApprove}
                    />
                </ScrollView>
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
    panelLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    panelTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
    panelBody: { paddingHorizontal: 12, paddingBottom: 14, maxHeight: 400 },

    completeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(52,199,89,0.1)', padding: 10, borderRadius: 10, marginBottom: 10 },
    completeBannerText: { fontSize: 13, fontWeight: '700', color: '#34C759', flex: 1 },

    // Side section
    sideSection: { marginBottom: 12, borderLeftWidth: 3, borderRadius: 10, backgroundColor: '#FAFAFA', overflow: 'hidden' },
    sideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
    sideTitle: { fontSize: 13, fontWeight: '700' },
    sideBody: { paddingHorizontal: 10, paddingBottom: 10 },
    countBadge: { borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    countText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // Upload area
    uploadArea: { marginBottom: 10, padding: 10, backgroundColor: '#F2F2F7', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
    resubBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,149,0,0.1)', padding: 7, borderRadius: 8, marginBottom: 8 },
    resubText: { fontSize: 11, fontWeight: '600', color: '#FF9500' },
    msgInput: { backgroundColor: '#fff', borderRadius: 8, padding: 8, fontSize: 12, color: '#1C1C1E', borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 8, maxHeight: 60 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10 },
    uploadBtnT: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Empty
    empty: { alignItems: 'center', paddingVertical: 16 },
    emptyText: { color: '#8E8E93', fontSize: 12, marginTop: 4 },

    // Card
    card: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E5EA' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '600' },
    revNum: { fontSize: 10, color: '#8E8E93', fontWeight: '600' },

    fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB', borderRadius: 8, padding: 8, gap: 8, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 4 },
    fileName: { fontSize: 12, fontWeight: '600', color: '#1C1C1E' },
    fileMeta: { fontSize: 10, color: '#8E8E93', marginTop: 1 },

    noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: 'rgba(0,122,255,0.05)', borderRadius: 7, padding: 7, marginTop: 4, borderWidth: 1, borderColor: 'rgba(0,122,255,0.1)' },
    noteText: { flex: 1, fontSize: 11, color: '#3C3C43', lineHeight: 15 },
    dateText: { fontSize: 9, color: '#8E8E93', marginTop: 4, textAlign: 'right' },

    // Actions
    actionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    changeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,149,0,0.1)', borderRadius: 8, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,149,0,0.2)' },
    changeBtnT: { fontSize: 11, fontWeight: '700', color: '#FF9500' },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#34C759', borderRadius: 8, paddingVertical: 8 },
    approveBtnT: { fontSize: 11, fontWeight: '700', color: '#fff' },

    revInput: { backgroundColor: '#fff', borderRadius: 8, padding: 8, fontSize: 12, color: '#1C1C1E', borderWidth: 1, borderColor: '#FF9500', marginBottom: 6, maxHeight: 60 },
    revBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F2F2F7' },
    cancelBtnT: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
    sendBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FF9500' },
    sendBtnT: { fontSize: 11, fontWeight: '700', color: '#fff' },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
});

export default SubmissionPanel;
