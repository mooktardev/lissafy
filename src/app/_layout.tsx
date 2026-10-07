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
import { AppState } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { Fonts } from '@/constants/theme';
import { useResolvedScheme, useTheme } from '@/hooks/use-theme';
import { today } from '@/lib/dates';
import { LockScreen } from '@/components/lock-screen';
import { shouldRelock } from '@/lib/security';
import { useStore } from '@/store';
import { useLock } from '@/store/lock';

SplashScreen.preventAutoHideAsync();

function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

/** Génère les transactions récurrentes arrivées à échéance (au démarrage et au retour au premier plan). */
function useRecurringGeneration(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const apply = () => useStore.getState().applyRecurring(today());
    apply();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') apply();
    });
    return () => sub.remove();
  }, [enabled]);
}

/** Reverrouille au retour au premier plan, selon le délai choisi. */
function useAutoLock() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const lock = useLock.getState();
      // Seul l'arrière-plan compte : l'invite Face ID rend l'app brièvement « inactive ».
      if (state === 'background') {
        lock.setBackgroundAt(Date.now());
      } else if (state === 'active') {
        const { lockEnabled, lockDelay } = useStore.getState().settings;
        if (lockEnabled && shouldRelock(lock.backgroundAt, Date.now(), lockDelay)) lock.lock();
        lock.setBackgroundAt(null);
      }
    });
    return () => sub.remove();
  }, []);
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
  useRecurringGeneration(hydrated);
  useAutoLock();
  const lockEnabled = useStore((s) => s.settings.lockEnabled);
  const onboarded = useStore((s) => s.settings.onboarded);
  const unlocked = useLock((s) => s.unlocked);
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
    <KeyboardProvider>
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primaryText,
          headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 16, color: theme.text },
          contentStyle: { backgroundColor: theme.background },
        }}>
        {/* Tant que l'introduction n'est pas faite, seul l'écran d'accueil guidé est accessible. */}
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
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
        <Stack.Screen name="recurring" options={{ title: 'Récurrences' }} />
        <Stack.Screen name="accounts" options={{ title: 'Comptes' }} />
        <Stack.Screen name="account/[id]" options={{ title: 'Compte' }} />
        <Stack.Screen name="account-edit" options={{ presentation: 'modal', title: 'Compte' }} />
        <Stack.Screen name="transfer" options={{ presentation: 'modal', title: 'Virement' }} />
        <Stack.Screen name="recurring-edit" options={{ presentation: 'modal', title: 'Récurrence' }} />
        </Stack.Protected>
        <Stack.Screen name="pin-setup" options={{ presentation: 'modal', title: 'Code de verrouillage' }} />
      </Stack>
      {lockEnabled && !unlocked ? <LockScreen /> : null}
    </ThemeProvider>
    </KeyboardProvider>
  );
}
