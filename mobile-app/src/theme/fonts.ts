// src/theme/fonts.ts
import { Platform } from 'react-native';

export const fonts = {
  regular: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
  }),
  bold: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto-Bold',
  }),
  light: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto-Light',
  }),
    semiBold: Platform.select({
    ios: 'SF Pro Text',        // weight controlled via fontWeight on iOS
    android: 'Roboto-Medium',  // closest to SemiBold on Android
  }),
};
