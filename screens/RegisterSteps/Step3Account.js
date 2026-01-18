import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Step3Account = ({
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    acceptedGuidelines,
    setAcceptedGuidelines,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#C7C7CC"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Create a strong password"
                        placeholderTextColor="#C7C7CC"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#8E8E93"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#C7C7CC"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#8E8E93"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedGuidelines(!acceptedGuidelines)}
            >
                <View style={[styles.checkbox, acceptedGuidelines && styles.checkboxActive]}>
                    {acceptedGuidelines && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                </View>
                <Text style={styles.checkboxLabel}>
                    I have read and accept the{' '}
                    <Text style={styles.checkboxLink}>Community Guidelines</Text>
                </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
                <View style={styles.infoIconContainer}>
                    <Ionicons name="information-circle" size={24} color="#007AFF" />
                </View>
                <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Password Requirements</Text>
                    <Text style={styles.infoText}>
                        • At least 8 characters long{'\n'}
                        • Mix of letters and numbers recommended
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000000',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        marginTop: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 15,
        color: '#000000',
        lineHeight: 22,
    },
    checkboxLink: {
        fontWeight: '600',
        color: '#007AFF',
    },
    infoBox: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#B3D9FF',
    },
    infoIconContainer: {
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#3C3C43',
        lineHeight: 20,
    },
});

export default Step3Account;
