import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { TransactionRow } from '@/components/transaction-row';
import {
  Button,
  Card,
  CategoryIcon,
  Divider,
  EmptyState,
  IconButton,
  Row,
  Screen,
  SectionHeader,
  T,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAccountBalances } from '@/hooks/use-accounts';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { ACCOUNT_TYPES } from '@/lib/accounts';
import { formatDayHeader } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import type { Transaction, Transfer } from '@/lib/types';
import { useStore } from '@/store';

type Movement = { kind: 'tx'; date: string; tx: Transaction } | { kind: 'transfer'; date: string; tr: Transfer };

export default function AccountDetail() {
  const theme = useTheme();
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accounts, balances } = useAccountBalances();
  const account = accounts.find((a) => a.id === id);
  const transactions = useStore((s) => s.transactions);
  const transfers = useStore((s) => s.transfers);
  const categories = useStore((s) => s.categories);

  if (!account) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Compte introuvable" />
      </Screen>
    );
  }

  const catById = new Map(categories.map((c) => [c.id, c]));
  const nameOf = (accountId: string) => accounts.find((a) => a.id === accountId)?.name ?? '?';
  const balance = balances.get(account.id) ?? 0;
  const movements: Movement[] = [
    ...transactions.filter((t) => t.accountId === account.id).map((tx) => ({ kind: 'tx' as const, date: tx.date, tx })),
    ...transfers
      .filter((tr) => tr.fromAccountId === account.id || tr.toAccountId === account.id)
      .map((tr) => ({ kind: 'transfer' as const, date: tr.date, tr })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: account.name,
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Modifier"
              onPress={() => router.push({ pathname: '/account-edit', params: { id: account.id } })}
            />
          ),
        }}
      />
      <Card style={{ gap: Spacing.md }}>
        <Row gap={Spacing.md}>
          <CategoryIcon icon={ACCOUNT_TYPES[account.type].icon} color={account.color} size={44} />
          <View style={{ flex: 1 }}>
            <T variant="caption" tone="secondary">
              Solde actuel · {ACCOUNT_TYPES[account.type].label}
            </T>
            <T variant="amountLarge" tone={balance < 0 ? 'expense' : 'default'} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(balance, currency)}
            </T>
          </View>
        </Row>
        <Row gap={Spacing.md}>
          <Button
            title="Virement"
            icon="swap-horizontal"
            variant="secondary"
            style={{ flex: 1 }}
            disabled={accounts.length < 2}
            onPress={() => router.push({ pathname: '/transfer', params: { from: account.id } })}
          />
          <Button
            title="Ajouter"
            icon="add"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/transaction', params: { accountId: account.id } })}
          />
        </Row>
      </Card>

      <SectionHeader title="Mouvements" />
      {movements.length === 0 ? (
        <Card>
          <EmptyState icon="receipt-outline" title="Aucun mouvement" message="Les transactions et virements de ce compte apparaîtront ici." />
        </Card>
      ) : (
        <Card style={{ paddingVertical: Spacing.xs }}>
          {movements.map((m, i) => (
            <View key={m.kind === 'tx' ? m.tx.id : m.tr.id}>
              {i > 0 ? <Divider inset={50} /> : null}
              {m.kind === 'tx' ? (
                <TransactionRow transaction={m.tx} category={catById.get(m.tx.categoryId)} showDate />
              ) : (
                <Pressable
                  onPress={() => router.push({ pathname: '/transfer', params: { id: m.tr.id } })}
                  style={({ pressed }) => [
                    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 },
                    pressed && { opacity: 0.6 },
                  ]}>
                  <CategoryIcon icon="swap-horizontal" color={theme.textSecondary} size={38} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T variant="bodyBold" numberOfLines={1}>
                      {m.tr.fromAccountId === account.id ? `Vers ${nameOf(m.tr.toAccountId)}` : `Depuis ${nameOf(m.tr.fromAccountId)}`}
                    </T>
                    <Row gap={4}>
                      <Ionicons name="swap-horizontal" size={12} color={theme.textSecondary} />
                      <T variant="caption" tone="secondary" numberOfLines={1}>
                        Virement · {formatDayHeader(m.tr.date)}
                      </T>
                    </Row>
                  </View>
                  <T variant="amount" tone={m.tr.toAccountId === account.id ? 'income' : 'default'}>
                    {formatMoney(m.tr.toAccountId === account.id ? m.tr.amount : -m.tr.amount, currency, { sign: true })}
                  </T>
                </Pressable>
              )}
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
