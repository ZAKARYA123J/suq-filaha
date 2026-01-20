import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fonts } from '../theme/fonts';
import LinearGradient from 'react-native-linear-gradient';

interface OnboardingScreenProps {
  navigation: any;
  onComplete?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, onComplete }) => {
  const handleNext = () => {
    if (onComplete) {
      onComplete();
    }
    navigation.navigate('PhoneInput');
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <ImageBackground
        source={require('../assets/obrdingimage.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>Direct from the{'\n'}Farm</Text>
          <Text style={styles.subtitle}>
            Buy and sell directly without{'\n'}intermediaries
          </Text>
          
          <TouchableOpacity onPress={handleNext}>
            <LinearGradient
              colors={['#000000', '#0F9B0F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
    fontFamily: fonts.semiBold,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  button: {
    width: 327, // You can adjust this or use '90%' if preferred
    backgroundColor: '#FFF4E8',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF', // Changed to white for better contrast on dark gradient
    fontFamily: fonts.semiBold,
  },
});