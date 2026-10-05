import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DonutChart } from '@/components/charts';
import { DateField } from '@/components/pickers';
import {
  AmountInput,
  Button,
  Card,
  confirm,
  Divider,
  EmptyState,
  Field,
  IconButton,
  Row,
  Screen,
  Segmented,
  SectionHeader,
  StatTile,
  T,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { formatDate, today } from '@/lib/dates';
import { goalMonthlyNeeded, goalProgress, goalSaved } from '@/lib/finance';
import { formatMoney, formatPercent, parseAmount } from '@/lib/format';
import type { ISODate } from '@/lib/types';
import { useStore } from '@/store';

export default function GoalDetail() {
  const theme = useTheme();
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const addContribution = useStore((s) => s.addContribution);
  const deleteContribution = useStore((s) => s.deleteContribution);
  const deleteGoal = useStore((s) => s.deleteGoal);

  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<ISODate>(today());

  if (!goal) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Objectif introuvable" />
      </Screen>
    );
  }

  const money = (n: number, sign?: boolean) => formatMoney(n, currency, { sign });
  const saved = goalSaved(goal);
  const progress = goalProgress(goal);
  const remaining = Math.max(0, goal.target - saved);
  const needed = goalMonthlyNeeded(goal, today());
  const value = parseAmount(amount);
  const valid = Number.isFinite(value) && value > 0 && (mode === 'deposit' || value <= saved);

  const submit = () => {
    if (!valid) return;
    addContribution(goal.id, mode === 'deposit' ? value : -value, date);
    setAmount('');
  };

  const remove = async () => {
    if (await confirm(`Supprimer « ${goal.name} » ?`, 'L’objectif et son historique seront supprimés.')) {
      deleteGoal(goal.id);
      router.back();
    }
  };

  const history = [...goal.contributions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: goal.name,
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Modifier"
              onPress={() => router.push({ pathname: '/goal-edit', params: { id: goal.id } })}
            />
          ),
        }}
      />
      <Card style={{ alignItems: 'center', gap: Spacing.md }}>
        <DonutChart data={[{ value: progress, color: goal.color }, { value: 1 - progress, color: 'transparent' }]} size={140}>
          <T variant="title">{formatPercent(progress)}</T>
          <T variant="caption" tone="secondary">
            {money(saved)}
          </T>
        </DonutChart>
        <T tone="secondary">
          Objectif : {money(goal.target)}
          {goal.deadline ? ` · avant le ${formatDate(goal.deadline)}` : ''}
        </T>
      </Card>

      <Row gap={Spacing.md}>
        <StatTile label="Reste à épargner" value={money(remaining)} />
        <StatTile
          label="Effort mensuel"
          value={needed === null ? '—' : money(needed)}
          tone="primary"
        />
      </Row>
      {needed === null && remaining > 0 ? (
        <T variant="caption" tone="secondary">
          Ajoutez une échéance pour connaître l&apos;effort d&apos;épargne mensuel nécessaire.
        </T>
      ) : null}

      <SectionHeader title="Mouvement" />
      <Card style={{ gap: Spacing.md }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'deposit', label: 'Versement', color: theme.income },
            { value: 'withdraw', label: 'Retrait', color: theme.expense },
          ]}
        />
        <Field label="Montant">
          <AmountInput value={amount} onChangeText={setAmount} suffix={currency} onSubmitEditing={submit} />
        </Field>
        <Field label="Date">
          <DateField value={date} onChange={(d) => d && setDate(d)} />
        </Field>
        <Button title={mode === 'deposit' ? 'Ajouter le versement' : 'Enregistrer le retrait'} icon="add" onPress={submit} disabled={!valid} />
      </Card>

      {history.length > 0 ? (
        <>
          <SectionHeader title="Historique" />
          <Card style={{ paddingVertical: Spacing.xs }}>
            {history.map((c, i) => (
              <View key={c.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ paddingVertical: Spacing.sm }}>
                  <T style={{ flex: 1 }}>{formatDate(c.date)}</T>
                  <T variant="amount" tone={c.amount >= 0 ? 'income' : 'expense'}>
                    {money(c.amount, true)}
                  </T>
                  <IconButton
                    icon="trash-outline"
                    label="Supprimer le mouvement"
                    size={18}
                    color={theme.textSecondary}
                    onPress={async () => {
                      if (await confirm('Supprimer ce mouvement ?', `${money(c.amount, true)} le ${formatDate(c.date)}`)) {
                        deleteContribution(goal.id, c.id);
                      }
                    }}
                  />
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Button title="Supprimer l'objectif" icon="trash-outline" variant="danger" onPress={remove} />
    </Screen>
  );
}
