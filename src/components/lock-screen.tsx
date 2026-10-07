import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  authenticateWithBiometrics,
  biometricStatus,
  clearPin,
  lockoutDelay,
  verifyPin,
  type BiometricStatus,
} from '@/lib/security';
import { useStore } from '@/store';
import { useLock } from '@/store/lock';

import { PinPad } from './pin-pad';
import { confirm, T } from './ui';

/** Écran plein qui masque l'application tant que le code n'est pas saisi. */
export function LockScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const unlock = useLock((s) => s.unlock);
  const biometricEnabled = useStore((s) => s.settings.biometricEnabled);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);

  const [bio, setBio] = useState<BiometricStatus>({ available: false, label: '' });
  const [failed, setFailed] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const tryBiometrics = useCallback(async () => {
    if (await authenticateWithBiometrics()) unlock();
  }, [unlock]);

  // Propose la biométrie dès l'affichage, si elle est activée et disponible.
  useEffect(() => {
    if (!biometricEnabled) return;
    let cancelled = false;
    biometricStatus().then((status) => {
      if (cancelled) return;
      setBio(status);
      if (status.available) tryBiometrics();
    });
    return () => {
      cancelled = true;
    };
  }, [biometricEnabled, tryBiometrics]);

  // Compte à rebours pendant l'attente imposée.
  const blocked = blockedUntil > now;
  useEffect(() => {
    if (blockedUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [blockedUntil]);

  const onComplete = async (pin: string) => {
    if (await verifyPin(pin)) {
      unlock();
      return true;
    }
    const count = failed + 1;
    setFailed(count);
    const delay = lockoutDelay(count);
    if (delay > 0) {
      setBlockedUntil(Date.now() + delay);
      setNow(Date.now());
    }
    return false;
  };

  const forgot = async () => {
    const ok = await confirm(
      'Code oublié ?',
      'Vos données ne sont stockées que sur ce téléphone et sont protégées par ce code. Sans lui, la seule solution est de tout effacer, puis de restaurer une sauvegarde si vous en avez une.',
      'Tout effacer',
    );
    if (!ok) return;
    await clearPin();
    resetAll();
    updateSettings({ lockEnabled: false, biometricEnabled: false });
    unlock();
  };

  const seconds = Math.ceil((blockedUntil - now) / 1000);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.screen,
        { backgroundColor: theme.background, paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg },
      ]}>
      <View style={{ width: '100%', alignItems: 'center', gap: Spacing.xl }}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <Ionicons name="lock-closed" size={28} color={theme.onPrimary} />
        </View>
        <PinPad
        title="Lissafy est verrouillé"
        subtitle="Saisissez votre code"
        disabled={blocked}
        error={blocked ? `Trop d’essais. Réessayez dans ${seconds} s.` : null}
        onComplete={onComplete}
        extra={
          biometricEnabled && bio.available
            ? { icon: bio.label === 'l’empreinte digitale' ? 'finger-print' : 'scan', label: `Utiliser ${bio.label}`, onPress: tryBiometrics }
            : undefined
        }
        />
      </View>
      <Pressable onPress={forgot} hitSlop={10} style={[styles.forgot, { bottom: insets.bottom + Spacing.lg }]}>
        <T variant="caption" tone="secondary">
          Code oublié ?
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { zIndex: 1000, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  forgot: { position: 'absolute' },
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
