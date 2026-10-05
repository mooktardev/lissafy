import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CategoryGrid, DateField } from '@/components/pickers';
import { AmountInput, Button, Chip, confirm, Field, Input, Row, Screen, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { addDays, today } from '@/lib/dates';
import { amountToInput, parseAmount } from '@/lib/format';
import { describeSchedule, FREQUENCY_LABELS } from '@/lib/recurring';
import type { Frequency, ISODate, TransactionKind } from '@/lib/types';
import { useStore } from '@/store';

const maxDate = (a: ISODate | null, b: ISODate) => (a !== null && a > b ? a : b);

export default function RecurringEdit() {
  const theme = useTheme();
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.recurrings.find((r) => r.id === id));
  const categories = useStore((s) => s.categories);
  const saveRecurring = useStore((s) => s.saveRecurring);
  const deleteRecurring = useStore((s) => s.deleteRecurring);
  const applyRecurring = useStore((s) => s.applyRecurring);

  const [kind, setKind] = useState<TransactionKind>(existing?.kind ?? 'expense');
  const [amount, setAmount] = useState(amountToInput(existing?.amount ?? 0));
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState<ISODate>(existing?.startDate ?? today());
  const [endDate, setEndDate] = useState<ISODate | null>(existing?.endDate ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [active, setActive] = useState(existing?.active ?? true);

  const available = categories.filter((c) => c.kind === kind);
  const effectiveCategory = available.some((c) => c.id === categoryId) ? categoryId : null;
  const value = parseAmount(amount);
  const valid =
    Number.isFinite(value) && value > 0 && effectiveCategory !== null && (endDate === null || endDate >= startDate);

  const save = () => {
    if (!valid || !effectiveCategory) return;
    saveRecurring({
      id: existing?.id,
      kind,
      amount: value,
      categoryId: effectiveCategory,
      note: note.trim(),
      frequency,
      startDate,
      endDate,
      active,
      // Reprise après une pause : on ne rattrape pas les échéances de la période en pause.
      ...(existing && !existing.active && active
        ? { lastGenerated: maxDate(existing.lastGenerated, addDays(today(), -1)) }
        : {}),
    });
    applyRecurring(today());
    router.back();
  };

  const remove = async () => {
    if (!existing) return;
    if (await confirm('Supprimer la récurrence ?', 'Les transactions déjà créées sont conservées ; aucune nouvelle ne sera ajoutée.')) {
      deleteRecurring(existing.id);
      router.back();
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier la récurrence' : 'Nouvelle récurrence' }} />
      <Segmented<TransactionKind>
        value={kind}
        onChange={setKind}
        options={[
          { value: 'expense', label: 'Dépense', color: theme.expense, icon: 'arrow-up' },
          { value: 'income', label: 'Revenu', color: theme.income, icon: 'arrow-down' },
        ]}
      />
      <Field label="Montant" hint={existing ? 'Un changement de montant s’applique aux prochaines échéances uniquement.' : undefined}>
        <AmountInput value={amount} onChangeText={setAmount} suffix={currency} autoFocus={!existing} />
      </Field>
      <Field label="Libellé (facultatif)">
        <Input icon="create-outline" value={note} onChangeText={setNote} placeholder="Ex. Loyer, Netflix, Salaire" maxLength={80} />
      </Field>
      <Field label="Catégorie">
        <CategoryGrid categories={available} value={effectiveCategory} onChange={setCategoryId} />
      </Field>
      <Field label="Fréquence" hint={`Ajoutée automatiquement ${describeSchedule(frequency, startDate)}.`}>
        <Row style={{ flexWrap: 'wrap' }}>
          {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
            <Chip key={f} label={FREQUENCY_LABELS[f]} selected={frequency === f} onPress={() => setFrequency(f)} />
          ))}
        </Row>
      </Field>
      <Field
        label="Première échéance"
        hint={!existing && startDate < today() ? 'Les échéances déjà passées depuis cette date seront ajoutées.' : undefined}>
        <DateField value={startDate} onChange={(d) => d && setStartDate(d)} />
      </Field>
      <Field label="Fin (facultatif)" hint={endDate !== null && endDate < startDate ? 'La fin doit être après la première échéance.' : undefined}>
        <DateField value={endDate} onChange={setEndDate} allowClear placeholder="Sans fin" />
      </Field>
      {existing ? (
        <Field label="État">
          <Segmented<'on' | 'off'>
            value={active ? 'on' : 'off'}
            onChange={(v) => setActive(v === 'on')}
            options={[
              { value: 'on', label: 'Active', icon: 'play' },
              { value: 'off', label: 'En pause', icon: 'pause' },
            ]}
          />
        </Field>
      ) : null}
      <View style={{ gap: Spacing.md, marginTop: Spacing.sm }}>
        <Button title={existing ? 'Enregistrer' : 'Créer la récurrence'} icon="checkmark" onPress={save} disabled={!valid} />
        {existing ? <Button title="Supprimer" icon="trash-outline" variant="danger" onPress={remove} /> : null}
      </View>
    </Screen>
  );
}
