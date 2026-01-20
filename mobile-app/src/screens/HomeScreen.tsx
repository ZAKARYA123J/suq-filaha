import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

interface HomeScreenProps {
    navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigation.replace('PhoneInput');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome to Suq l-Filaha!</Text>
                <Text style={styles.subtitle}>
                    {user?.userType === 'FARMER' ? '🌾 Farmer' : '🛒 Buyer'} Dashboard
                </Text>
            </View>

            <View style={styles.profileCard}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{user?.name}</Text>

                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.value}>{user?.phoneNumber}</Text>

                <Text style={styles.label}>User Type</Text>
                <Text style={styles.value}>{user?.userType}</Text>

                {user?.location && (
                    <>
                        <Text style={styles.label}>Location</Text>
                        <Text style={styles.value}>{user.location}</Text>
                    </>
                )}

                <Text style={styles.label}>Rating</Text>
                <Text style={styles.value}>⭐ {user?.rating.toFixed(1)}</Text>
            </View>

            <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile')}
            >
                <Text style={styles.profileButtonText}>View My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
                This is a placeholder home screen.{'\n'}
                Your main app features will go here.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
    },
    header: {
        marginTop: 48,
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#489163',
        fontWeight: '600',
    },
    profileCard: {
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        padding: 24,
        gap: 12,
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 8,
    },
    value: {
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '500',
    },
    profileButton: {
        backgroundColor: '#489163',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    profileButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    logoutButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 14,
        color: '#999',
        lineHeight: 20,
    },
});

export default HomeScreen;
