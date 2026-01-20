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
    FlatList,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { apiClient, getErrorMessage } from '../services/api';
import { SafeAreaFrameContext } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
const ProfileScreen = ({ navigation }: any) => {
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#489163" />
            </View>
        );
    }

    const renderReviewItem = ({ item }: any) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{item.reviewer?.name}</Text>
                <Text style={styles.ratingText}>★ {item.rating}</Text>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
            <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
     
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#489163']} tintColor="#489163" />
                }
            >
                <View style={styles.header}>
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

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </ScrollView>
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
 
    header: {
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
    editButton: {
        margin: 16,
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
});

export default ProfileScreen;
