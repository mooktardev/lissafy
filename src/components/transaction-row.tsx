import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { formatDayHeader } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import type { Category, Transaction } from '@/lib/types';

import { CategoryIcon, T } from './ui';

export function TransactionRow({
  transaction,
  category,
  showDate,
}: {
  transaction: Transaction;
  category?: Category;
  /** Affiche la date plutôt que la catégorie en sous-titre. */
  showDate?: boolean;
}) {
  const theme = useTheme();
  const currency = useCurrency();
  const isIncome = transaction.kind === 'income';
  const title = transaction.note || category?.name || 'Sans catégorie';
  const subtitle = [transaction.note ? category?.name : null, showDate ? formatDayHeader(transaction.date) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction', params: { id: transaction.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <CategoryIcon icon={category?.icon ?? 'help'} color={category?.color ?? '#64748B'} size={38} />
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyBold" numberOfLines={1}>
          {title}
        </T>
        {subtitle || transaction.recurringId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {transaction.recurringId ? <Ionicons name="repeat" size={12} color={theme.textSecondary} /> : null}
            <T variant="caption" tone="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
              {subtitle || 'Récurrente'}
            </T>
          </View>
        ) : null}
      </View>
      <T variant="amount" tone={isIncome ? 'income' : 'default'}>
        {formatMoney(isIncome ? transaction.amount : -transaction.amount, currency, { sign: true })}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 },
});
