import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { MonthSwitcher } from '@/components/pickers';
import {
  AmountInput,
  Button,
  Card,
  CategoryIcon,
  Chip,
  Divider,
  Field,
  ProgressBar,
  ProgressRing,
  Row,
  Screen,
  SectionHeader,
  T,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { addMonths, currentMonth, daysInMonth, today } from '@/lib/dates';
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
  const lastSpent = new Map(spendingByCategory(transactions, addMonths(month, -1)).map((s) => [s.categoryId, s.total]));
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

  const budgeted = sorted.filter((c) => (limitOf.get(c.id) ?? 0) > 0);
  const unbudgeted = sorted.filter((c) => !((limitOf.get(c.id) ?? 0) > 0));
  const left = totalBudget - budgetedSpent;
  const ratioAll = totalBudget > 0 ? budgetedSpent / totalBudget : 0;

  return (
    <Screen title="Budget" right={<MonthSwitcher month={month} onChange={setMonth} />}>
      <Card style={{ gap: Spacing.md }}>
        <Row gap={Spacing.lg}>
          <ProgressRing
            ratio={ratioAll}
            size={100}
            thickness={10}
            color={left < 0 ? theme.expense : ratioAll > 0.85 ? theme.warning : theme.primary}>
            <T variant="caption" tone="secondary">
              {left >= 0 ? 'Reste' : 'Dépassé'}
            </T>
            <T variant="bodyBold" style={{ fontFamily: Fonts.extrabold, fontSize: 14 }} tone={left < 0 ? 'expense' : 'default'}>
              {formatMoney(Math.abs(left), currency, { compact: Math.abs(left) >= 10000 })}
            </T>
          </ProgressRing>
          <View style={{ flex: 1, gap: Spacing.md }}>
            <View>
              <T variant="caption" tone="secondary">
                Budget du mois
              </T>
              <T variant="amountLarge" style={{ fontSize: 20 }} numberOfLines={1} adjustsFontSizeToFit>
                {money(totalBudget)}
              </T>
            </View>
            <View>
              <T variant="caption" tone="secondary">
                Dépensé
              </T>
              <T variant="amount">
                {money(budgetedSpent)}{' '}
                {totalBudget > 0 ? (
                  <T variant="caption" tone="secondary">
                    ({formatPercent(ratioAll)})
                  </T>
                ) : null}
              </T>
            </View>
          </View>
        </Row>
        {totalBudget > 0 && elapsed !== null ? (
          <View style={{ gap: Spacing.sm }}>
            <Row>
              <T variant="caption" tone="secondary" style={{ flex: 1 }}>
                Mois écoulé
              </T>
              <T variant="caption" style={{ fontFamily: Fonts.bold }}>
                {formatPercent(elapsed)}
              </T>
            </Row>
            <ProgressBar ratio={elapsed} color={theme.textSecondary} height={4} />
          </View>
        ) : null}
        {totalBudget === 0 ? (
          <View style={[styles.tip, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="bulb" size={18} color={theme.primaryText} />
            <T variant="caption" style={{ flex: 1, color: theme.primaryText }}>
              Touchez une catégorie pour fixer son plafond mensuel. Il s&apos;appliquera à tous les mois.
            </T>
          </View>
        ) : null}
        {income > 0 && totalBudget > income ? (
          <View style={[styles.tip, { backgroundColor: theme.expenseSoft }]}>
            <Ionicons name="warning" size={18} color={theme.expense} />
            <T variant="caption" tone="expense" style={{ flex: 1 }}>
              Vos budgets ({formatPercent(totalBudget / income)} des revenus) dépassent vos revenus du mois.
            </T>
          </View>
        ) : null}
      </Card>

      {budgeted.length > 0 ? <SectionHeader title="Catégories suivies" /> : null}
      {budgeted.map((c) => {
        const limit = limitOf.get(c.id) ?? 0;
        const s = spent.get(c.id) ?? 0;
        const ratio = s / limit;
        const color = ratio > 1 ? theme.expense : ratio > 0.85 ? theme.warning : c.color;
        return (
          <Card key={c.id} onPress={() => openEditor(c)} style={{ gap: Spacing.md }}>
            <Row gap={Spacing.md}>
              <CategoryIcon icon={c.icon} color={c.color} />
              <View style={{ flex: 1 }}>
                <T variant="bodyBold" numberOfLines={1}>
                  {c.name}
                </T>
                <T variant="caption" tone={ratio > 1 ? 'expense' : ratio > 0.85 ? 'warning' : 'secondary'}>
                  {ratio > 1 ? `Dépassement de ${money(s - limit)}` : `Reste ${money(limit - s)}`}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="amount">{money(s)}</T>
                <T variant="caption" tone="secondary">
                  sur {money(limit)}
                </T>
              </View>
            </Row>
            <ProgressBar ratio={ratio} color={color} height={6} />
          </Card>
        );
      })}

      {unbudgeted.length > 0 ? <SectionHeader title="Sans budget" /> : null}
      {unbudgeted.length > 0 ? (
        <Card style={{ paddingVertical: Spacing.xs }}>
          {unbudgeted.map((c, i) => {
            const s = spent.get(c.id) ?? 0;
            return (
              <View key={c.id}>
                {i > 0 ? <Divider inset={48} /> : null}
                <Pressable onPress={() => openEditor(c)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                  <CategoryIcon icon={c.icon} color={c.color} size={36} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodyBold" numberOfLines={1}>
                      {c.name}
                    </T>
                    {s > 0 ? (
                      <T variant="caption" tone="secondary">
                        {money(s)} dépensés ce mois
                      </T>
                    ) : null}
                  </View>
                  <View style={[styles.addPill, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name="add" size={16} color={theme.primaryText} />
                    <T variant="caption" tone="primary" style={{ fontFamily: Fonts.bold }}>
                      Budget
                    </T>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </Card>
      ) : null}

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
                {(lastSpent.get(editing.id) ?? 0) > 0 ? (
                  <Row style={{ flexWrap: 'wrap' }}>
                    <T variant="caption" tone="secondary">
                      Le mois dernier :
                    </T>
                    <Chip
                      label={money(Math.ceil(lastSpent.get(editing.id) ?? 0))}
                      selected={false}
                      onPress={() => setDraft(amountToInput(Math.ceil(lastSpent.get(editing.id) ?? 0)))}
                    />
                  </Row>
                ) : null}
                <Button title="Enregistrer" icon="checkmark" onPress={saveDraft} />
              </>
            ) : null}
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  tip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  addPill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill },
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  sheet: { borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.lg, width: '100%', maxWidth: 420, alignSelf: 'center' },
});
