import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { apiClient, getErrorMessage } from '../services/api';

const EditProfileScreen = ({ navigation }: any) => {
    const { user, setUser } = useAuthStore();

    const [name, setName] = useState(user?.name ?? '');
    const [location, setLocation] = useState(user?.location ?? '');
    const [profileInfo, setProfileInfo] = useState(user?.profileInfo ?? '');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const handleUpdate = async () => {
        try {
            setLoading(true);
            const updatedUser = await apiClient.updateMyProfile({
                name,
                location,
                profileInfo,
            });
            setUser(updatedUser);
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileData = async () => {
        try {
            const me = await apiClient.getMyProfile();
            setUser(me);
            setName(me.name ?? '');
            setLocation(me.location ?? '');
            setProfileInfo(me.profileInfo ?? '');
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfileData();
    };

    const handlePickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
        });

        if (result.didCancel) return;

        if (result.errorMessage) {
            Alert.alert('Error', result.errorMessage);
            return;
        }

        if (result.assets?.[0]) {
            handleUploadImage(result.assets[0]);
        }
    };

    const handleUploadImage = async (asset: any) => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('avatar', {
                uri: asset.uri,
                name: asset.fileName || 'avatar.jpg',
                type: asset.type || 'image/jpeg',
            } as any);

            const response = await apiClient.uploadAvatar(formData);
            setUser(response.user);
            Alert.alert('Success', 'Profile picture updated');
        } catch (error) {
            Alert.alert('Upload Error', getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#10b981']}
                        tintColor="#10b981"
                    />
                }
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.backText}>Cancel</Text>
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Edit Profile</Text>

                        <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#10b981" />
                            ) : (
                                <Text style={styles.saveText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.avatarSection}>
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={handlePickImage}
                                disabled={uploading}
                            >
                                {user?.avatar as undefined ? (
                                    <Image source={{ uri: user?.avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.placeholderAvatar}>
                                        <Text style={styles.placeholderText}>
                                            {user?.name?.charAt(0)?.toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                {uploading && (
                                    <View style={styles.uploadOverlay}>
                                        <ActivityIndicator color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handlePickImage}>
                                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="City, Region"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>About / Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={profileInfo}
                                onChangeText={setProfileInfo}
                                placeholder="Tell us about yourself..."
                                multiline
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
       safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backText: {
        color: '#6b7280',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    saveText: {
        color: '#10b981',
        fontSize: 16,
        fontWeight: 'bold',
    },
    form: {
        padding: 16,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    cameraIconText: {
        fontSize: 16,
    },
    changePhotoText: {
        color: '#10b981',
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
});