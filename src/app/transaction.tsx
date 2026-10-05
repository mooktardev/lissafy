import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextStyle } from 'react-native';

import { CategoryGrid, DateField } from '@/components/pickers';
import { Button, Card, Chip, confirm, Field, Input, Row, Screen, Segmented, T } from '@/components/ui';
import { Fonts, Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { addDays, currentMonth, today } from '@/lib/dates';
import { amountToInput, parseAmount } from '@/lib/format';
import { describeSchedule, FREQUENCY_LABELS } from '@/lib/recurring';
import type { Frequency, ISODate, TransactionKind } from '@/lib/types';
import { useStore } from '@/store';
import { useUi } from '@/store/ui';

export default function TransactionForm() {
  const theme = useTheme();
  const currency = useCurrency();
  const params = useLocalSearchParams<{ id?: string; kind?: TransactionKind }>();
  const existing = useStore((s) => s.transactions.find((t) => t.id === params.id));
  const categories = useStore((s) => s.categories);
  const saveTransaction = useStore((s) => s.saveTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const saveRecurring = useStore((s) => s.saveRecurring);
  const applyRecurring = useStore((s) => s.applyRecurring);
  const rule = useStore((s) => s.recurrings.find((r) => r.id === existing?.recurringId));
  const month = useUi((s) => s.month);

  const [kind, setKind] = useState<TransactionKind>(existing?.kind ?? (params.kind === 'income' ? 'income' : 'expense'));
  const [amount, setAmount] = useState(amountToInput(existing?.amount ?? 0));
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [date, setDate] = useState<ISODate>(existing?.date ?? (month === currentMonth() ? today() : `${month}-01`));
  const [note, setNote] = useState(existing?.note ?? '');
  const [repeat, setRepeat] = useState<Frequency | 'none'>('none');

  const available = categories.filter((c) => c.kind === kind);
  const effectiveCategory = available.some((c) => c.id === categoryId) ? categoryId : null;
  const value = parseAmount(amount);
  const valid = Number.isFinite(value) && value > 0 && effectiveCategory !== null;
  const accent = kind === 'expense' ? theme.expense : theme.income;
  const t = today();
  const yesterday = addDays(t, -1);

  const save = () => {
    if (!valid || !effectiveCategory) return;
    const base = { kind, amount: value, categoryId: effectiveCategory, note: note.trim() };
    if (!existing && repeat !== 'none') {
      // Cette transaction est la première échéance ; les suivantes seront créées automatiquement.
      const ruleId = saveRecurring({
        ...base,
        frequency: repeat,
        startDate: date,
        endDate: null,
        active: true,
        lastGenerated: date,
      });
      saveTransaction({ ...base, date, recurringId: ruleId });
      // Rattrape les échéances déjà passées si la date de départ est ancienne.
      applyRecurring(today());
    } else {
      saveTransaction({ ...base, id: existing?.id, date, recurringId: existing?.recurringId });
    }
    router.back();
  };

  const remove = async () => {
    if (!existing) return;
    if (await confirm('Supprimer la transaction ?', 'Cette action est définitive.')) {
      deleteTransaction(existing.id);
      router.back();
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier' : 'Nouvelle transaction' }} />
      <Segmented<TransactionKind>
        value={kind}
        onChange={setKind}
        options={[
          { value: 'expense', label: 'Dépense', color: theme.expense, icon: 'arrow-up' },
          { value: 'income', label: 'Revenu', color: theme.income, icon: 'arrow-down' },
        ]}
      />

      <Card style={[styles.amountCard, { backgroundColor: `${accent}12`, boxShadow: 'none' }]}>
        <T variant="label" style={{ color: accent }}>
          {kind === 'expense' ? 'Montant dépensé' : 'Montant reçu'}
        </T>
        <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={`${accent}66`}
            keyboardType="decimal-pad"
            inputMode="decimal"
            autoFocus={!existing}
            style={[styles.amountInput, { color: accent }, Platform.OS === 'web' && webNoOutline]}
          />
        <T variant="caption" tone="secondary" style={{ fontFamily: Fonts.semibold }}>
          {currency}
        </T>
      </Card>

      <Field label="Catégorie">
        <CategoryGrid categories={available} value={effectiveCategory} onChange={setCategoryId} />
      </Field>

      <Field label="Date">
        <Row>
          <Chip label="Aujourd'hui" selected={date === t} onPress={() => setDate(t)} />
          <Chip label="Hier" selected={date === yesterday} onPress={() => setDate(yesterday)} />
        </Row>
        <DateField value={date} onChange={(d) => d && setDate(d)} />
      </Field>

      {existing ? (
        rule ? (
          <Card
            onPress={() => router.push({ pathname: '/recurring-edit', params: { id: rule.id } })}
            style={{ backgroundColor: theme.primarySoft, boxShadow: 'none' }}>
            <Row>
              <Ionicons name="repeat" size={18} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <T variant="bodyBold" tone="primary">
                  Transaction récurrente
                </T>
                <T variant="caption" tone="primary">
                  {describeSchedule(rule.frequency, rule.startDate)} · modifier ici ne change que cette échéance
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.primary} />
            </Row>
          </Card>
        ) : null
      ) : (
        <Field
          label="Répéter"
          hint={repeat === 'none' ? undefined : `Ajoutée automatiquement ${describeSchedule(repeat, date)}.`}>
          <Row style={{ flexWrap: 'wrap' }}>
            <Chip label="Jamais" selected={repeat === 'none'} onPress={() => setRepeat('none')} />
            {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
              <Chip key={f} label={FREQUENCY_LABELS[f]} icon="repeat" selected={repeat === f} onPress={() => setRepeat(f)} />
            ))}
          </Row>
        </Field>
      )}

      <Field label="Note (facultatif)">
        <Input icon="create-outline" value={note} onChangeText={setNote} placeholder="Ex. courses du samedi" maxLength={80} />
      </Field>

      <View style={{ gap: Spacing.md, marginTop: Spacing.sm }}>
        <Button title={existing ? 'Enregistrer les modifications' : 'Ajouter'} icon="checkmark" onPress={save} disabled={!valid} />
        {existing ? <Button title="Supprimer" icon="trash-outline" variant="danger" onPress={remove} /> : null}
      </View>
    </Screen>
  );
}

const webNoOutline = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  amountCard: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.lg },
  amountInput: {
    fontFamily: Fonts.extrabold,
    fontSize: 36,
    letterSpacing: -1,
    alignSelf: 'stretch',
    textAlign: 'center',
    paddingVertical: 0,
  },
});
