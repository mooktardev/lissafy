import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { Fonts } from '@/constants/theme';
import { useResolvedScheme, useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store';

SplashScreen.preventAutoHideAsync();

function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

export default function RootLayout() {
  const hydrated = useHydrated();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // En cas d'échec de chargement, on continue avec la police système.
  const ready = hydrated && (fontsLoaded || fontError !== null);
  const scheme = useResolvedScheme();
  const theme = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 17, color: theme.text },
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="transaction" options={{ presentation: 'modal', title: 'Transaction' }} />
        <Stack.Screen name="goal-edit" options={{ presentation: 'modal', title: 'Objectif' }} />
        <Stack.Screen name="goal/[id]" options={{ title: 'Objectif' }} />
        <Stack.Screen name="debts" options={{ title: 'Dettes & prêts' }} />
        <Stack.Screen name="debt-edit" options={{ presentation: 'modal', title: 'Dette' }} />
        <Stack.Screen name="debt/[id]" options={{ title: 'Dette' }} />
        <Stack.Screen name="simulator" options={{ title: "Simulateur d'épargne" }} />
        <Stack.Screen name="categories" options={{ title: 'Catégories' }} />
        <Stack.Screen name="category" options={{ presentation: 'modal', title: 'Catégorie' }} />
        <Stack.Screen name="settings" options={{ title: 'Réglages' }} />
        <Stack.Screen name="tools" options={{ title: 'Outils' }} />
      </Stack>
    </ThemeProvider>
  );
}
