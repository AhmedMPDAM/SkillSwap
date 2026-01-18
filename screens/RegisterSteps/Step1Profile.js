import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Step1Profile = ({
    fullName,
    setFullName,
    bio,
    setBio,
    location,
    setLocation,
    languages,
    setLanguages,
}) => {
    const commonLanguages = [
        'English',
        'French',
        'Spanish',
        'German',
        'Arabic',
        'Chinese',
        'Japanese',
        'Portuguese',
        'Russian',
        'Italian',
    ];

    const toggleLanguage = (language) => {
        if (languages.includes(language)) {
            setLanguages(languages.filter((l) => l !== language));
        } else {
            setLanguages([...languages, language]);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#C7C7CC"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>
            </View>

            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Bio</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <Ionicons name="document-text-outline" size={20} color="#8E8E93" style={styles.inputIconTop} />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us about your expertise and interests..."
                        placeholderTextColor="#C7C7CC"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>
            </View>

            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="City, Country"
                        placeholderTextColor="#C7C7CC"
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>
            </View>

            <View style={styles.inputWrapper}>
                <Text style={styles.label}>Languages Spoken</Text>
                <View style={styles.languagesContainer}>
                    {commonLanguages.map((language) => (
                        <TouchableOpacity
                            key={language}
                            style={[
                                styles.languageChip,
                                languages.includes(language) && styles.languageChipActive,
                            ]}
                            onPress={() => toggleLanguage(language)}
                        >
                            <Text
                                style={[
                                    styles.languageChipText,
                                    languages.includes(language) && styles.languageChipTextActive,
                                ]}
                            >
                                {language}
                            </Text>
                            {languages.includes(language) && (
                                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                            )}
                        </TouchableOpacity>
                    ))}
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
    textAreaContainer: {
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 12,
    },
    inputIconTop: {
        marginRight: 12,
        marginTop: 2,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000000',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    languagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    languageChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    languageChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    languageChipText: {
        fontSize: 15,
        color: '#000000',
        fontWeight: '500',
    },
    languageChipTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default Step1Profile;
