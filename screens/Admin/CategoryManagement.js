import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/apiConfig';

const CategoryManagement = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [inputText, setInputText] = useState('');
    const [currentCategory, setCurrentCategory] = useState(null); // If null, adding new category. If set, adding subcategory to this category.
    const [expandedCategory, setExpandedCategory] = useState(null); // ID of expanded category

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                Alert.alert('Error', 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('Fetch categories error:', error);
            Alert.alert('Error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!inputText.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        try {
            const token = await tokenStorage.getAccessToken();
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            };

            let url, body, method;

            if (currentCategory) {
                // Add Subcategory
                url = `${API_BASE_URL}/api/categories/${currentCategory._id}/subcategory`;
                method = 'POST';
                body = JSON.stringify({ subcategory: inputText });
            } else {
                // Add Category
                url = `${API_BASE_URL}/api/categories`;
                method = 'POST';
                body = JSON.stringify({ name: inputText, subcategories: [] });
            }

            const response = await fetch(url, { method, headers, body });

            if (response.ok) {
                fetchCategories();
                setModalVisible(false);
                setInputText('');
                setCurrentCategory(null);
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Add error:', error);
            Alert.alert('Error', 'Network error');
        }
    };

    const handleDeleteCategory = async (id) => {
        Alert.alert(
            'Delete Category',
            'Are you sure? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await tokenStorage.getAccessToken();
                            const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'ngrok-skip-browser-warning': 'true',
                                }
                            });
                            if (response.ok) {
                                fetchCategories();
                            } else {
                                Alert.alert('Error', 'Failed to delete category');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Network error');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteSubcategory = async (categoryId, subcategoryName) => {
        Alert.alert(
            'Delete Subcategory',
            `Remove "${subcategoryName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await tokenStorage.getAccessToken();
                            const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategory`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'ngrok-skip-browser-warning': 'true',
                                },
                                body: JSON.stringify({ subcategory: subcategoryName })
                            });
                            if (response.ok) {
                                fetchCategories();
                            } else {
                                Alert.alert('Error', 'Failed to delete subcategory');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Network error');
                        }
                    }
                }
            ]
        );
    };

    const openAddModal = (category = null) => {
        setCurrentCategory(category);
        setInputText('');
        setModalVisible(true);
    };

    const toggleExpand = (id) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };

    const renderCategory = ({ item }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item._id)}
                activeOpacity={0.7}
            >
                <View style={styles.cardTitleContainer}>
                    <Ionicons
                        name={expandedCategory === item._id ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color="#8E8E93"
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.subCount}>{item.subcategories.length} subcategories</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteCategory(item._id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </TouchableOpacity>

            {expandedCategory === item._id && (
                <View style={styles.subList}>
                    {item.subcategories.map((sub, index) => (
                        <View key={index} style={styles.subItem}>
                            <Text style={styles.subText}>{sub}</Text>
                            <TouchableOpacity onPress={() => handleDeleteSubcategory(item._id, sub)}>
                                <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addSubButton} onPress={() => openAddModal(item)}>
                        <Ionicons name="add" size={20} color="#007AFF" />
                        <Text style={styles.addSubText}>Add Subcategory</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Category Management</Text>
                <TouchableOpacity onPress={() => openAddModal(null)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={categories}
                    renderItem={renderCategory}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No categories found</Text>
                            <TouchableOpacity onPress={() => openAddModal(null)} style={styles.emptyButton}>
                                <Text style={styles.emptyButtonText}>Add First Category</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {currentCategory ? `Add Subcategory to ${currentCategory.name}` : 'New Category'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder={currentCategory ? "Subcategory Name" : "Category Name"}
                            value={inputText}
                            onChangeText={setInputText}
                            autoFocus={true}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 8,
    },
    addButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginRight: 8,
    },
    subCount: {
        fontSize: 12,
        color: '#8E8E93',
    },
    deleteButton: {
        padding: 4,
    },
    subList: {
        backgroundColor: '#F9F9F9',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        paddingVertical: 8,
    },
    subItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    subText: {
        fontSize: 15,
        color: '#333',
    },
    addSubButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 4,
    },
    addSubText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    input: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 16,
    },
    emptyButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#007AFF',
        borderRadius: 20,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default CategoryManagement;
