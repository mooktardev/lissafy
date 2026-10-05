import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, Card, CategoryIcon, Divider, EmptyState, Fab, Row, Screen, SectionHeader, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { formatDayHeader, today } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { describeSchedule, monthlyEquivalent, nextOccurrence } from '@/lib/recurring';
import type { Recurring } from '@/lib/types';
import { useStore } from '@/store';

function RuleRow({ rule }: { rule: Recurring }) {
  const theme = useTheme();
  const currency = useCurrency();
  const category = useStore((s) => s.categories.find((c) => c.id === rule.categoryId));
  const next = nextOccurrence(rule, today());
  const isIncome = rule.kind === 'income';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/recurring-edit', params: { id: rule.id } })}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 },
        (pressed || !rule.active) && { opacity: rule.active ? 0.6 : 0.5 },
      ]}>
      <CategoryIcon icon={category?.icon ?? 'repeat'} color={category?.color ?? theme.primary} size={38} />
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyBold" numberOfLines={1}>
          {rule.note || category?.name || 'Sans catégorie'}
        </T>
        <T variant="caption" tone="secondary" numberOfLines={1}>
          {rule.active ? describeSchedule(rule.frequency, rule.startDate) : 'En pause'}
        </T>
        {rule.active ? (
          <T variant="caption" tone={next ? 'primary' : 'secondary'} numberOfLines={1}>
            {next ? `Prochaine : ${formatDayHeader(next).toLowerCase()}` : 'Terminée'}
          </T>
        ) : null}
      </View>
      <T variant="amount" tone={isIncome ? 'income' : 'default'}>
        {formatMoney(isIncome ? rule.amount : -rule.amount, currency, { sign: true })}
      </T>
    </Pressable>
  );
}

export default function RecurringList() {
  const currency = useCurrency();
  const recurrings = useStore((s) => s.recurrings);

  const active = recurrings.filter((r) => r.active);
  const fixedIncome = active.filter((r) => r.kind === 'income').reduce((a, r) => a + monthlyEquivalent(r), 0);
  const fixedExpense = active.filter((r) => r.kind === 'expense').reduce((a, r) => a + monthlyEquivalent(r), 0);
  const incomes = recurrings.filter((r) => r.kind === 'income');
  const expenses = recurrings.filter((r) => r.kind === 'expense');

  const section = (title: string, list: Recurring[]) =>
    list.length > 0 ? (
      <>
        <SectionHeader title={title} />
        <Card style={{ paddingVertical: Spacing.xs }}>
          {list.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Divider inset={50} /> : null}
              <RuleRow rule={r} />
            </View>
          ))}
        </Card>
      </>
    ) : null;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {recurrings.length === 0 ? (
          <Card>
            <EmptyState
              icon="repeat"
              title="Aucune transaction récurrente"
              message="Salaire, loyer, abonnements… Enregistrez-les une fois : Lissafy les ajoute automatiquement à chaque échéance."
              action={
                <Button title="Ajouter une récurrence" icon="add" onPress={() => router.push('/recurring-edit')} style={{ marginTop: Spacing.sm }} />
              }
            />
          </Card>
        ) : (
          <>
            <Row gap={Spacing.md}>
              <StatTile label="Revenus fixes / mois" value={formatMoney(fixedIncome, currency)} tone="income" icon="arrow-down" />
              <StatTile label="Charges fixes / mois" value={formatMoney(fixedExpense, currency)} tone="expense" icon="arrow-up" />
            </Row>
            <Card style={{ gap: 2 }}>
              <Row>
                <Ionicons name="wallet-outline" size={16} color={fixedIncome - fixedExpense >= 0 ? '#0E9F6E' : '#E5484D'} />
                <T variant="caption" tone="secondary" style={{ flex: 1 }}>
                  Reste après les charges fixes
                </T>
              </Row>
              <T variant="amountLarge" tone={fixedIncome - fixedExpense >= 0 ? 'income' : 'expense'}>
                {formatMoney(fixedIncome - fixedExpense, currency, { sign: true })}
              </T>
              <T variant="caption" tone="secondary">
                par mois, avant les dépenses variables
              </T>
            </Card>
            {section('Revenus', incomes)}
            {section('Dépenses', expenses)}
          </>
        )}
      </Screen>
      <Fab label="Ajouter une récurrence" onPress={() => router.push('/recurring-edit')} />
    </View>
  );
}
