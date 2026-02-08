import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';
import Step2Skills from '../RegisterSteps/Step2Skills';

const CreateExchangeRequest = ({ navigation }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Basic Info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skillSearched, setSkillSearched] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('beginner');

    // Step 2: What you offer (from skills list)
    const [selectedOfferedSkills, setSelectedOfferedSkills] = useState([]);

    // Step 3: Time & Credits
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [desiredDeadline, setDesiredDeadline] = useState('');
    const [complexity, setComplexity] = useState('moyen');
    const [location, setLocation] = useState('');
    const [estimatedCredits, setEstimatedCredits] = useState(0);

    const [fetchedCategories, setFetchedCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setFetchedCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const categories = fetchedCategories.map(c => c.name);

    const levels = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' },
    ];

    const complexities = [
        { value: 'simple', label: 'Simple (1x)', multiplier: 1 },
        { value: 'moyen', label: 'Moyen (1.5x)', multiplier: 1.5 },
        { value: 'complexe', label: 'Complexe (2x)', multiplier: 2 },
        { value: 'tres_complexe', label: 'Très Complexe (2.5x)', multiplier: 2.5 },
    ];

    useEffect(() => {
        calculateCredits();
    }, [estimatedDuration, complexity]);

    const calculateCredits = async () => {
        if (!estimatedDuration || !complexity) {
            setEstimatedCredits(0);
            return;
        }

        try {
            const token = await tokenStorage.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/marketplace/calculate-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
                },
                body: JSON.stringify({
                    estimatedHours: parseFloat(estimatedDuration),
                    complexity: complexity,
                }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', responseText.substring(0, 200));
                return;
            }
            if (response.ok) {
                setEstimatedCredits(data.credits);
            }
        } catch (error) {
            console.error('Error calculating credits:', error);
        }
    };

    const validateStep1 = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return false;
        }
        if (!skillSearched.trim()) {
            Alert.alert('Error', 'Please enter the skill you are searching for');
            return false;
        }
        if (!category) {
            Alert.alert('Error', 'Please select a category');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (selectedOfferedSkills.length === 0) {
            Alert.alert('Error', 'Please select at least one skill you can offer');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!estimatedDuration || parseFloat(estimatedDuration) <= 0) {
            Alert.alert('Error', 'Please enter a valid estimated duration (hours)');
            return false;
        }
        if (!desiredDeadline) {
            Alert.alert('Error', 'Please select a desired deadline');
            return false;
        }
        if (new Date(desiredDeadline) <= new Date()) {
            Alert.alert('Error', 'Deadline must be in the future');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;
        if (currentStep === 3 && !validateStep3()) return;

        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setLoading(true);
        try {
            const token = await tokenStorage.getAccessToken();
            if (!token) {
                Alert.alert('Error', 'Please login to create a request');
                navigation.navigate('Login');
                return;
            }

            const whatYouOffer = selectedOfferedSkills.join(', ');

            const response = await fetch(`${API_BASE_URL}/api/marketplace/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
                },
                body: JSON.stringify({
                    title,
                    description,
                    skillSearched,
                    category,
                    level,
                    whatYouOffer,
                    estimatedDuration: parseFloat(estimatedDuration),
                    desiredDeadline,
                    complexity,
                    location: location || '',
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
                Alert.alert('Success', 'Exchange request created successfully!', [
                    { text: 'OK', onPress: () => navigation.navigate('Marketplace') }
                ]);
            } else {
                Alert.alert('Error', data.message || 'Failed to create request');
            }
        } catch (error) {
            console.error('Error creating request:', error);
            Alert.alert('Error', 'Failed to create request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2, 3].map((step) => (
                <View key={step} style={styles.stepContainer}>
                    <View
                        style={[
                            styles.stepCircle,
                            currentStep >= step && styles.stepCircleActive,
                        ]}
                    >
                        {currentStep > step ? (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        ) : (
                            <Text style={styles.stepNumber}>{step}</Text>
                        )}
                    </View>
                    {step < 3 && (
                        <View
                            style={[
                                styles.stepLine,
                                currentStep > step && styles.stepLineActive,
                            ]}
                        />
                    )}
                </View>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about your request</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Need a logo for my startup"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your project in detail..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                category === cat && styles.categoryChipActive,
                            ]}
                            onPress={() => {
                                setCategory(cat);
                                // Reset skill selection when category changes
                                setSkillSearched('');
                            }}
                        >
                            <Text
                                style={[
                                    styles.categoryChipText,
                                    category === cat && styles.categoryChipTextActive,
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {category && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Skill You're Looking For *</Text>
                    <View style={styles.skillsSelectionContainer}>
                        {fetchedCategories.find(c => c.name === category)?.subcategories?.map((skill) => (
                            <TouchableOpacity
                                key={skill}
                                style={[
                                    styles.skillSelectionChip,
                                    skillSearched === skill && styles.skillSelectionChipActive,
                                ]}
                                onPress={() => setSkillSearched(skill)}
                            >
                                <Text
                                    style={[
                                        styles.skillSelectionChipText,
                                        skillSearched === skill && styles.skillSelectionChipTextActive,
                                    ]}
                                >
                                    {skill}
                                </Text>
                                {skillSearched === skill && (
                                    <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Required Level *</Text>
                <View style={styles.levelContainer}>
                    {levels.map((lev) => (
                        <TouchableOpacity
                            key={lev.value}
                            style={[
                                styles.levelChip,
                                level === lev.value && styles.levelChipActive,
                            ]}
                            onPress={() => setLevel(lev.value)}
                        >
                            <Text
                                style={[
                                    styles.levelChipText,
                                    level === lev.value && styles.levelChipTextActive,
                                ]}
                            >
                                {lev.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const renderStep2 = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>What You Offer</Text>
            <Text style={styles.stepSubtitle}>Select skills you can offer in exchange</Text>

            <Step2Skills
                selectedSkills={selectedOfferedSkills}
                setSelectedSkills={setSelectedOfferedSkills}
            />
        </ScrollView>
    );

    const renderStep3 = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Time & Credits</Text>
            <Text style={styles.stepSubtitle}>Set duration, deadline, and complexity</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Estimated Duration (hours) *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 8"
                    value={estimatedDuration}
                    onChangeText={setEstimatedDuration}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Complexity *</Text>
                <View style={styles.complexityContainer}>
                    {complexities.map((comp) => (
                        <TouchableOpacity
                            key={comp.value}
                            style={[
                                styles.complexityChip,
                                complexity === comp.value && styles.complexityChipActive,
                            ]}
                            onPress={() => setComplexity(comp.value)}
                        >
                            <Text
                                style={[
                                    styles.complexityChipText,
                                    complexity === comp.value && styles.complexityChipTextActive,
                                ]}
                            >
                                {comp.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.helperText}>
                    Estimated Credits: {estimatedCredits.toFixed(1)} credits
                </Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Desired Deadline *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={desiredDeadline}
                    onChangeText={setDesiredDeadline}
                />
                <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2024-12-31)</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Location (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Remote, Paris, New York"
                    value={location}
                    onChangeText={setLocation}
                />
            </View>

            <View style={styles.creditsPreview}>
                <View style={styles.creditsPreviewHeader}>
                    <Ionicons name="calculator-outline" size={20} color="#007AFF" />
                    <Text style={styles.creditsPreviewTitle}>Credit Calculation</Text>
                </View>
                <View style={styles.creditsPreviewContent}>
                    <Text style={styles.creditsPreviewText}>
                        {estimatedDuration || 0} hours × {complexities.find(c => c.value === complexity)?.multiplier || 1}x =
                    </Text>
                    <Text style={styles.creditsPreviewAmount}>
                        {estimatedCredits.toFixed(1)} credits
                    </Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Request</Text>
                    <View style={{ width: 40 }} />
                </View>

                {renderStepIndicator()}

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={handleBack}
                    >
                        <Text style={styles.buttonSecondaryText}>
                            {currentStep === 1 ? 'Cancel' : 'Back'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonPrimaryText}>
                                {currentStep === 3 ? 'Submit' : 'Next'}
                            </Text>
                        )}
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
    keyboardView: {
        flex: 1,
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
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#007AFF',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    stepLine: {
        width: 60,
        height: 2,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: '#007AFF',
    },
    stepContent: {
        flex: 1,
        padding: 16,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#000000',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    categoryScroll: {
        marginTop: 8,
    },
    categoryChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    categoryChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
    },
    categoryChipTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    skillsSelectionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    skillSelectionChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    skillSelectionChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    skillSelectionChipText: {
        fontSize: 15,
        color: '#000000',
        fontWeight: '500',
    },
    skillSelectionChipTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    levelContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    levelChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    levelChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    levelChipText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
    },
    levelChipTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    complexityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    complexityChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    complexityChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    complexityChipText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
    },
    complexityChipTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 8,
    },
    creditsPreview: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    creditsPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    creditsPreviewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    creditsPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    creditsPreviewText: {
        fontSize: 14,
        color: '#000000',
    },
    creditsPreviewAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007AFF',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#007AFF',
    },
    buttonSecondary: {
        backgroundColor: '#F2F2F7',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonPrimaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default CreateExchangeRequest;

