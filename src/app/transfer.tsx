import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AccountPicker, DateField } from '@/components/pickers';
import { AmountInput, Button, confirm, Field, Input, Row, Screen, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAccountBalances } from '@/hooks/use-accounts';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { today } from '@/lib/dates';
import { amountToInput, formatMoney, parseAmount } from '@/lib/format';
import type { ISODate } from '@/lib/types';
import { useStore } from '@/store';

export default function TransferForm() {
  const theme = useTheme();
  const currency = useCurrency();
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const { accounts, balances } = useAccountBalances();
  const existing = useStore((s) => s.transfers.find((t) => t.id === params.id));
  const saveTransfer = useStore((s) => s.saveTransfer);
  const deleteTransfer = useStore((s) => s.deleteTransfer);

  const initialFrom = existing?.fromAccountId ?? params.from ?? accounts[0]?.id ?? null;
  const [from, setFrom] = useState<string | null>(initialFrom);
  const [to, setTo] = useState<string | null>(existing?.toAccountId ?? accounts.find((a) => a.id !== initialFrom)?.id ?? null);
  const [amount, setAmount] = useState(amountToInput(existing?.amount ?? 0));
  const [date, setDate] = useState<ISODate>(existing?.date ?? today());
  const [note, setNote] = useState(existing?.note ?? '');

  const value = parseAmount(amount);
  const valid = from !== null && to !== null && from !== to && Number.isFinite(value) && value > 0;

  const changeFrom = (id: string) => {
    setFrom(id);
    if (to === id) setTo(accounts.find((a) => a.id !== id)?.id ?? null);
  };

  const save = () => {
    if (!valid || !from || !to) return;
    saveTransfer({ id: existing?.id, fromAccountId: from, toAccountId: to, amount: value, date, note: note.trim() });
    router.back();
  };

  const remove = async () => {
    if (!existing) return;
    if (await confirm('Supprimer le virement ?', 'Les soldes des deux comptes seront recalculés.')) {
      deleteTransfer(existing.id);
      router.back();
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier le virement' : 'Virement' }} />
      <Field label="Depuis" hint={from ? `Solde : ${formatMoney(balances.get(from) ?? 0, currency)}` : undefined}>
        <AccountPicker accounts={accounts} value={from} onChange={changeFrom} />
      </Field>
      <Row style={{ justifyContent: 'center' }}>
        <View style={{ backgroundColor: theme.primarySoft, borderRadius: 16, padding: 6 }}>
          <Ionicons name="arrow-down" size={18} color={theme.primaryText} />
        </View>
      </Row>
      <Field label="Vers" hint={to ? `Solde : ${formatMoney(balances.get(to) ?? 0, currency)}` : undefined}>
        <AccountPicker accounts={accounts} value={to} onChange={setTo} exclude={from} />
      </Field>
      <Field label="Montant">
        <AmountInput value={amount} onChangeText={setAmount} suffix={currency} autoFocus={!existing} />
      </Field>
      <Field label="Date">
        <DateField value={date} onChange={(d) => d && setDate(d)} />
      </Field>
      <Field label="Note (facultatif)">
        <Input icon="create-outline" value={note} onChangeText={setNote} placeholder="Ex. retrait au distributeur" maxLength={80} />
      </Field>
      <T variant="caption" tone="secondary">
        Un virement déplace de l’argent entre vos comptes : il ne compte ni comme dépense ni comme revenu.
      </T>
      <View style={{ gap: Spacing.md, marginTop: Spacing.sm }}>
        <Button title={existing ? 'Enregistrer' : 'Effectuer le virement'} icon="swap-horizontal" onPress={save} disabled={!valid} />
        {existing ? <Button title="Supprimer" icon="trash-outline" variant="danger" onPress={remove} /> : null}
      </View>
    </Screen>
  );
}
