import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  // Dimensions
} from 'react-native';
import { fonts } from '../theme/fonts';// const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#000000"
        barStyle="light-content"
      />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.englishTitle}>Sūq I-Filāḥa</Text>
        <Text style={styles.tagline}>Your Harvest, Your Market.</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Connecting Farmers & Buyers</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  englishTitle: {
    fontSize: 24,
      fontFamily: fonts.bold,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    color: '#1D1A1A',
      fontFamily: fonts.light,
    fontWeight: '300',
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#1D1A1A',
    fontStyle: 'italic',
  },
});

export default SplashScreen;