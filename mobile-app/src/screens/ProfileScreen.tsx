import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { apiClient, getErrorMessage } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

const ProfileScreen = ({ navigation }: any) => {
    const { user, setUser, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [reviews, setReviews] = useState([]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const profile = await apiClient.getMyProfile();
            setUser(profile);

            if (profile.id) {
                const userReviews = await apiClient.getUserReviews(profile.id);
                setReviews(userReviews);
            }
        } catch (error) {
            console.error('Error fetching profile:', getErrorMessage(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfileData();
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoggingOut(true);
                            await logout();
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#489163" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Header with Back Button and Title */}
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                
                <Text style={styles.screenTitle}>My Profile</Text>
                
                {/* Empty View to balance the layout */}
                <View style={styles.rightPlaceholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#489163']}
                        tintColor="#489163"
                    />
                }
            >
                <View style={styles.profileHeader}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        {user?.profileInfo && user.profileInfo.startsWith('http') ? (
                            <Image source={{ uri: user.profileInfo }} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.placeholderText}>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Text style={styles.editBadgeText}>Edit</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.userType}>{user?.userType}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingBadgeText}>★ {user?.rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <Text style={styles.sectionContent}>{user?.location || 'Not specified'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.sectionContent}>
                        {user?.profileInfo && !user.profileInfo.startsWith('http')
                            ? user.profileInfo
                            : 'No bio added yet.'}
                    </Text>
                </View>

                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
                    {reviews.length > 0 ? (
                        reviews.map((review: any) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{review.reviewer?.name}</Text>
                                    <Text style={styles.ratingText}>★ {review.rating}</Text>
                                </View>
                                <Text style={styles.reviewComment}>{review.comment}</Text>
                                <Text style={styles.reviewDate}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noReviews}>No reviews yet.</Text>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    // Header Container with Back Button and Title
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    rightPlaceholder: {
        width: 40, // Same as back button width for balance
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
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
        backgroundColor: '#489163',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#489163',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    editBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    userType: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    ratingBadge: {
        marginTop: 10,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    ratingBadgeText: {
        color: '#d97706',
        fontWeight: 'bold',
        fontSize: 14,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 22,
    },
    reviewsSection: {
        marginTop: 12,
        padding: 16,
    },
    reviewCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reviewerName: {
        fontWeight: 'bold',
        color: '#111827',
    },
    ratingText: {
        color: '#d97706',
        fontWeight: 'bold',
    },
    reviewComment: {
        color: '#4b5563',
        fontSize: 14,
        lineHeight: 20,
    },
    reviewDate: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },
    noReviews: {
        textAlign: 'center',
        color: '#9ca3af',
        marginTop: 20,
    },
    buttonContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    editButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#489163',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#489163',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dc2626',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ProfileScreen;