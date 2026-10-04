import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CategoryGrid, DateField } from '@/components/pickers';
import { AmountInput, Button, confirm, Field, Input, Screen, Segmented } from '@/components/ui';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { currentMonth, today } from '@/lib/dates';
import { amountToInput, parseAmount } from '@/lib/format';
import type { ISODate, TransactionKind } from '@/lib/types';
import { useStore } from '@/store';
import { useUi } from '@/store/ui';

export default function TransactionForm() {
  const theme = useTheme();
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.transactions.find((t) => t.id === id));
  const categories = useStore((s) => s.categories);
  const saveTransaction = useStore((s) => s.saveTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const month = useUi((s) => s.month);

  const [kind, setKind] = useState<TransactionKind>(existing?.kind ?? 'expense');
  const [amount, setAmount] = useState(amountToInput(existing?.amount ?? 0));
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [date, setDate] = useState<ISODate>(
    existing?.date ?? (month === currentMonth() ? today() : `${month}-01`),
  );
  const [note, setNote] = useState(existing?.note ?? '');

  const available = categories.filter((c) => c.kind === kind);
  const effectiveCategory = available.some((c) => c.id === categoryId) ? categoryId : null;
  const value = parseAmount(amount);
  const valid = Number.isFinite(value) && value > 0 && effectiveCategory !== null;

  const save = () => {
    if (!valid || !effectiveCategory) return;
    saveTransaction({ id: existing?.id, kind, amount: value, categoryId: effectiveCategory, date, note: note.trim() });
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
      <Stack.Screen options={{ title: existing ? 'Modifier la transaction' : 'Nouvelle transaction' }} />
      <Segmented<TransactionKind>
        value={kind}
        onChange={setKind}
        options={[
          { value: 'expense', label: 'Dépense', color: theme.expense },
          { value: 'income', label: 'Revenu', color: theme.income },
        ]}
      />
      <Field label="Montant">
        <AmountInput value={amount} onChangeText={setAmount} suffix={currency} autoFocus={!existing} style={{ fontSize: 22, fontWeight: '700' }} />
      </Field>
      <Field label="Catégorie">
        <CategoryGrid categories={available} value={effectiveCategory} onChange={setCategoryId} />
      </Field>
      <Field label="Date">
        <DateField value={date} onChange={(d) => d && setDate(d)} />
      </Field>
      <Field label="Note (facultatif)">
        <Input value={note} onChangeText={setNote} placeholder="Ex. courses du samedi" maxLength={80} />
      </Field>
      <Button title="Enregistrer" icon="checkmark" onPress={save} disabled={!valid} />
      {existing ? <Button title="Supprimer" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}
