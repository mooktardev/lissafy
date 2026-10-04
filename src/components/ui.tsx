import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IconName } from '@/lib/types';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Screen({
  children,
  contentStyle,
  ...rest
}: ScrollViewProps & { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      {...rest}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const theme = useTheme();
  const cardStyle = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

export function Row({ children, style, gap = Spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Typographie
// ---------------------------------------------------------------------------

type Variant = 'title' | 'heading' | 'body' | 'bodyBold' | 'caption' | 'amount' | 'amountLarge';
type Tone = 'default' | 'secondary' | 'primary' | 'income' | 'expense' | 'warning' | 'onPrimary';

export function T({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const theme = useTheme();
  const color = {
    default: theme.text,
    secondary: theme.textSecondary,
    primary: theme.primary,
    income: theme.income,
    expense: theme.expense,
    warning: theme.warning,
    onPrimary: theme.onPrimary,
  }[tone];
  return <Text style={[textStyles[variant], { color }, style]} {...rest} />;
}

const textStyles = StyleSheet.create<Record<Variant, TextStyle>>({
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '500' },
  amount: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  amountLarge: { fontSize: 32, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
});

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={styles.sectionHeader}>
      <T variant="heading" style={{ flex: 1 }}>
        {title}
      </T>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <T variant="caption" tone="primary">
            {action}
          </T>
        </Pressable>
      ) : null}
    </Row>
  );
}

// ---------------------------------------------------------------------------
// Boutons
// ---------------------------------------------------------------------------

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const bg = {
    primary: theme.primary,
    secondary: theme.primarySoft,
    danger: theme.expenseSoft,
    ghost: 'transparent',
  }[variant];
  const fg = {
    primary: theme.onPrimary,
    secondary: theme.primary,
    danger: theme.expense,
    ghost: theme.primary,
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        pressed && styles.pressed,
        disabled && { opacity: 0.4 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  size = 22,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={size} color={color ?? theme.primary} />
    </Pressable>
  );
}

export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
      <Ionicons name="add" size={30} color={theme.onPrimary} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  const theme = useTheme();
  const active = color ?? theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? active : theme.border, backgroundColor: selected ? active : theme.card },
      ]}>
      <Text style={[styles.chipText, { color: selected ? theme.onPrimary : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string; color?: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.cardMuted }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: theme.card }]}>
            <Text style={[styles.segmentText, { color: selected ? (o.color ?? theme.text) : theme.textSecondary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Formulaires
// ---------------------------------------------------------------------------

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <View style={styles.field}>
      <T variant="caption" tone="secondary">
        {label}
      </T>
      {children}
      {hint ? (
        <T variant="caption" tone="secondary" style={{ fontWeight: '400' }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function Input({ style, suffix, ...rest }: TextInputProps & { suffix?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.inputText, { color: theme.text }, Platform.OS === 'web' && webNoOutline, style]}
        {...rest}
      />
      {suffix ? (
        <T variant="caption" tone="secondary">
          {suffix}
        </T>
      ) : null}
    </View>
  );
}

export function AmountInput(props: Omit<TextInputProps, 'keyboardType'> & { suffix?: string }) {
  return <Input keyboardType="decimal-pad" inputMode="decimal" placeholder="0" {...props} />;
}

// ---------------------------------------------------------------------------
// Affichage
// ---------------------------------------------------------------------------

export function CategoryIcon({ icon, color, size = 40 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function ProgressBar({ ratio, color, height = 8 }: { ratio: number; color: string; height?: number }) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: theme.cardMuted, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: IconName; title: string; message?: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={30} color={theme.primary} />
      </View>
      <T variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {message ? (
        <T tone="secondary" style={{ textAlign: 'center' }}>
          {message}
        </T>
      ) : null}
      {action}
    </View>
  );
}

export function StatTile({ label, value, tone = 'default', icon }: { label: string; value: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const iconColor = tone === 'income' ? theme.income : tone === 'expense' ? theme.expense : theme.primary;
  return (
    <Card style={{ flex: 1, gap: Spacing.xs, padding: Spacing.md }}>
      <Row gap={Spacing.xs}>
        {icon ? <Ionicons name={icon} size={14} color={iconColor} /> : null}
        <T variant="caption" tone="secondary" numberOfLines={1}>
          {label}
        </T>
      </Row>
      <T variant="amount" tone={tone} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </T>
    </Card>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

// ---------------------------------------------------------------------------
// Dialogues
// ---------------------------------------------------------------------------

/** Confirmation multiplateforme (Alert.alert n'a pas de boutons sur le web). */
export function confirm(title: string, message: string, confirmLabel = 'Supprimer'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// Supprime le contour de focus du navigateur (le conteneur porte déjà la bordure).
const webNoOutline = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  screenContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.7 },
  sectionHeader: { marginTop: Spacing.sm, marginBottom: -Spacing.xs },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  iconButton: { padding: Spacing.xs },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segment: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.sm },
  segmentText: { fontSize: 14, fontWeight: '600' },
  field: { gap: Spacing.xs + 2 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inputText: { flex: 1, fontSize: 16, paddingVertical: 12, minHeight: 46 },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
