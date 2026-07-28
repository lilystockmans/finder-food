import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/tokens';
import { initDb } from '../lib/db';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Bricolage Grotesque, instantiated from the variable font at fixed optical
    // sizes: opsz 14 for running text, opsz 96 for display. React Native cannot
    // drive variable axes from StyleSheet, so statics are required.
    //
    // The Display and weighted faces have TABULAR figures frozen into their cmap.
    // Bricolage's default figures vary in width by up to 2.27x, which makes any
    // changing number jump sideways, and Android does not reliably honour an
    // OpenType `tnum` request from RN.
    Bricolage: require('../assets/fonts/Bricolage-Regular.ttf'),
    'Bricolage-Medium': require('../assets/fonts/Bricolage-Medium.ttf'),
    'Bricolage-SemiBold': require('../assets/fonts/Bricolage-SemiBold.ttf'),
    BricolageDisplay: require('../assets/fonts/Bricolage-Display.ttf'),
    'BricolageDisplay-Bold': require('../assets/fonts/Bricolage-DisplayBold.ttf'),

    GeistMono: require('../assets/fonts/GeistMono-Regular.ttf'),
    'GeistMono-Medium': require('../assets/fonts/GeistMono-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      try { initDb(); } catch (e) { console.warn('DB init:', e); }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="meal-entry" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
