import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showSplash) {
    return (
      <SplashScreen onAnimationComplete={handleSplashComplete} />
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen onFinish={handleOnboardingComplete} />
    );
  }

  return (
    <View style={styles.container}>
      <Text>Main App Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
