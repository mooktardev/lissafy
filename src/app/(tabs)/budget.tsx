import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { MonthSwitcher } from '@/components/pickers';
import {
  AmountInput,
  Button,
  Card,
  CategoryIcon,
  Divider,
  Field,
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
  T,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { currentMonth, daysInMonth, today } from '@/lib/dates';
import { monthSummary, spendingByCategory } from '@/lib/finance';
import { amountToInput, formatMoney, formatPercent, parseAmount } from '@/lib/format';
import type { Category } from '@/lib/types';
import { useStore } from '@/store';
import { useUi } from '@/store/ui';

export default function BudgetScreen() {
  const theme = useTheme();
  const currency = useCurrency();
  const { month, setMonth } = useUi();
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const transactions = useStore((s) => s.transactions);
  const setBudget = useStore((s) => s.setBudget);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState('');

  const money = (n: number) => formatMoney(n, currency);
  const spent = new Map(spendingByCategory(transactions, month).map((s) => [s.categoryId, s.total]));
  const limitOf = new Map(budgets.map((b) => [b.categoryId, b.amount]));
  const expenseCats = categories.filter((c) => c.kind === 'expense');

  const totalBudget = budgets.reduce((a, b) => a + b.amount, 0);
  const budgetedSpent = budgets.reduce((a, b) => a + (spent.get(b.categoryId) ?? 0), 0);
  const income = monthSummary(transactions, month).income;

  // Part du mois écoulée (uniquement pour le mois en cours).
  const elapsed = month === currentMonth() ? Number(today().slice(8, 10)) / daysInMonth(month) : null;

  const sorted = [...expenseCats].sort((a, b) => {
    const la = limitOf.get(a.id) ?? 0;
    const lb = limitOf.get(b.id) ?? 0;
    if ((la > 0) !== (lb > 0)) return la > 0 ? -1 : 1;
    return (spent.get(b.id) ?? 0) - (spent.get(a.id) ?? 0);
  });

  const openEditor = (c: Category) => {
    setEditing(c);
    setDraft(amountToInput(limitOf.get(c.id) ?? 0));
  };

  const saveDraft = () => {
    if (!editing) return;
    const v = parseAmount(draft);
    setBudget(editing.id, Number.isFinite(v) && v > 0 ? v : 0);
    setEditing(null);
  };

  return (
    <Screen>
      <MonthSwitcher month={month} onChange={setMonth} />

      <Card style={{ gap: Spacing.md }}>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="caption" tone="secondary">
              Budget total
            </T>
            <T variant="amountLarge">{money(totalBudget)}</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T variant="caption" tone="secondary">
              Reste
            </T>
            <T variant="amount" tone={totalBudget - budgetedSpent < 0 ? 'expense' : 'income'}>
              {money(totalBudget - budgetedSpent)}
            </T>
          </View>
        </Row>
        {totalBudget > 0 ? (
          <View style={{ gap: Spacing.xs }}>
            <ProgressBar
              ratio={budgetedSpent / totalBudget}
              color={budgetedSpent > totalBudget ? theme.expense : theme.primary}
              height={10}
            />
            <T variant="caption" tone="secondary">
              {money(budgetedSpent)} dépensés sur les catégories budgétées ({formatPercent(budgetedSpent / totalBudget)})
              {elapsed !== null ? ` · ${formatPercent(elapsed)} du mois écoulé` : ''}
            </T>
          </View>
        ) : (
          <T tone="secondary">Touchez une catégorie ci-dessous pour définir son plafond mensuel.</T>
        )}
        {income > 0 && totalBudget > 0 ? (
          <T variant="caption" tone={totalBudget > income ? 'expense' : 'secondary'}>
            Vos budgets représentent {formatPercent(totalBudget / income)} des revenus du mois
            {totalBudget > income ? ' — attention, ils dépassent vos revenus.' : '.'}
          </T>
        ) : null}
      </Card>

      <SectionHeader title="Par catégorie" />
      <Card style={{ paddingVertical: Spacing.sm }}>
        {sorted.map((c, i) => {
          const limit = limitOf.get(c.id) ?? 0;
          const s = spent.get(c.id) ?? 0;
          const ratio = limit > 0 ? s / limit : 0;
          const color = ratio > 1 ? theme.expense : ratio > 0.85 ? theme.warning : c.color;
          return (
            <View key={c.id}>
              {i > 0 ? <Divider /> : null}
              <Pressable onPress={() => openEditor(c)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                <CategoryIcon icon={c.icon} color={c.color} size={36} />
                <View style={{ flex: 1, gap: Spacing.xs }}>
                  <Row>
                    <T variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>
                      {c.name}
                    </T>
                    {limit > 0 ? (
                      <T variant="caption" tone={ratio > 1 ? 'expense' : 'secondary'}>
                        {money(s)} / {money(limit)}
                      </T>
                    ) : (
                      <T variant="caption" tone="primary">
                        {s > 0 ? `${money(s)} · ` : ''}Définir
                      </T>
                    )}
                  </Row>
                  {limit > 0 ? (
                    <>
                      <ProgressBar ratio={ratio} color={color} />
                      <T variant="caption" tone={ratio > 1 ? 'expense' : ratio > 0.85 ? 'warning' : 'secondary'}>
                        {ratio > 1 ? `Dépassement de ${money(s - limit)}` : `Reste ${money(limit - s)}`}
                      </T>
                    </>
                  ) : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={() => setEditing(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            {editing ? (
              <>
                <Row>
                  <CategoryIcon icon={editing.icon} color={editing.color} />
                  <T variant="heading" style={{ flex: 1 }}>
                    {editing.name}
                  </T>
                  <Pressable onPress={() => setEditing(null)} hitSlop={10}>
                    <Ionicons name="close" size={22} color={theme.textSecondary} />
                  </Pressable>
                </Row>
                <Field label="Plafond mensuel" hint="Laissez vide ou 0 pour retirer le budget. S'applique à tous les mois.">
                  <AmountInput value={draft} onChangeText={setDraft} suffix={currency} autoFocus onSubmitEditing={saveDraft} />
                </Field>
                <Button title="Enregistrer" icon="checkmark" onPress={saveDraft} />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  sheet: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.lg, width: '100%', maxWidth: 420, alignSelf: 'center' },
});
