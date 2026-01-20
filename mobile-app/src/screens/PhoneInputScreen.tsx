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
import {  useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { apiClient, getErrorMessage } from '../services/api';
import { fonts } from '../theme/fonts';

interface PhoneInputScreenProps {
  navigation: any;
}

const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const insets = useSafeAreaInsets(); // <-- This must be called unconditionally
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
      style={[styles.container, { paddingTop: insets.top,
                  paddingBottom: 0,
                   marginBottom:0
       }]}
    >
      <View style={styles.content}>
        {/* ===== HEADER ===== */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Suq l-Filaha</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to get started
          </Text>
        </View>

        {/* ===== FORM ===== */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.underlineInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!isLoading}
            //   placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ===== FOOTER LINK ===== */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PhoneInputScreen;

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  headerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  logo: {
    width: 180,
    height: 180,
  },

  header: {
    marginBottom: 48,
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  form: {
    marginBottom: 24,
  },

  inputGroup: {
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
    fontFamily: fonts.regular,
  },

  underlineInput: {
    fontSize: 20,
    color: '#111827',
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e5e7eb',
    fontFamily: fonts.regular,
  },

  button: {
    backgroundColor: '#489163',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  buttonDisabled: {
    backgroundColor: '#86efac',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },

  linkContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },

  linkText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: fonts.regular,
  },

  linkBold: {
    color: '#489163',
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
});