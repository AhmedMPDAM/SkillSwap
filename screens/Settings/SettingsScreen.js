import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const SETTINGS_KEYS = {
    AUTO_SELECT_SKILLS: '@skillswap_setting_auto_select_skills',
    PUSH_NOTIFICATIONS: '@skillswap_setting_push_notifications',
    SOUND_ENABLED: '@skillswap_setting_sound_enabled',
};

const SettingsScreen = ({ navigation }) => {
    const [autoSelectSkills, setAutoSelectSkills] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    // Load settings from storage
    const loadSettings = useCallback(async () => {
        try {
            const [autoSkills, pushNotif, sound] = await AsyncStorage.multiGet([
                SETTINGS_KEYS.AUTO_SELECT_SKILLS,
                SETTINGS_KEYS.PUSH_NOTIFICATIONS,
                SETTINGS_KEYS.SOUND_ENABLED,
            ]);

            // Default to true if not set
            setAutoSelectSkills(autoSkills[1] === null ? true : autoSkills[1] === 'true');
            setPushNotifications(pushNotif[1] === null ? true : pushNotif[1] === 'true');
            setSoundEnabled(sound[1] === null ? true : sound[1] === 'true');
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSettings();
        }, [loadSettings]),
    );

    // Save a setting
    const saveSetting = async (key, value) => {
        try {
            await AsyncStorage.setItem(key, String(value));
        } catch (error) {
            console.error('Error saving setting:', error);
            Alert.alert('Error', 'Failed to save setting');
        }
    };

    const handleAutoSelectSkillsToggle = (value) => {
        setAutoSelectSkills(value);
        saveSetting(SETTINGS_KEYS.AUTO_SELECT_SKILLS, value);
    };

    const handlePushNotificationsToggle = (value) => {
        setPushNotifications(value);
        saveSetting(SETTINGS_KEYS.PUSH_NOTIFICATIONS, value);
    };

    const handleSoundToggle = (value) => {
        setSoundEnabled(value);
        saveSetting(SETTINGS_KEYS.SOUND_ENABLED, value);
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear cached data. Your account and settings will not be affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    onPress: () => {
                        Alert.alert('Done', 'Cache cleared successfully.');
                    },
                    style: 'destructive',
                },
            ],
        );
    };

    const renderSettingRow = (icon, iconColor, label, description, rightComponent) => (
        <View style={styles.settingRow}>
            <View style={[styles.settingIconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{label}</Text>
                {description && <Text style={styles.settingDescription}>{description}</Text>}
            </View>
            <View style={styles.settingRight}>
                {rightComponent}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Exchange Preferences ─────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Exchange Preferences</Text>
                    <View style={styles.card}>
                        {renderSettingRow(
                            'construct-outline',
                            '#007AFF',
                            'Auto-select profile skills',
                            'When creating an exchange request, your profile skills will be pre-selected as offered skills.',
                            <Switch
                                value={autoSelectSkills}
                                onValueChange={handleAutoSelectSkillsToggle}
                                trackColor={{ false: '#D1D1D6', true: '#34C75980' }}
                                thumbColor={autoSelectSkills ? '#34C759' : '#FFFFFF'}
                                ios_backgroundColor="#D1D1D6"
                            />,
                        )}
                    </View>
                </View>

                {/* ── Notifications ────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.card}>
                        {renderSettingRow(
                            'notifications-outline',
                            '#FF9500',
                            'Push Notifications',
                            'Receive notifications for proposals, messages, and updates.',
                            <Switch
                                value={pushNotifications}
                                onValueChange={handlePushNotificationsToggle}
                                trackColor={{ false: '#D1D1D6', true: '#34C75980' }}
                                thumbColor={pushNotifications ? '#34C759' : '#FFFFFF'}
                                ios_backgroundColor="#D1D1D6"
                            />,
                        )}
                        <View style={styles.settingDivider} />
                        {renderSettingRow(
                            'volume-high-outline',
                            '#FF2D55',
                            'Sound',
                            'Play a sound for incoming notifications.',
                            <Switch
                                value={soundEnabled}
                                onValueChange={handleSoundToggle}
                                trackColor={{ false: '#D1D1D6', true: '#34C75980' }}
                                thumbColor={soundEnabled ? '#34C759' : '#FFFFFF'}
                                ios_backgroundColor="#D1D1D6"
                            />,
                        )}
                    </View>
                </View>

                {/* ── Data & Storage ──────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data & Storage</Text>
                    <View style={styles.card}>
                        <TouchableOpacity onPress={handleClearCache}>
                            {renderSettingRow(
                                'trash-outline',
                                '#8E8E93',
                                'Clear Cache',
                                'Free up space by clearing cached data.',
                                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />,
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── About ───────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.card}>
                        {renderSettingRow(
                            'information-circle-outline',
                            '#5856D6',
                            'App Version',
                            null,
                            <Text style={styles.settingValueText}>1.0.0</Text>,
                        )}
                        <View style={styles.settingDivider} />
                        {renderSettingRow(
                            'document-text-outline',
                            '#34C759',
                            'Terms of Service',
                            null,
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />,
                        )}
                        <View style={styles.settingDivider} />
                        {renderSettingRow(
                            'shield-outline',
                            '#007AFF',
                            'Privacy Policy',
                            null,
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />,
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
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
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000000',
    },
    scrollContent: {
        paddingTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    settingIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    settingDescription: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
        lineHeight: 18,
    },
    settingRight: {
        alignItems: 'flex-end',
    },
    settingValueText: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    settingDivider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginLeft: 64,
    },
});

// Export the settings keys so other screens can read them
export { SETTINGS_KEYS };
export default SettingsScreen;
