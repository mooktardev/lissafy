import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PIN_LENGTH } from '@/lib/security';
import type { IconName } from '@/lib/types';

import { T } from './ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'extra', '0', 'back'] as const;

/**
 * Pavé de saisie d'un code à 4 chiffres. `onComplete` reçoit le code ; s'il
 * renvoie `false`, la saisie est effacée et marquée en erreur.
 */
export function PinPad({
  title,
  subtitle,
  error,
  disabled,
  onComplete,
  extra,
}: {
  title: string;
  subtitle?: string;
  error?: string | null;
  disabled?: boolean;
  onComplete: (pin: string) => Promise<boolean | void> | boolean | void;
  /** Touche en bas à gauche (ex. biométrie). */
  extra?: { icon: IconName; label: string; onPress: () => void };
}) {
  const theme = useTheme();
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const press = async (key: (typeof KEYS)[number]) => {
    if (disabled || busy) return;
    if (key === 'extra') return extra?.onPress();
    if (key === 'back') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    const next = (digits + key).slice(0, PIN_LENGTH);
    setDigits(next);
    setFailed(false);
    if (next.length === PIN_LENGTH) {
      setBusy(true);
      const ok = await onComplete(next);
      setBusy(false);
      setDigits('');
      if (ok === false) setFailed(true);
    }
  };

  const message = error ?? (failed ? 'Code incorrect' : null);

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', gap: Spacing.xs }}>
        <T variant="title" style={{ fontSize: 20, textAlign: 'center' }}>
          {title}
        </T>
        {subtitle ? (
          <T tone="secondary" style={{ textAlign: 'center' }}>
            {subtitle}
          </T>
        ) : null}
      </View>

      <View style={styles.dots} accessibilityLabel={`${digits.length} chiffres saisis sur ${PIN_LENGTH}`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: message ? theme.expense : theme.primaryText },
              i < digits.length && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
          />
        ))}
      </View>
      <T variant="caption" tone="expense" style={{ minHeight: 18, textAlign: 'center' }}>
        {message ?? ''}
      </T>

      <View style={styles.grid}>
        {KEYS.map((key) => {
          if (key === 'extra' && !extra) return <View key={key} style={styles.key} />;
          const isDigit = key !== 'extra' && key !== 'back';
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === 'back' ? 'Effacer' : key === 'extra' ? extra?.label : key}
              disabled={disabled}
              onPress={() => press(key)}
              style={({ pressed }) => [
                styles.key,
                isDigit && { backgroundColor: theme.card, boxShadow: theme.shadow },
                pressed && { backgroundColor: theme.primarySoft },
                disabled && { opacity: 0.4 },
              ]}>
              {key === 'back' ? (
                <Ionicons name="backspace-outline" size={26} color={theme.text} />
              ) : key === 'extra' && extra ? (
                <Ionicons name={extra.icon} size={28} color={theme.primaryText} />
              ) : (
                <Text style={[styles.digit, { color: theme.text }]}>{key}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.lg, width: '100%', maxWidth: 340, alignSelf: 'center' },
  dots: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md, width: '100%' },
  key: { width: '30%', aspectRatio: 1.4, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  digit: { fontFamily: Fonts.semibold, fontSize: 26 },
});
