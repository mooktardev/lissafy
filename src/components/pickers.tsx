import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  addMonths,
  currentMonth,
  daysInMonth,
  formatDate,
  formatMonth,
  monthOf,
  today,
} from '@/lib/dates';
import { ACCOUNT_TYPES } from '@/lib/accounts';
import type { Account, Category, ISODate, IconName, MonthKey } from '@/lib/types';

import { Button, CategoryIcon, IconButton, Row, T } from './ui';

// ---------------------------------------------------------------------------
// Sélecteur de mois
// ---------------------------------------------------------------------------

export function MonthSwitcher({
  month,
  onChange,
  variant = 'card',
}: {
  month: MonthKey;
  onChange: (m: MonthKey) => void;
  /** `onGradient` : version translucide pour la carte dégradée. */
  variant?: 'card' | 'onGradient';
}) {
  const theme = useTheme();
  const isCurrent = month === currentMonth();
  const onGradient = variant === 'onGradient';
  const fg = onGradient ? '#FFFFFF' : theme.text;
  return (
    <Row gap={Spacing.xs}>
      <View
        style={[
          styles.monthPill,
          onGradient ? { backgroundColor: 'rgba(255,255,255,0.16)' } : { backgroundColor: theme.card, boxShadow: theme.shadow },
        ]}>
        <IconButton icon="chevron-back" label="Mois précédent" size={18} color={fg} onPress={() => onChange(addMonths(month, -1))} />
        <T variant="bodyBold" style={{ color: fg, minWidth: 100, textAlign: 'center', fontSize: 13 }}>
          {formatMonth(month)}
        </T>
        <IconButton icon="chevron-forward" label="Mois suivant" size={18} color={fg} onPress={() => onChange(addMonths(month, 1))} />
      </View>
      {!isCurrent ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir au mois en cours"
          hitSlop={8}
          onPress={() => onChange(currentMonth())}
          style={[styles.todayPill, { backgroundColor: onGradient ? 'rgba(255,255,255,0.16)' : theme.primarySoft }]}>
          <Ionicons name="return-down-back" size={16} color={onGradient ? '#FFFFFF' : theme.primaryText} />
        </Pressable>
      ) : null}
    </Row>
  );
}

// ---------------------------------------------------------------------------
// Date + calendrier
// ---------------------------------------------------------------------------

