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
    Image,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { apiClient, getErrorMessage } from '../services/api';
import { fonts } from '../theme/fonts';
import { ScrollView } from 'react-native';
interface LoginScreenProps {
    navigation: any;
}
import {SafeAreaView} from "react-native-safe-area-context"

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { setAuth } = useAuthStore();

    const handleLogin = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        if (!password || password.length < 6) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.login(phoneNumber, password);
            await setAuth(response.user, response.token, response.chatToken);
            navigation.replace('Home');
        } catch (error) {
            Alert.alert('Login Failed', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
    >
        {/* ===== STATIC HEADER (DOES NOT MOVE) ===== */}
        <View style={styles.headerContainer}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
                Login to continue to Suq l-Filaha
            </Text>
        </View>

        {/* ===== SCROLLABLE FORM (MOVES WITH KEYBOARD) ===== */}
        <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Phone */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.underlineInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>

                <View style={styles.passwordRow}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />

                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                    >
                        <Image
                            // source={
                            //     showPassword
                            //         ? require('../assets/eye-off.png')
                            //         : require('../assets/eye.png')
                            // }
                            style={styles.eyeIcon}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>
                        Forgot Password?
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Login */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity style={styles.registerContainer}  onPress={() => navigation.navigate('PhoneInput')} >
                <Text style={styles.registerText}>
                    Don't have an account?{' '}
                    <Text style={styles.registerBold}>Register</Text>
                </Text>
            </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
</SafeAreaView>


    );
};

export default LoginScreen;

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        // justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
},

headerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
},

formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
},

logo: {
    width: 200,
    height: 200,
    // marginBottom: 10,
},

    header: {
        marginBottom: 40,
            alignItems: 'center',
    },
    title: {
        fontSize: 30,
                fontWeight: 'bold',

        fontFamily: fonts.bold,
        color: '#111827',
        marginBottom: 8,
            textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
                fontWeight: 'regular',
        fontFamily: fonts.regular,

        color: '#6b7280',
            textAlign: 'center',
    },

    inputGroup: {
        marginBottom: 28,
    },
    scrollContent: {
    flexGrow: 1,
    // justifyContent: 'center',
},

    label: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 6,
    },
    underlineInput: {
        fontSize: 20,
        color: '#111827',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    passwordInput: {
        flex: 1,
        fontSize: 20,
        color: '#111827',
        paddingVertical: 8,
    },
    eyeButton: {
        paddingHorizontal: 6,
    },
    eyeIcon: {
        width: 20,
        height: 20,
        tintColor: '#6b7280',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 12,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#111827',
    },

    button: {
        backgroundColor: '#489163',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#86efac',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },

    registerContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    registerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    registerBold: {
        color: '#489163',
        fontWeight: '600',
    },
});
