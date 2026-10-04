import Ionicons from '@expo/vector-icons/Ionicons';
import { useId, type ReactNode } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Fonts, HeroGradient, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IconName } from '@/lib/types';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Conteneur de page défilant. Avec `title`, affiche un grand en-tête
 * (pour les onglets, dont l'en-tête natif est masqué).
 */
export function Screen({
  children,
  contentStyle,
  title,
  subtitle,
  right,
  ...rest
}: ScrollViewProps & {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.screenContent,
        title ? { paddingTop: insets.top + Spacing.md } : null,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...rest}>
      {title ? (
        <Row style={{ marginBottom: Spacing.xs }}>
          <View style={{ flex: 1 }}>
            {subtitle ? (
              <T variant="caption" tone="secondary">
                {subtitle}
              </T>
            ) : null}
            <T variant="title">{title}</T>
          </View>
          {right}
        </Row>
      ) : null}
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const cardStyle = [styles.card, { backgroundColor: theme.card, boxShadow: theme.shadow }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressedScale]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

/** Carte au fond dégradé (violet), pour les chiffres clés. */
export function GradientCard({
  children,
  style,
  colors = HeroGradient,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: readonly string[];
}) {
  const id = useId().replace(/:/g, '');
  return (
    <View style={[styles.gradientCard, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            {colors.map((c, i) => (
              <Stop key={c + i} offset={i / Math.max(1, colors.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#g${id})`} />
        {/* Halos décoratifs */}
        <Circle cx="92%" cy="8%" r="90" fill="#FFFFFF" opacity={0.08} />
        <Circle cx="78%" cy="105%" r="70" fill="#FFFFFF" opacity={0.06} />
      </Svg>
      {children}
    </View>
  );
}

export function Row({
  children,
  style,
  gap = Spacing.sm,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Typographie
// ---------------------------------------------------------------------------

type Variant = 'title' | 'heading' | 'body' | 'bodyBold' | 'caption' | 'label' | 'amount' | 'amountLarge' | 'hero';
type Tone = 'default' | 'secondary' | 'primary' | 'income' | 'expense' | 'warning' | 'onPrimary' | 'inverse';

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
    inverse: '#FFFFFF',
  }[tone];
  return <Text style={[textStyles[variant], { color }, style]} {...rest} />;
}

export const textStyles = StyleSheet.create<Record<Variant, TextStyle>>({
  title: { fontFamily: Fonts.extrabold, fontSize: 28, letterSpacing: -0.6, lineHeight: 34 },
  heading: { fontFamily: Fonts.bold, fontSize: 17, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.medium, fontSize: 15 },
  bodyBold: { fontFamily: Fonts.semibold, fontSize: 15 },
  caption: { fontFamily: Fonts.medium, fontSize: 13 },
  label: { fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' },
  amount: { fontFamily: Fonts.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
  amountLarge: { fontFamily: Fonts.extrabold, fontSize: 30, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  hero: { fontFamily: Fonts.extrabold, fontSize: 38, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
});

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={styles.sectionHeader}>
      <T variant="heading" style={{ flex: 1 }}>
        {title}
      </T>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Row gap={2}>
            <T variant="caption" tone="primary" style={{ fontFamily: Fonts.semibold }}>
              {action}
            </T>
            <TintedIcon name="chevron-forward" size={14} tone="primary" />
          </Row>
        </Pressable>
      ) : null}
    </Row>
  );
}

function TintedIcon({ name, size, tone }: { name: IconName; size: number; tone: 'primary' | 'secondary' }) {
  const theme = useTheme();
  return <Ionicons name={name} size={size} color={tone === 'primary' ? theme.primary : theme.textSecondary} />;
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
        variant === 'primary' && !disabled && { boxShadow: `0px 8px 20px ${theme.primary}40` },
        pressed && styles.pressedScale,
        disabled && { opacity: 0.4 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
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
  filled,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  label: string;
  /** Pastille ronde en fond de carte. */
  filled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        filled ? [styles.iconButtonFilled, { backgroundColor: theme.card, boxShadow: theme.shadow }] : styles.iconButton,
        pressed && { opacity: 0.6 },
      ]}>
      <Ionicons name={icon} size={size} color={color ?? (filled ? theme.text : theme.primary)} />
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
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.primary, boxShadow: `0px 10px 24px ${theme.primary}66` },
        pressed && styles.pressedScale,
      ]}>
      <Ionicons name="add" size={30} color={theme.onPrimary} />
    </Pressable>
  );
}

/** Raccourci rond avec libellé (actions rapides de l'accueil). */
export function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressedScale]}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}1F` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <T variant="caption" numberOfLines={1} style={{ fontFamily: Fonts.semibold }}>
        {label}
      </T>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  icon?: IconName;
}) {
  const theme = useTheme();
  const active = color ?? theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: active }
          : { backgroundColor: theme.card, boxShadow: theme.shadow },
        pressed && { opacity: 0.7 },
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={selected ? '#FFFFFF' : active} /> : null}
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string; color?: string; icon?: IconName }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.cardMuted }]}>
      {options.map((o) => {
        const selected = o.value === value;
        const fg = selected ? (o.color ?? theme.text) : theme.textSecondary;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: theme.card, boxShadow: theme.shadow }]}>
            {o.icon ? <Ionicons name={o.icon} size={16} color={fg} /> : null}
            <Text style={[styles.segmentText, { color: fg }]}>{o.label}</Text>
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
      <T variant="label" tone="secondary">
        {label}
      </T>
      {children}
      {hint ? (
        <T variant="caption" tone="secondary" style={{ fontFamily: Fonts.regular }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function Input({ style, suffix, icon, ...rest }: TextInputProps & { suffix?: string; icon?: IconName }) {
  const theme = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: theme.card, boxShadow: theme.shadow }]}>
      {icon ? <Ionicons name={icon} size={18} color={theme.textSecondary} /> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.inputText, { color: theme.text }, Platform.OS === 'web' && webNoOutline, style]}
        {...rest}
      />
      {suffix ? (
        <T variant="caption" tone="secondary" style={{ fontFamily: Fonts.semibold }}>
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

export function CategoryIcon({ icon, color, size = 42 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: `${color}1F`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function ProgressBar({ ratio, color, height = 8, track }: { ratio: number; color: string; height?: number; track?: string }) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track ?? theme.cardMuted, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

/** Anneau de progression avec contenu centré. */
export function ProgressRing({
  ratio,
  color,
  size = 64,
  thickness = 7,
  track,
  children,
}: {
  ratio: number;
  color: string;
  size?: number;
  thickness?: number;
  track?: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? theme.cardMuted} strokeWidth={thickness} fill="none" />
        {p > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * p} ${c}`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={32} color={theme.primary} />
      </View>
      <T variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {message ? (
        <T tone="secondary" style={{ textAlign: 'center', fontFamily: Fonts.regular, lineHeight: 21 }}>
          {message}
        </T>
      ) : null}
      {action}
    </View>
  );
}

