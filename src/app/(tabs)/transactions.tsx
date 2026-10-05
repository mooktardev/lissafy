import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MonthSwitcher } from '@/components/pickers';
import { TransactionRow } from '@/components/transaction-row';
import { Button, Card, Chip, Divider, EmptyState, Input, Row, Screen, StatTile, T } from '@/components/ui';
import { Fonts, Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { formatDayHeader } from '@/lib/dates';
import { monthSummary, transactionsOfMonth } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import { useStore } from '@/store';
import { useUi } from '@/store/ui';

type Filter = 'all' | 'expense' | 'income';

export default function Transactions() {
  const theme = useTheme();
  const currency = useCurrency();
  const { month, setMonth } = useUi();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const catById = new Map(categories.map((c) => [c.id, c]));
  const summary = monthSummary(transactions, month);
  const q = query.trim().toLowerCase();

  const list = transactionsOfMonth(transactions, month)
    .filter((t) => filter === 'all' || t.kind === filter)
    .filter((t) => {
      if (!q) return true;
      const name = catById.get(t.categoryId)?.name ?? '';
      return t.note.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const groups: { date: string; items: Transaction[] }[] = [];
  for (const t of list) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }

  return (
    <Screen title="Activité" right={<MonthSwitcher month={month} onChange={setMonth} />}>
      <Row gap={Spacing.md}>
        <StatTile label="Revenus" value={formatMoney(summary.income, currency)} tone="income" icon="arrow-down" />
        <StatTile label="Dépenses" value={formatMoney(summary.expense, currency)} tone="expense" icon="arrow-up" />
      </Row>

      <Input icon="search" placeholder="Rechercher une note, une catégorie…" value={query} onChangeText={setQuery} clearButtonMode="while-editing" />

      <Row>
        <Chip label="Tout" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip
          label="Dépenses"
          icon="arrow-up"
          color={theme.expense}
          selected={filter === 'expense'}
          onPress={() => setFilter('expense')}
        />
        <Chip
          label="Revenus"
          icon="arrow-down"
          color={theme.income}
          selected={filter === 'income'}
          onPress={() => setFilter('income')}
        />
      </Row>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon="receipt-outline"
            title={q ? 'Aucun résultat' : 'Aucune transaction'}
            message={q ? 'Essayez un autre mot-clé.' : 'Rien d’enregistré pour ce mois. Touchez ＋ pour commencer.'}
            action={
              q ? null : (
                <Button title="Ajouter" icon="add" onPress={() => router.push('/transaction')} style={{ marginTop: Spacing.sm }} />
              )
            }
          />
        </Card>
      ) : (
        groups.map((g) => {
          const dayNet = g.items.reduce((a, t) => a + (t.kind === 'income' ? t.amount : -t.amount), 0);
          return (
            <View key={g.date} style={{ gap: Spacing.sm }}>
              <Row style={{ paddingHorizontal: Spacing.xs }}>
                <T variant="label" tone="secondary" style={{ flex: 1 }}>
                  {formatDayHeader(g.date)}
                </T>
                <T variant="caption" tone={dayNet >= 0 ? 'income' : 'secondary'} style={{ fontFamily: Fonts.semibold }}>
                  {formatMoney(dayNet, currency, { sign: true })}
                </T>
              </Row>
              <Card style={{ paddingVertical: Spacing.xs }}>
                {g.items.map((t, i) => (
                  <View key={t.id}>
                    {i > 0 ? <Divider inset={50} /> : null}
                    <TransactionRow transaction={t} category={catById.get(t.categoryId)} />
                  </View>
                ))}
              </Card>
            </View>
          );
        })
      )}
    </Screen>
  );
}
