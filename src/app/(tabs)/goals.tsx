import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, CategoryIcon, EmptyState, Fab, ProgressBar, Row, Screen, SectionHeader, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/use-theme';
import { formatDate, today } from '@/lib/dates';
import { goalMonthlyNeeded, goalProgress, goalSaved } from '@/lib/finance';
import { formatMoney, formatPercent } from '@/lib/format';
import type { Goal } from '@/lib/types';
import { useStore } from '@/store';

function GoalCard({ goal }: { goal: Goal }) {
  const currency = useCurrency();
  const saved = goalSaved(goal);
  const progress = goalProgress(goal);
  const needed = goalMonthlyNeeded(goal, today());
  const late = goal.deadline !== null && goal.deadline < today() && progress < 1;

  return (
    <Card onPress={() => router.push({ pathname: '/goal/[id]', params: { id: goal.id } })} style={{ gap: Spacing.md }}>
      <Row gap={Spacing.md}>
        <CategoryIcon icon={goal.icon} color={goal.color} size={44} />
        <View style={{ flex: 1 }}>
          <T variant="heading" numberOfLines={1}>
            {goal.name}
          </T>
          <T variant="caption" tone={late ? 'expense' : 'secondary'}>
            {goal.deadline ? `${late ? 'Échéance dépassée · ' : 'Avant le '}${formatDate(goal.deadline)}` : 'Sans échéance'}
          </T>
        </View>
        <T variant="bodyBold" tone={progress >= 1 ? 'income' : 'default'}>
          {formatPercent(progress)}
        </T>
      </Row>
      <ProgressBar ratio={progress} color={goal.color} height={10} />
      <Row>
        <T variant="caption" tone="secondary" style={{ flex: 1 }}>
          {formatMoney(saved, currency)} sur {formatMoney(goal.target, currency)}
        </T>
        {progress >= 1 ? (
          <T variant="caption" tone="income">
            Objectif atteint 🎉
          </T>
        ) : needed ? (
          <T variant="caption" tone="primary">
            {formatMoney(needed, currency)} / mois
          </T>
        ) : null}
      </Row>
    </Card>
  );
}

export default function Goals() {
  const currency = useCurrency();
  const goals = useStore((s) => s.goals);

  const active = goals.filter((g) => goalProgress(g) < 1);
  const done = goals.filter((g) => goalProgress(g) >= 1);
  const totalSaved = goals.reduce((a, g) => a + goalSaved(g), 0);
  const monthlyTotal = active.reduce((a, g) => a + (goalMonthlyNeeded(g, today()) ?? 0), 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {goals.length === 0 ? (
          <Card>
            <EmptyState
              icon="flag-outline"
              title="Aucun objectif"
              message="Fonds d'urgence, vacances, apport immobilier… Fixez un montant et une échéance : Planifin calcule combien mettre de côté chaque mois."
              action={
                <Button title="Créer un objectif" icon="add" onPress={() => router.push('/goal-edit')} style={{ marginTop: Spacing.sm }} />
              }
            />
          </Card>
        ) : (
          <>
            <Row gap={Spacing.md}>
              <StatTile label="Épargné au total" value={formatMoney(totalSaved, currency)} tone="income" icon="wallet" />
              <StatTile label="À épargner / mois" value={formatMoney(monthlyTotal, currency)} tone="primary" icon="calendar" />
            </Row>
            {active.length > 0 ? <SectionHeader title="En cours" /> : null}
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
            {done.length > 0 ? <SectionHeader title="Atteints" /> : null}
            {done.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </>
        )}
      </Screen>
      <Fab label="Nouvel objectif" onPress={() => router.push('/goal-edit')} />
    </View>
  );
}
