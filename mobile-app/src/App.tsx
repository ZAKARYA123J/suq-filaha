import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PhoneInputScreen from './screens/PhoneInputScreen';
import OtpVerificationScreen from './screens/OtpVerificationScreen';
import UserTypeSelectionScreen from './screens/UserTypeSelectionScreen';
import CreatePasswordScreen from './screens/CreatePasswordScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ProductsScreen from './screens/ProductsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen from './screens/CartScreen';
import ChatScreen from './screens/ChatScreen';
import OrdersScreen from './screens/OrdersScreen';
import NegotiationChatScreen from './screens/NegotiationChatScreen';
import { useAuthStore } from './store/authStore';
import { StatusBar } from 'react-native';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
import ChatListScreen from './screens/ChatListScreen';
// Create a Tab Navigator for the main app screens
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#489163',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 20,
          paddingTop: 8,
          height: 75,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          backgroundColor: '#fff',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarHideOnKeyboard: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="ProductsTab" 
        component={ProductsScreen}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={OrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatListScreen}  // Changed to ChatListScreen
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [authError, setAuthError] = useState(false);
  const { isAuthenticated, isLoading, loadAuth, clearAuth, checkAuthValidity } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadAuth();
        
        // Check if the authentication is still valid (e.g., token not expired)
        if (isAuthenticated) {
          const isValid = await checkAuthValidity();
          if (!isValid) {
            setAuthError(true);
            // Optionally clear invalid auth data
            await clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(true);
        await clearAuth();
      }
    };

    initializeAuth();
  }, [loadAuth, checkAuthValidity, clearAuth]);

  // Handle authentication errors in protected screens
  const handleAuthError = () => {
    setAuthError(true);
    clearAuth();
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#489163" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
        <StatusBar
    barStyle="light-content"
    backgroundColor="#000"  
        translucent={false}   
  />
    <NavigationContainer>
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    {!isAuthenticated || authError ? (
      <>
        {showOnboarding && (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        )}
        <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
        />
        <Stack.Screen
          name="UserTypeSelection"
          component={UserTypeSelectionScreen}
        />
        <Stack.Screen
          name="CreatePassword"
          component={CreatePasswordScreen}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* Remove Products screen from here - it should be in MainTabs */}
      </>
    ) : (
      <>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        {/* Remove ProfileScreen - it's in MainTabs already */}
        {/* Remove ChatList - it's in MainTabs as ChatTab */}
        <Stack.Screen name="Chat" component={ChatScreen as any} />
        <Stack.Screen name="NegotiationChat" component={NegotiationChatScreen as any} />
        {/* Add CartScreen if needed */}
        <Stack.Screen name="Cart" component={CartScreen} />
      </>
    )}
  </Stack.Navigator>
</NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default App;