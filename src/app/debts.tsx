import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, CategoryIcon, EmptyState, Fab, ProgressBar, Row, Screen, SectionHeader, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { addMonths, currentMonth, formatMonth } from '@/lib/dates';
import { amortizationSchedule, debtBalance, debtProgress } from '@/lib/finance';
import { formatMoney, formatPercent } from '@/lib/format';
import { useStore } from '@/store';

export default function Debts() {
  const theme = useTheme();
  const currency = useCurrency();
  const debts = useStore((s) => s.debts);
  const money = (n: number) => formatMoney(n, currency);

  const active = debts.filter((d) => debtBalance(d) > 0);
  const totalBalance = active.reduce((a, d) => a + debtBalance(d), 0);
  const totalMonthly = active.reduce((a, d) => a + d.monthlyPayment, 0);
  const byRate = [...active].sort((a, b) => b.annualRate - a.annualRate);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {debts.length === 0 ? (
          <Card>
            <EmptyState
              icon="card-outline"
              title="Aucune dette suivie"
              message="Ajoutez un crédit immobilier, auto ou à la consommation pour suivre le capital restant et l'échéancier."
              action={
                <Button title="Ajouter une dette" icon="add" onPress={() => router.push('/debt-edit')} style={{ marginTop: Spacing.sm }} />
              }
            />
          </Card>
        ) : (
          <>
            <Row gap={Spacing.md}>
              <StatTile label="Capital restant" value={money(totalBalance)} tone="expense" />
              <StatTile label="Mensualités" value={money(totalMonthly)} />
            </Row>

            {byRate.length > 1 ? (
              <Card style={{ gap: Spacing.xs, backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }}>
                <T variant="bodyBold" tone="primary">
                  Stratégie « avalanche »
                </T>
                <T variant="caption">
                  Pour payer moins d&apos;intérêts, affectez tout surplus en priorité à « {byRate[0].name} » (
                  {formatPercent(byRate[0].annualRate / 100, 1)}), tout en payant le minimum sur les autres.
                </T>
              </Card>
            ) : null}

            <SectionHeader title="Mes dettes" />
            {debts.map((d) => {
              const balance = debtBalance(d);
              const schedule = amortizationSchedule(balance, d.annualRate, d.monthlyPayment);
              const end = balance <= 0 ? 'Remboursée' : schedule.paysOff ? `Fin ${formatMonth(addMonths(currentMonth(), schedule.rows.length))}` : 'Mensualité insuffisante';
              return (
                <Card key={d.id} onPress={() => router.push({ pathname: '/debt/[id]', params: { id: d.id } })} style={{ gap: Spacing.md }}>
                  <Row gap={Spacing.md}>
                    <CategoryIcon icon={balance <= 0 ? 'checkmark-circle' : 'card'} color={balance <= 0 ? theme.income : theme.expense} />
                    <View style={{ flex: 1 }}>
                      <T variant="bodyBold" numberOfLines={1}>
                        {d.name}
                      </T>
                      <T variant="caption" tone={schedule.paysOff ? 'secondary' : 'expense'}>
                        {formatPercent(d.annualRate / 100, 2)} · {money(d.monthlyPayment)} / mois · {end}
                      </T>
                    </View>
                  </Row>
                  <ProgressBar ratio={debtProgress(d)} color={theme.income} />
                  <Row>
                    <T variant="caption" tone="secondary" style={{ flex: 1 }}>
                      Reste {money(balance)} sur {money(d.originalAmount)}
                    </T>
                    <T variant="caption" tone="income">
                      {formatPercent(debtProgress(d))} remboursé
                    </T>
                  </Row>
                </Card>
              );
            })}
          </>
        )}
      </Screen>
      <Fab label="Ajouter une dette" onPress={() => router.push('/debt-edit')} />
    </View>
  );
}
