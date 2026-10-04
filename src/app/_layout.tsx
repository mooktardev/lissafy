import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

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
  const scheme = useResolvedScheme();
  const theme = useTheme();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

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
      </Stack>
    </ThemeProvider>
  );
}
