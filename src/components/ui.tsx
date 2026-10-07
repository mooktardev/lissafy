import Ionicons from '@expo/vector-icons/Ionicons';
import { useId, useState, type ReactNode } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
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
  headerAccessory,
  ...rest
}: ScrollViewProps & {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Contenu supplémentaire affiché dans l'en-tête fixe, sous le titre. */
  headerAccessory?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {title ? (
        // En-tête fixe et opaque : couvre aussi la barre d'état, le contenu défile dessous.
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: theme.background }]}>
          <Row style={styles.headerInner}>
            <View style={{ flex: 1 }}>
              {subtitle ? (
                <T variant="caption" tone="secondary">
                  {subtitle}
                </T>
              ) : null}
              <T variant="title" numberOfLines={1}>
                {title}
              </T>
            </View>
            {right}
          </Row>
          {headerAccessory ? <View style={styles.headerInner}>{headerAccessory}</View> : null}
        </View>
      ) : null}
      {/* Fait défiler le champ actif au-dessus du clavier. */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={Spacing.xl}
        contentContainerStyle={[styles.screenContent, title ? { paddingTop: Spacing.sm } : null, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...rest}>
        {children}
      </KeyboardAwareScrollView>
    </View>
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
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const flat = StyleSheet.flatten(style) ?? {};
  const { gap, padding, boxShadow, ...outer } = flat;
  return (
    // Ombre sur le conteneur externe, découpage (coins arrondis) sur le conteneur interne :
    // les combiner sur la même vue rend mal sur Android.
    <View style={[styles.gradientShadow, { backgroundColor: colors[colors.length - 1] }, boxShadow ? { boxShadow } : null, outer]}>
      <View
        style={[styles.gradientInner, { gap, padding: padding ?? 20 }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== size.width || height !== size.height) setSize({ width, height });
        }}>
        {size.width > 0 ? (
          <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
            <Defs>
              <LinearGradient id={`g${id}`} x1="0" y1="0" x2={size.width} y2={size.height} gradientUnits="userSpaceOnUse">
                {colors.map((c, i) => (
                  <Stop key={c + i} offset={i / Math.max(1, colors.length - 1)} stopColor={c} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={size.width} height={size.height} fill={`url(#g${id})`} />
            {/* Halos décoratifs */}
            <Circle cx={size.width * 0.92} cy={size.height * 0.08} r={80} fill="#FFFFFF" opacity={0.07} />
            <Circle cx={size.width * 0.78} cy={size.height * 1.05} r={60} fill="#FFFFFF" opacity={0.05} />
          </Svg>
        ) : null}
        {children}
      </View>
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
    primary: theme.primaryText,
    income: theme.income,
    expense: theme.expense,
    warning: theme.warning,
    onPrimary: theme.onPrimary,
    inverse: '#FFFFFF',
  }[tone];
  return <Text style={[textStyles[variant], { color }, style]} {...rest} />;
}

export const textStyles = StyleSheet.create<Record<Variant, TextStyle>>({
  title: { fontFamily: Fonts.extrabold, fontSize: 22, letterSpacing: -0.4, lineHeight: 28 },
  heading: { fontFamily: Fonts.bold, fontSize: 15, letterSpacing: -0.1 },
  body: { fontFamily: Fonts.medium, fontSize: 14 },
  bodyBold: { fontFamily: Fonts.semibold, fontSize: 14 },
  caption: { fontFamily: Fonts.medium, fontSize: 12 },
  label: { fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  amount: { fontFamily: Fonts.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  amountLarge: { fontFamily: Fonts.extrabold, fontSize: 22, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  hero: { fontFamily: Fonts.extrabold, fontSize: 28, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
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
  return <Ionicons name={name} size={size} color={tone === 'primary' ? theme.primaryText : theme.textSecondary} />;
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
    secondary: theme.primaryText,
    danger: theme.expense,
    ghost: theme.primaryText,
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        variant === 'primary' && !disabled && { boxShadow: `0px 2px 6px ${theme.primary}33` },
        pressed && styles.pressedScale,
        disabled && { opacity: 0.4 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
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
      <Ionicons name={icon} size={size} color={color ?? (filled ? theme.text : theme.primaryText)} />
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
        { backgroundColor: theme.primary, boxShadow: `0px 3px 8px ${theme.primary}4D` },
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
        <Ionicons name={icon} size={20} color={color} />
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
  // Blanc sur les couleurs sémantiques foncées, texte foncé sur le vert pomme.
  const selectedText = color ? '#FFFFFF' : theme.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: active }
          : { backgroundColor: theme.card, boxShadow: theme.shadow },
        pressed && { opacity: 0.7 },
      ]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? selectedText : color ?? theme.primaryText} /> : null}
      <Text style={[styles.chipText, { color: selected ? selectedText : theme.text }]}>{label}</Text>
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
            {o.icon ? <Ionicons name={o.icon} size={14} color={fg} /> : null}
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
      {icon ? <Ionicons name={icon} size={16} color={theme.textSecondary} /> : null}
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

/** Ligne libellé + interrupteur. */
export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    // Toute la ligne est cliquable ; seul l'interrupteur est exposé aux lecteurs d'écran.
    <Pressable accessible={false} onPress={() => onChange(!value)}>
      <Row gap={Spacing.md}>
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="bodyBold">{label}</T>
          {hint ? (
            <T variant="caption" tone="secondary" style={{ fontFamily: Fonts.regular }}>
              {hint}
            </T>
          ) : null}
        </View>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: theme.cardMuted, true: theme.primary }}
          thumbColor="#FFFFFF"
          {...(Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : {})}
        />
      </Row>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Affichage
// ---------------------------------------------------------------------------

export function CategoryIcon({ icon, color, size = 38 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
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
        <Ionicons name={icon} size={26} color={theme.primaryText} />
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
    tone === 'income' ? theme.income : tone === 'expense' ? theme.expense : tone === 'warning' ? theme.warning : theme.primaryText;
  return (
    <Card style={{ flex: 1, gap: Spacing.sm, padding: Spacing.md }}>
      {icon ? (
        <View style={[styles.statIcon, { backgroundColor: `${iconColor}1F` }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
      ) : null}
      <View style={{ gap: 2 }}>
        <T variant="caption" tone="secondary" numberOfLines={1}>
          {label}
        </T>
        <T variant="amount" tone={tone} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 15 }}>
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
  header: { zIndex: 1 },
  headerInner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  screenContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  gradientShadow: {
    borderRadius: Radius.xl,
    boxShadow: '0px 4px 12px rgba(31, 138, 20, 0.25)',
  },
  gradientInner: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  pressedScale: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sectionHeader: { marginTop: Spacing.sm, marginBottom: -Spacing.xs },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  buttonText: { fontFamily: Fonts.bold, fontSize: 15 },
  iconButton: { padding: Spacing.xs },
  iconButtonFilled: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: Radius.pill,
  },
  chipText: { fontFamily: Fonts.semibold, fontSize: 13 },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentText: { fontFamily: Fonts.bold, fontSize: 13 },
  field: { gap: Spacing.sm },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inputText: { flex: 1, fontFamily: Fonts.medium, fontSize: 15, paddingVertical: 12, minHeight: 46 },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
