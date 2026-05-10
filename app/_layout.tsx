import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/tokens';
import { initDb } from '../lib/db';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist: require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'),
    GeistMono: require('../assets/fonts/GeistMono-Regular.ttf'),
    'GeistMono-Medium': require('../assets/fonts/GeistMono-Medium.ttf'),
    InstrumentSerif: require('../assets/fonts/InstrumentSerif-Italic.ttf'),
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
