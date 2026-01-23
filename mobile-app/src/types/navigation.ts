import { Product } from './index';

// types/navigation.ts (create this file)
export type RootStackParamList = {
  // Auth stack
  Onboarding: undefined;
  PhoneInput: undefined;
  OtpVerification: { phoneNumber: string };
  UserTypeSelection: undefined;
  CreatePassword: { 
    phoneNumber: string; 
    code: string; 
    userType: 'FARMER' | 'BUYER' 
  };
  Login: undefined;
  
  // Main stack
  Main: undefined;
  EditProfile: undefined;
  Cart: undefined;
  ProductDetail: { productId: string };
  Chat: { chatId: string };
  ChatList: undefined;
  NegotiationChat: { negotiationId: string };
  NegotiationHistory: undefined;
  
  // Farmer Product Management
  FarmerProducts: { filter?: 'available' | 'unavailable' } | undefined;
  AddProduct: undefined;
  EditProduct: { product: Product };
  AddEditProduct: { product?: Product };
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
};

export type ProductsStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: string };
};

export type TabParamList = {
  HomeTab: undefined;
  ProductsTab: undefined;
  OrdersTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
  FarmerHomeTab: undefined;
  FarmerProductsTab: undefined;
};

// Use this for navigation prop in screens
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
export type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export type ChatListScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'ChatList'>;
export type ChatListScreenRouteProp = RouteProp<ChatStackParamList, 'ChatList'>;