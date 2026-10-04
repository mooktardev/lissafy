import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/format';
import type { Category, Transaction } from '@/lib/types';

import { CategoryIcon, T } from './ui';

export function TransactionRow({ transaction, category }: { transaction: Transaction; category?: Category }) {
  const currency = useCurrency();
  const isIncome = transaction.kind === 'income';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction', params: { id: transaction.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <CategoryIcon icon={category?.icon ?? 'help'} color={category?.color ?? '#64748B'} />
      <View style={{ flex: 1 }}>
        <T variant="bodyBold" numberOfLines={1}>
          {transaction.note || category?.name || 'Sans catégorie'}
        </T>
        {transaction.note ? (
          <T variant="caption" tone="secondary" numberOfLines={1}>
            {category?.name ?? 'Sans catégorie'}
          </T>
        ) : null}
      </View>
      <T variant="amount" tone={isIncome ? 'income' : 'default'}>
        {formatMoney(isIncome ? transaction.amount : -transaction.amount, currency, { sign: true })}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
});
