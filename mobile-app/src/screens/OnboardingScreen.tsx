import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

export default OnboardingScreen;

// ... styles remain the same

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
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 28,
  },
  button: {
    width: '100%',
    backgroundColor: '#FFF4E8',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
