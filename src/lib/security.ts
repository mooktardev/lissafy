import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { addDays, parseISODate } from './dates';
import type { ISODate } from './types';

export const PIN_LENGTH = 4;
const PIN_KEY = 'lissafy.pin';

// ---------------------------------------------------------------------------
// Règles pures (testées)
// ---------------------------------------------------------------------------

/** Attente imposée (ms) après `failed` essais ratés : 30 s dès 5, puis 5 min dès 10. */
export function lockoutDelay(failed: number): number {
  if (failed >= 10) return 5 * 60_000;
  if (failed >= 5 && failed % 5 === 0) return 30_000;
  return 0;
}

/** L'application doit-elle se verrouiller au retour au premier plan ? */
export function shouldRelock(backgroundAt: number | null, now: number, delaySeconds: number): boolean {
  if (backgroundAt === null) return false;
  return now - backgroundAt >= delaySeconds * 1000;
}

const daysBetween = (a: ISODate, b: ISODate) =>
  Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);

export const BACKUP_INTERVAL_DAYS = 30;
export const BACKUP_SNOOZE_DAYS = 7;

/**
 * Rappel de sauvegarde : jamais sauvegardé alors que des données existent
 * depuis au moins 3 jours, ou dernière sauvegarde vieille de 30 jours.
 */
export function backupReminder(params: {
  lastBackupAt: ISODate | null;
  snoozedUntil: ISODate | null;
  firstDataDate: ISODate | null;
  today: ISODate;
}): { due: boolean; daysSince: number | null } {
  const { lastBackupAt, snoozedUntil, firstDataDate, today } = params;
  const daysSince = lastBackupAt ? daysBetween(lastBackupAt, today) : null;
  if (!firstDataDate || (snoozedUntil && snoozedUntil > today)) return { due: false, daysSince };
  const due =
    daysSince === null ? daysBetween(firstDataDate, today) >= 3 : daysSince >= BACKUP_INTERVAL_DAYS;
  return { due, daysSince };
}

export const snoozeUntil = (today: ISODate) => addDays(today, BACKUP_SNOOZE_DAYS);

// ---------------------------------------------------------------------------
// Stockage du code (coffre du téléphone)
// ---------------------------------------------------------------------------

// expo-secure-store n'existe pas sur le web : repli sur localStorage (usage de développement).
const secure = {
  get: (key: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.setItem(key, value))
      : SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  remove: (key: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(key)) : SecureStore.deleteItemAsync(key),
};

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

/** Enregistre le code (empreinte salée uniquement, jamais le code en clair). */
export async function savePin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await secure.set(PIN_KEY, JSON.stringify({ salt, hash: await hashPin(pin, salt) }));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = await secure.get(PIN_KEY);
  if (!raw) return false;
  try {
    const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
    return (await hashPin(pin, salt)) === hash;
  } catch {
    return false;
  }
}

export const clearPin = () => secure.remove(PIN_KEY);

// ---------------------------------------------------------------------------
// Biométrie
// ---------------------------------------------------------------------------

export type BiometricStatus = { available: boolean; label: string };

export async function biometricStatus(): Promise<BiometricStatus> {
  if (Platform.OS === 'web') return { available: false, label: '' };
  try {
    const [hardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const label = face ? (Platform.OS === 'ios' ? 'Face ID' : 'la reconnaissance faciale') : 'l’empreinte digitale';
    return { available: hardware && enrolled, label };
  } catch {
    return { available: false, label: '' };
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouiller Lissafy',
      cancelLabel: 'Utiliser le code',
      // Le code de l'app sert de repli, pas celui du téléphone.
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
