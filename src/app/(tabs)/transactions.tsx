import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MonthSwitcher } from '@/components/pickers';
import { TransactionRow } from '@/components/transaction-row';
import { Button, Card, Divider, EmptyState, Fab, Input, Row, Screen, Segmented, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/use-theme';
import { formatDayHeader } from '@/lib/dates';
import { monthSummary, transactionsOfMonth } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import { useStore } from '@/store';
import { useUi } from '@/store/ui';

type Filter = 'all' | 'expense' | 'income';

export default function Transactions() {
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
    <View style={{ flex: 1 }}>
      <Screen>
        <MonthSwitcher month={month} onChange={setMonth} />
        <Row gap={Spacing.md}>
          <StatTile label="Revenus" value={formatMoney(summary.income, currency)} tone="income" />
          <StatTile label="Dépenses" value={formatMoney(summary.expense, currency)} tone="expense" />
        </Row>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Tout' },
            { value: 'expense', label: 'Dépenses' },
            { value: 'income', label: 'Revenus' },
          ]}
        />
        <Input placeholder="Rechercher (note, catégorie)…" value={query} onChangeText={setQuery} clearButtonMode="while-editing" />

        {groups.length === 0 ? (
          <Card>
            <EmptyState
              icon="receipt-outline"
              title="Aucune transaction"
              message={q ? 'Aucun résultat pour cette recherche.' : 'Rien d’enregistré pour ce mois.'}
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
                <Row>
                  <T variant="caption" tone="secondary" style={{ flex: 1 }}>
                    {formatDayHeader(g.date)}
                  </T>
                  <T variant="caption" tone="secondary">
                    {formatMoney(dayNet, currency, { sign: true })}
                  </T>
                </Row>
                <Card style={{ paddingVertical: Spacing.sm }}>
                  {g.items.map((t, i) => (
                    <View key={t.id}>
                      {i > 0 ? <Divider /> : null}
                      <TransactionRow transaction={t} category={catById.get(t.categoryId)} />
                    </View>
                  ))}
                </Card>
              </View>
            );
          })
        )}
      </Screen>
      <Fab label="Ajouter une transaction" onPress={() => router.push('/transaction')} />
    </View>
  );
}
