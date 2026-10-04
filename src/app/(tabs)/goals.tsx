import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  CategoryIcon,
  EmptyState,
  GradientCard,
  IconButton,
  ProgressBar,
  ProgressRing,
  Row,
  Screen,
  SectionHeader,
  T,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { formatDate, today } from '@/lib/dates';
import { goalMonthlyNeeded, goalProgress, goalSaved } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { Goal } from '@/lib/types';
import { useStore } from '@/store';

const SAVINGS_GRADIENT = ['#22C55E', '#0E9F6E', '#0B7A5A'] as const;

function GoalCard({ goal }: { goal: Goal }) {
  const theme = useTheme();
  const currency = useCurrency();
  const saved = goalSaved(goal);
  const progress = goalProgress(goal);
  const needed = goalMonthlyNeeded(goal, today());
  const done = progress >= 1;
  const late = goal.deadline !== null && goal.deadline < today() && !done;

  return (
    <Card onPress={() => router.push({ pathname: '/goal/[id]', params: { id: goal.id } })} style={{ gap: Spacing.lg }}>
      <Row gap={Spacing.md}>
        <ProgressRing ratio={progress} color={goal.color} size={64} thickness={6}>
          <Ionicons name={done ? 'checkmark' : goal.icon} size={24} color={goal.color} />
        </ProgressRing>
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="heading" numberOfLines={1}>
            {goal.name}
          </T>
          <Row gap={4}>
            <Ionicons
              name={goal.deadline ? 'calendar-outline' : 'infinite-outline'}
              size={13}
              color={late ? theme.expense : theme.textSecondary}
            />
            <T variant="caption" tone={late ? 'expense' : 'secondary'}>
              {goal.deadline ? `${late ? 'Échue le ' : 'Avant le '}${formatDate(goal.deadline)}` : 'Sans échéance'}
            </T>
          </Row>
        </View>
        <T variant="heading" style={{ color: goal.color, fontFamily: Fonts.extrabold }}>
          {Math.round(progress * 100)}%
        </T>
      </Row>
      <View style={{ gap: Spacing.sm }}>
        <ProgressBar ratio={progress} color={goal.color} height={8} />
        <Row>
          <T variant="caption" tone="secondary" style={{ flex: 1 }}>
            <T variant="caption" style={{ fontFamily: Fonts.bold }}>
              {formatMoney(saved, currency)}
            </T>{' '}
            sur {formatMoney(goal.target, currency)}
          </T>
          {done ? (
            <View style={[styles.badge, { backgroundColor: theme.incomeSoft }]}>
              <T variant="caption" tone="income" style={{ fontFamily: Fonts.bold, fontSize: 12 }}>
                Atteint 🎉
              </T>
            </View>
          ) : needed ? (
            <View style={[styles.badge, { backgroundColor: `${goal.color}1A` }]}>
              <T variant="caption" style={{ color: goal.color, fontFamily: Fonts.bold, fontSize: 12 }}>
                {formatMoney(needed, currency)} / mois
              </T>
            </View>
          ) : null}
        </Row>
      </View>
    </Card>
  );
}

export default function Goals() {
  const currency = useCurrency();
  const goals = useStore((s) => s.goals);

  const active = goals.filter((g) => goalProgress(g) < 1);
  const done = goals.filter((g) => goalProgress(g) >= 1);
  const totalSaved = goals.reduce((a, g) => a + goalSaved(g), 0);
  const totalTarget = goals.reduce((a, g) => a + g.target, 0);
  const monthlyTotal = active.reduce((a, g) => a + (goalMonthlyNeeded(g, today()) ?? 0), 0);

  return (
    <Screen
      title="Objectifs"
      right={<IconButton icon="add" label="Nouvel objectif" filled onPress={() => router.push('/goal-edit')} />}>
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon="flag"
            title="Aucun objectif pour l’instant"
            message="Fonds d'urgence, vacances, apport immobilier… Fixez un montant et une échéance : Planifin calcule combien mettre de côté chaque mois."
            action={
              <Button title="Créer un objectif" icon="add" onPress={() => router.push('/goal-edit')} style={{ marginTop: Spacing.sm }} />
            }
          />
        </Card>
      ) : (
        <>
          <GradientCard colors={SAVINGS_GRADIENT} style={{ gap: Spacing.lg, boxShadow: '0px 14px 32px rgba(14, 159, 110, 0.32)' }}>
            <View>
              <T variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
                Épargné au total
              </T>
              <T variant="hero" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(totalSaved, currency)}
              </T>
            </View>
            <ProgressBar ratio={totalTarget > 0 ? totalSaved / totalTarget : 0} color="#FFFFFF" track="rgba(255,255,255,0.25)" height={6} />
            <Row>
              <View style={{ flex: 1 }}>
                <T variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
                  Objectifs cumulés
                </T>
                <T variant="amount" tone="inverse">
                  {formatMoney(totalTarget, currency)}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
                  À épargner / mois
                </T>
                <T variant="amount" tone="inverse">
                  {formatMoney(monthlyTotal, currency)}
                </T>
              </View>
            </Row>
          </GradientCard>

          {active.length > 0 ? <SectionHeader title={`En cours · ${active.length}`} /> : null}
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
          {done.length > 0 ? <SectionHeader title={`Atteints · ${done.length}`} /> : null}
          {done.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}

          <Card onPress={() => router.push('/goal-edit')} style={styles.addCard}>
            <CategoryIcon icon="add" color="#5B4CF0" size={40} />
            <T variant="bodyBold" tone="primary">
              Nouvel objectif
            </T>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, justifyContent: 'center' },
});
