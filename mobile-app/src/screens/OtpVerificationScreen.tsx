import React, { useState, useRef } from 'react';
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

interface OtpVerificationScreenProps {
    navigation: any;
}

const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
    navigation,
}) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const { phoneNumber, setPhoneVerified } = useAuthStore();
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            value = value.charAt(0);
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.verifyOtp(phoneNumber, otpCode);
            setPhoneVerified(true);
            navigation.navigate('UserTypeSelection');
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            await apiClient.sendOtp(phoneNumber);
            Alert.alert('Success', 'OTP has been resent to your phone');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Verify Phone Number</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            editable={!isLoading}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code?</Text>
                    <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={isResending}
                    >
                        <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
                            {isResending ? 'Resending...' : 'Resend OTP'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Change Phone Number</Text>
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
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
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
    phoneNumber: {
        fontWeight: '600',
        color: '#10b981',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
        color: '#1a1a1a',
        backgroundColor: '#f5f5f5',
    },
    otpInputFilled: {
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5',
    },
    button: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        marginBottom: 24,
    },
    buttonDisabled: {
        backgroundColor: '#86efac',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    resendText: {
        fontSize: 14,
        color: '#666',
    },
    resendLink: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
    },
    resendLinkDisabled: {
        color: '#86efac',
    },
    backButton: {
        alignItems: 'center',
        padding: 12,
    },
    backButtonText: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'underline',
    },
});

export default OtpVerificationScreen;
