import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Step1Profile from './RegisterSteps/Step1Profile';
import Step2Skills from './RegisterSteps/Step2Skills';
import Step3Account from './RegisterSteps/Step3Account';

const RegisterScreen = ({ navigation }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1 data
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [languages, setLanguages] = useState([]);

    // Step 2 data
    const [selectedSkills, setSelectedSkills] = useState([]);

    // Step 3 data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);

    const handleNext = () => {
        if (currentStep === 1) {
            if (!fullName.trim()) {
                Alert.alert('Error', 'Please enter your fullname');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (selectedSkills.length === 0) {
                Alert.alert('Error', 'Please select at least one skill');
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (!acceptedGuidelines) {
            Alert.alert('Error', 'Please accept the guidelines to continue');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    bio,
                    location,
                    languages,
                    skills: selectedSkills,
                    email,
                    password,
                    acceptedGuidelines,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Registration successful!', [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login'),
                    },
                ]);
            } else {
                Alert.alert('Error', data.message || 'Registration failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => {
        return (
            <View style={styles.progressContainer}>
                {[1, 2, 3].map((step) => (
                    <View key={step} style={styles.progressStepContainer}>
                        <View
                            style={[
                                styles.progressDot,
                                currentStep >= step && styles.progressDotActive,
                            ]}
                        >
                            {currentStep > step ? (
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            ) : (
                                <Text
                                    style={[
                                        styles.progressDotText,
                                        currentStep >= step && styles.progressDotTextActive,
                                    ]}
                                >
                                    {step}
                                </Text>
                            )}
                        </View>
                        {step < 3 && (
                            <View
                                style={[
                                    styles.progressLine,
                                    currentStep > step && styles.progressLineActive,
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return 'Profile';
            case 2:
                return 'Skills';
            case 3:
                return 'Account';
            default:
                return '';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Step {currentStep} of 3 - {getStepTitle()}</Text>
                    </View>

                    {renderProgressBar()}

                    <View style={styles.formContainer}>
                        {currentStep === 1 && (
                            <Step1Profile
                                fullName={fullName}
                                setFullName={setFullName}
                                bio={bio}
                                setBio={setBio}
                                location={location}
                                setLocation={setLocation}
                                languages={languages}
                                setLanguages={setLanguages}
                            />
                        )}

                        {currentStep === 2 && (
                            <Step2Skills
                                selectedSkills={selectedSkills}
                                setSelectedSkills={setSelectedSkills}
                            />
                        )}

                        {currentStep === 3 && (
                            <Step3Account
                                email={email}
                                setEmail={setEmail}
                                password={password}
                                setPassword={setPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                acceptedGuidelines={acceptedGuidelines}
                                setAcceptedGuidelines={setAcceptedGuidelines}
                            />
                        )}

                        <View style={styles.buttonContainer}>
                            {currentStep > 1 && (
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handleBack}
                                >
                                    <Ionicons name="arrow-back" size={20} color="#007AFF" />
                                    <Text style={styles.backButtonText}>Back</Text>
                                </TouchableOpacity>
                            )}

                            {currentStep < 3 ? (
                                <TouchableOpacity
                                    style={[styles.button, styles.nextButton, currentStep === 1 && styles.fullWidthButton]}
                                    onPress={handleNext}
                                >
                                    <Text style={styles.nextButtonText}>Next</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.button, styles.nextButton]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.nextButtonText}>Complete</Text>
                                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.loginText}>
                                Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 60,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '400',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    progressStepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: '#007AFF',
    },
    progressDotText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    progressDotTextActive: {
        color: '#FFFFFF',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 8,
    },
    progressLineActive: {
        backgroundColor: '#007AFF',
    },
    formContainer: {
        width: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    fullWidthButton: {
        flex: 1,
    },
    backButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 17,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    loginLink: {
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        color: '#8E8E93',
        fontSize: 15,
    },
    loginTextBold: {
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default RegisterScreen;
