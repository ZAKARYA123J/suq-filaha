import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { useAuthStore, UserType } from '../store/authStore';

interface UserTypeSelectionScreenProps {
    navigation: any;
}

const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({
    navigation,
}) => {
    const { setUserType } = useAuthStore();

    const handleSelectUserType = (type: UserType) => {
        setUserType(type);
        navigation.navigate('CreatePassword');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Choose Your Role</Text>
                <Text style={styles.subtitle}>
                    Select how you want to use Suq l-Filaha
                </Text>
            </View>

            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleSelectUserType('FARMER')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🌾</Text>
                    </View>
                    <Text style={styles.optionTitle}>I'm a Farmer</Text>
                    <Text style={styles.optionDescription}>
                        Sell your agricultural products directly to buyers
                    </Text>
                    <View style={styles.features}>
                        <Text style={styles.feature}>• List your products</Text>
                        <Text style={styles.feature}>• Set your own prices</Text>
                        <Text style={styles.feature}>• Negotiate with buyers</Text>
                        <Text style={styles.feature}>• Manage orders</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleSelectUserType('BUYER')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🛒</Text>
                    </View>
                    <Text style={styles.optionTitle}>I'm a Buyer</Text>
                    <Text style={styles.optionDescription}>
                        Buy fresh agricultural products directly from farmers
                    </Text>
                    <View style={styles.features}>
                        <Text style={styles.feature}>• Browse products</Text>
                        <Text style={styles.feature}>• Compare prices</Text>
                        <Text style={styles.feature}>• Negotiate deals</Text>
                        <Text style={styles.feature}>• Track orders</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        paddingTop: 48,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    optionsContainer: {
        gap: 20,
    },
    optionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        alignSelf: 'center',
    },
    icon: {
        fontSize: 40,
    },
    optionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    features: {
        gap: 8,
    },
    feature: {
        fontSize: 14,
        color: '#489163',
        fontWeight: '500',
    },
});

export default UserTypeSelectionScreen;
