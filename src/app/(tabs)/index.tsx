import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BarChart, DonutChart } from '@/components/charts';
import { MonthSwitcher } from '@/components/pickers';
import { TransactionRow } from '@/components/transaction-row';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  Fab,
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
  StatTile,
  T,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { formatMonthShort, today } from '@/lib/dates';
import {
  averageMonthlyNet,
  budgetStatuses,
  goalMonthlyNeeded,
  goalProgress,
  goalSaved,
  monthSummary,
  monthlyHistory,
  spendingByCategory,
  transactionsOfMonth,
} from '@/lib/finance';
import { formatMoney, formatPercent } from '@/lib/format';
import { useStore } from '@/store';
import { useUi } from '@/store/ui';

export default function Dashboard() {
  const theme = useTheme();
  const currency = useCurrency();
  const { month, setMonth } = useUi();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const goals = useStore((s) => s.goals);

  const money = (n: number, opts?: { sign?: boolean; compact?: boolean }) => formatMoney(n, currency, opts);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const summary = monthSummary(transactions, month);
  const spending = spendingByCategory(transactions, month);
  const history = monthlyHistory(transactions, month, 6);
  const avgNet = averageMonthlyNet(transactions, month);
  const statuses = budgetStatuses(budgets, transactions, month).sort((a, b) => b.ratio - a.ratio);
  const recent = transactionsOfMonth(transactions, month)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const activeGoals = goals.filter((g) => goalProgress(g) < 1).slice(0, 3);

  const topSpending = spending.slice(0, 5);
  const otherSpending = spending.slice(5).reduce((a, s) => a + s.total, 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <MonthSwitcher month={month} onChange={setMonth} />

        <Card style={{ gap: Spacing.md }}>
          <T variant="caption" tone="secondary">
            Solde du mois
          </T>
          <T variant="amountLarge" tone={summary.net < 0 ? 'expense' : 'default'}>
            {money(summary.net, { sign: true })}
          </T>
          <Row gap={Spacing.md}>
            <StatTile label="Revenus" value={money(summary.income)} tone="income" icon="arrow-down-circle" />
            <StatTile label="Dépenses" value={money(summary.expense)} tone="expense" icon="arrow-up-circle" />
          </Row>
          {summary.savingsRate !== null ? (
            <View style={{ gap: Spacing.xs }}>
              <Row>
                <T variant="caption" tone="secondary" style={{ flex: 1 }}>
                  Taux d&apos;épargne
                </T>
                <T variant="caption" tone={summary.savingsRate >= 0 ? 'income' : 'expense'}>
                  {formatPercent(summary.savingsRate)}
                </T>
              </Row>
              <ProgressBar
                ratio={summary.savingsRate}
                color={summary.savingsRate >= 0.2 ? theme.income : summary.savingsRate >= 0 ? theme.warning : theme.expense}
              />
            </View>
          ) : null}
          {avgNet !== null ? (
            <T variant="caption" tone="secondary">
              Moyenne des 3 mois précédents : {money(avgNet, { sign: true })} / mois, soit{' '}
              {money(avgNet * 12, { sign: true })} sur un an.
            </T>
          ) : null}
        </Card>

        {transactions.length === 0 ? (
          <Card>
            <EmptyState
              icon="wallet-outline"
              title="Bienvenue dans Planifin"
              message="Commencez par enregistrer vos revenus et dépenses, puis définissez vos budgets et objectifs d'épargne."
              action={
                <Button
                  title="Ajouter une transaction"
                  icon="add"
                  onPress={() => router.push('/transaction')}
                  style={{ marginTop: Spacing.sm }}
                />
              }
            />
          </Card>
        ) : null}

        {spending.length > 0 ? (
          <>
            <SectionHeader title="Dépenses par catégorie" />
            <Card>
              <Row gap={Spacing.lg} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                <DonutChart
                  data={[
                    ...topSpending.map((s) => ({ value: s.total, color: catById.get(s.categoryId)?.color ?? '#64748B' })),
                    ...(otherSpending > 0 ? [{ value: otherSpending, color: theme.textSecondary }] : []),
                  ]}>
                  <T variant="caption" tone="secondary">
                    Total
                  </T>
                  <T variant="bodyBold">{money(summary.expense, { compact: true })}</T>
                </DonutChart>
                <View style={{ flex: 1, minWidth: 160, gap: Spacing.sm }}>
                  {topSpending.map((s) => {
                    const c = catById.get(s.categoryId);
                    return (
                      <Row key={s.categoryId}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c?.color }} />
                        <T variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                          {c?.name ?? 'Sans catégorie'}
                        </T>
                        <T variant="caption" tone="secondary">
                          {formatPercent(s.total / summary.expense)}
                        </T>
                      </Row>
                    );
                  })}
                  {otherSpending > 0 ? (
                    <Row>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.textSecondary }} />
                      <T variant="caption" style={{ flex: 1 }}>
                        Autres
                      </T>
                      <T variant="caption" tone="secondary">
                        {formatPercent(otherSpending / summary.expense)}
                      </T>
                    </Row>
                  ) : null}
                </View>
              </Row>
            </Card>
          </>
        ) : null}

        {statuses.length > 0 ? (
          <>
            <SectionHeader title="Budgets" action="Tout voir" onAction={() => router.navigate('/budget')} />
            <Card style={{ gap: Spacing.md }}>
              {statuses.slice(0, 3).map((b) => {
                const c = catById.get(b.categoryId);
                const color = b.ratio > 1 ? theme.expense : b.ratio > 0.85 ? theme.warning : (c?.color ?? theme.primary);
                return (
                  <View key={b.categoryId} style={{ gap: Spacing.xs }}>
                    <Row>
                      <T variant="bodyBold" style={{ flex: 1 }}>
                        {c?.name}
                      </T>
                      <T variant="caption" tone={b.ratio > 1 ? 'expense' : 'secondary'}>
                        {money(b.spent)} / {money(b.limit)}
                      </T>
                    </Row>
                    <ProgressBar ratio={b.ratio} color={color} />
                  </View>
                );
              })}
            </Card>
          </>
        ) : null}

        {history.some((h) => h.income > 0 || h.expense > 0) ? (
          <>
            <SectionHeader title="Évolution sur 6 mois" />
            <Card style={{ gap: Spacing.sm }}>
              <BarChart
                data={history.map((h) => ({
                  label: formatMonthShort(h.month),
                  values: [
                    { value: h.income, color: theme.income },
                    { value: h.expense, color: theme.expense },
                  ],
                }))}
                formatValue={(v) => money(v, { compact: true })}
              />
              <Row gap={Spacing.lg} style={{ justifyContent: 'center' }}>
                <Row gap={Spacing.xs}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.income }} />
                  <T variant="caption" tone="secondary">
                    Revenus
                  </T>
                </Row>
                <Row gap={Spacing.xs}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.expense }} />
                  <T variant="caption" tone="secondary">
                    Dépenses
                  </T>
                </Row>
              </Row>
            </Card>
          </>
        ) : null}

        {activeGoals.length > 0 ? (
          <>
            <SectionHeader title="Objectifs d'épargne" action="Tout voir" onAction={() => router.navigate('/goals')} />
            <Card style={{ gap: Spacing.md }}>
              {activeGoals.map((g) => {
                const needed = goalMonthlyNeeded(g, today());
                return (
                  <View key={g.id} style={{ gap: Spacing.xs }}>
                    <Row>
                      <Ionicons name={g.icon} size={16} color={g.color} />
                      <T variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>
                        {g.name}
                      </T>
                      <T variant="caption" tone="secondary">
                        {formatPercent(goalProgress(g))}
                      </T>
                    </Row>
                    <ProgressBar ratio={goalProgress(g)} color={g.color} />
                    <T variant="caption" tone="secondary">
                      {money(goalSaved(g))} sur {money(g.target)}
                      {needed ? ` · ${money(needed)} / mois` : ''}
                    </T>
                  </View>
                );
              })}
            </Card>
          </>
        ) : null}

        {recent.length > 0 ? (
          <>
            <SectionHeader title="Dernières transactions" action="Tout voir" onAction={() => router.navigate('/transactions')} />
            <Card style={{ paddingVertical: Spacing.sm }}>
              {recent.map((t, i) => (
                <View key={t.id}>
                  {i > 0 ? <Divider /> : null}
                  <TransactionRow transaction={t} category={catById.get(t.categoryId)} />
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </Screen>
      <Fab label="Ajouter une transaction" onPress={() => router.push('/transaction')} />
    </View>
  );
}
