import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from '../../config/apiConfig';

const Step2Skills = ({ selectedSkills, setSelectedSkills }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/categories`, {
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const toggleSkill = (skill) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter((s) => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    return (
        <View style={styles.container}>
            {selectedSkills.length > 0 && (
                <View style={styles.selectedContainer}>
                    <Text style={styles.selectedLabel}>
                        Selected ({selectedSkills.length})
                    </Text>
                    <View style={styles.selectedSkillsContainer}>
                        {selectedSkills.map((skill) => (
                            <TouchableOpacity
                                key={skill}
                                style={styles.selectedSkillChip}
                                onPress={() => toggleSkill(skill)}
                            >
                                <Text style={styles.selectedSkillText}>{skill}</Text>
                                <Ionicons name="close-circle" size={18} color="#007AFF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <ScrollView
                style={styles.categoriesContainer}
                showsVerticalScrollIndicator={false}
            >
                {categories.map((cat) => (
                    <View key={cat.name} style={styles.categoryContainer}>
                        <TouchableOpacity
                            style={styles.categoryHeader}
                            onPress={() => toggleCategory(cat.name)}
                        >
                            <View style={styles.categoryHeaderLeft}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name={cat.icon} size={20} color="#007AFF" />
                                </View>
                                <Text style={styles.categoryTitle}>{cat.name}</Text>
                            </View>
                            <Ionicons
                                name={expandedCategory === cat.name ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#8E8E93"
                            />
                        </TouchableOpacity>

                        {expandedCategory === cat.name && (
                            <View style={styles.skillsContainer}>
                                {cat.subcategories.map((skill) => (
                                    <TouchableOpacity
                                        key={skill}
                                        style={[
                                            styles.skillChip,
                                            selectedSkills.includes(skill) && styles.skillChipActive,
                                        ]}
                                        onPress={() => toggleSkill(skill)}
                                    >
                                        <Text
                                            style={[
                                                styles.skillChipText,
                                                selectedSkills.includes(skill) && styles.skillChipTextActive,
                                            ]}
                                        >
                                            {skill}
                                        </Text>
                                        {selectedSkills.includes(skill) && (
                                            <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxHeight: 500,
    },
    selectedContainer: {
        marginBottom: 20,
    },
    selectedLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    selectedSkillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedSkillChip: {
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    selectedSkillText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    categoriesContainer: {
        maxHeight: 350,
    },
    categoryContainer: {
        marginBottom: 12,
    },
    categoryHeader: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    categoryHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    skillsContainer: {
        marginTop: 8,
        marginLeft: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
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
    skillChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    skillChipText: {
        fontSize: 15,
        color: '#000000',
        fontWeight: '500',
    },
    skillChipTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default Step2Skills;
