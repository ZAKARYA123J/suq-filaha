import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { apiClient, getErrorMessage } from '../services/api';

interface PhoneInputScreenProps {
    navigation: any;
}

const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setPhoneNumber } = useAuthStore();

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.sendOtp(phone);
            setPhoneNumber(phone);
            navigation.navigate('OtpVerification');
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to Suq l-Filaha</Text>
                    <Text style={styles.subtitle}>
                        Enter your phone number to get started
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor="#999"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        maxLength={15}
                        editable={!isLoading}
                    />

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSendOtp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={styles.linkContainer}
                >
                    <Text style={styles.linkText}>
                        Already have an account? <Text style={styles.linkBold}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 48,
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
        lineHeight: 24,
    },
    form: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a1a1a',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    button: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    buttonDisabled: {
        backgroundColor: '#86efac',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    linkContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: {
        fontSize: 14,
        color: '#666',
    },
    linkBold: {
        color: '#10b981',
        fontWeight: '600',
    },
});

export default PhoneInputScreen;
