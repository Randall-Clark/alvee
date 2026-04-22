import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WebFontsLoader } from "@/components/WebFontsLoader";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="auth" options={{ presentation: "modal" }} />
      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="nfc-card" options={{ presentation: "modal" }} />
      <Stack.Screen name="payment" options={{ presentation: "modal" }} />
      <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome.font,
  });
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("alvee_onboarding_done").then(done => {
      if (!done) {
        setTimeout(() => router.replace("/onboarding"), 0);
      }
      setOnboardingChecked(true);
    }).catch(() => setOnboardingChecked(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingChecked) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, onboardingChecked]);

  if ((!fontsLoaded && !fontError) || !onboardingChecked) return null;

  return (
    <SafeAreaProvider>
      <WebFontsLoader />
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AppProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