const WEEK_HEADER = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function Calendar({ value, onSelect }: { value: ISODate; onSelect: (d: ISODate) => void }) {
  const theme = useTheme();
  const [month, setMonth] = useState(monthOf(value));
  const firstDay = new Date(`${month}-01T12:00:00`).getDay(); // 0 = dimanche
  const leading = (firstDay + 6) % 7; // semaine commençant le lundi
  const count = daysInMonth(month);
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const t = today();

  return (
    <View style={{ gap: Spacing.sm }}>
      <Row>
        <IconButton icon="chevron-back" label="Mois précédent" onPress={() => setMonth(addMonths(month, -1))} />
        <T variant="bodyBold" style={{ flex: 1, textAlign: 'center' }}>
          {formatMonth(month)}
        </T>
        <IconButton icon="chevron-forward" label="Mois suivant" onPress={() => setMonth(addMonths(month, 1))} />
      </Row>
      <View style={styles.calendarGrid}>
        {WEEK_HEADER.map((d, i) => (
          <View key={`h${i}`} style={styles.calendarCell}>
            <T variant="caption" tone="secondary">
              {d}
            </T>
          </View>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.calendarCell} />;
          const iso = `${month}-${String(day).padStart(2, '0')}`;
          const selected = iso === value;
          const isToday = iso === t;
          return (
            <Pressable key={i} style={styles.calendarCell} onPress={() => onSelect(iso)}>
              <View
                style={[
                  styles.calendarDay,
                  selected && { backgroundColor: theme.primary },
                  !selected && isToday && { borderWidth: 1, borderColor: theme.primary },
                ]}>
                <Text style={{ color: selected ? theme.onPrimary : theme.text, fontFamily: isToday || selected ? Fonts.bold : Fonts.medium }}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DateField({
  value,
  onChange,
  allowClear,
  placeholder = 'Choisir une date',
}: {
  value: ISODate | null;
  onChange: (d: ISODate | null) => void;
  allowClear?: boolean;
  placeholder?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Row style={[styles.dateField, { backgroundColor: theme.card, boxShadow: theme.shadow }]}>
        {value && !allowClear ? (
          <IconButton icon="chevron-back" label="Jour précédent" size={18} onPress={() => onChange(addDays(value, -1))} />
        ) : null}
        <Pressable style={styles.dateLabel} onPress={() => setOpen(true)}>
          <Ionicons name="calendar" size={18} color={theme.primaryText} />
          <T tone={value ? 'default' : 'secondary'}>{value ? formatDate(value) : placeholder}</T>
        </Pressable>
        {value && !allowClear ? (
          <IconButton icon="chevron-forward" label="Jour suivant" size={18} onPress={() => onChange(addDays(value, 1))} />
        ) : null}
        {value && allowClear ? (
          <IconButton icon="close-circle" label="Effacer la date" size={18} color={theme.textSecondary} onPress={() => onChange(null)} />
        ) : null}
      </Row>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Calendar
              value={value ?? today()}
              onSelect={(d) => {
                onChange(d);
                setOpen(false);
              }}
            />
            <Row>
              <Button
                title="Aujourd'hui"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => {
                  onChange(today());
                  setOpen(false);
                }}
              />
              <Button title="Fermer" variant="ghost" style={{ flex: 1 }} onPress={() => setOpen(false)} />
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Comptes
// ---------------------------------------------------------------------------

export function AccountPicker({
  accounts,
  value,
  onChange,
  exclude,
}: {
  accounts: Account[];
  value: string | null;
  onChange: (id: string) => void;
  /** Compte à masquer (ex. le compte source d'un virement). */
  exclude?: string | null;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -Spacing.lg }}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingVertical: 2 }}>
      {accounts
        .filter((a) => a.id !== exclude)
        .map((a) => {
          const selected = a.id === value;
          return (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(a.id)}
              style={({ pressed }) => [
                styles.accountChip,
                {
                  borderColor: selected ? a.color : 'transparent',
                  backgroundColor: selected ? `${a.color}1A` : theme.card,
                  boxShadow: selected ? 'none' : theme.shadow,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <Ionicons name={ACCOUNT_TYPES[a.type].icon} size={16} color={a.color} />
              <T variant="caption" style={{ fontFamily: selected ? Fonts.bold : Fonts.medium }}>
                {a.name}
              </T>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Catégories, icônes, couleurs
// ---------------------------------------------------------------------------

export function CategoryGrid({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const columns = width >= 520 ? 4 : 3;
  const cellWidth = width > 0 ? (width - Spacing.sm * (columns - 1)) / columns : undefined;
  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {categories.map((c) => {
        const selected = c.id === value;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            style={({ pressed }) => [
              styles.categoryCell,
              cellWidth ? { width: cellWidth } : null,
              {
                borderColor: selected ? c.color : 'transparent',
                backgroundColor: selected ? `${c.color}14` : theme.card,
                boxShadow: selected ? 'none' : theme.shadow,
              },
              pressed && { opacity: 0.7 },
            ]}>
            <CategoryIcon icon={c.icon} color={c.color} size={34} />
            <T
              variant="caption"
              numberOfLines={1}
              style={{ textAlign: 'center', fontFamily: selected ? Fonts.bold : Fonts.medium, color: selected ? c.color : theme.text }}>
              {c.name}
            </T>
            {selected ? (
              <View style={[styles.check, { backgroundColor: c.color }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function IconPicker({ icons, value, color, onChange }: { icons: IconName[]; value: IconName; color: string; onChange: (i: IconName) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {icons.map((icon) => {
        const selected = icon === value;
        return (
          <Pressable
            key={icon}
            accessibilityLabel={icon}
            onPress={() => onChange(icon)}
            style={[
              styles.iconCell,
              { borderColor: selected ? color : 'transparent', backgroundColor: selected ? `${color}1F` : theme.card },
            ]}>
            <Ionicons name={icon} size={22} color={selected ? color : theme.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function ColorPicker({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {colors.map((c) => (
        <Pressable
          key={c}
          accessibilityLabel={c}
          onPress={() => onChange(c)}
          style={[styles.colorCell, { backgroundColor: c, borderColor: c === value ? theme.text : 'transparent' }]}>
          {c === value ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  todayPill: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateField: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 46,
  },
  dateLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 12, paddingHorizontal: Spacing.xs },
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  sheet: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, width: '100%', maxWidth: 420, alignSelf: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryCell: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCell: { width: 44, height: 44, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  colorCell: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