export function StatTile({
  label,
  value,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const theme = useTheme();
  const iconColor =
    tone === 'income' ? theme.income : tone === 'expense' ? theme.expense : tone === 'warning' ? theme.warning : theme.primary;
  return (
    <Card style={{ flex: 1, gap: Spacing.sm, padding: Spacing.lg }}>
      {icon ? (
        <View style={[styles.statIcon, { backgroundColor: `${iconColor}1F` }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      ) : null}
      <View style={{ gap: 2 }}>
        <T variant="caption" tone="secondary" numberOfLines={1}>
          {label}
        </T>
        <T variant="amount" tone={tone} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 17 }}>
          {value}
        </T>
      </View>
    </Card>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: inset }} />;
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

// Supprime le contour de focus du navigateur (le conteneur porte déjà le style).
const webNoOutline = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  screenContent: {
    padding: Spacing.lg,
    paddingBottom: 130,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  gradientCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    overflow: 'hidden',
    boxShadow: '0px 14px 32px rgba(76, 60, 230, 0.35)',
  },
  pressedScale: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sectionHeader: { marginTop: Spacing.sm, marginBottom: -Spacing.xs },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 15,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  buttonText: { fontFamily: Fonts.bold, fontSize: 16 },
  iconButton: { padding: Spacing.xs },
  iconButtonFilled: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  quickIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: Radius.pill,
  },
  chipText: { fontFamily: Fonts.semibold, fontSize: 14 },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentText: { fontFamily: Fonts.bold, fontSize: 14 },
  field: { gap: Spacing.sm },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  inputText: { flex: 1, fontFamily: Fonts.medium, fontSize: 16, paddingVertical: 14, minHeight: 50 },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
