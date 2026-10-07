import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ColorPicker } from '@/components/pickers';
import { AmountInput, Button, CategoryIcon, Chip, confirm, Field, Input, notify, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAccountBalances } from '@/hooks/use-accounts';
import { useCurrency } from '@/hooks/use-theme';
import { ACCOUNT_TYPES, initialBalanceFor } from '@/lib/accounts';
import { today } from '@/lib/dates';
import { PALETTE } from '@/lib/defaults';
import { amountToInput, parseAmount } from '@/lib/format';
import type { AccountType } from '@/lib/types';
import { useStore } from '@/store';

const COLORS = ['#34C924', ...PALETTE];

export default function AccountEdit() {
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accounts, balances } = useAccountBalances();
  const existing = accounts.find((a) => a.id === id);
  const transactions = useStore((s) => s.transactions);
  const transfers = useStore((s) => s.transfers);
  const saveAccount = useStore((s) => s.saveAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<AccountType>(existing?.type ?? 'bank');
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  // Pour un compte existant, on saisit le solde réel actuel : le solde de départ en est déduit.
  const [balance, setBalance] = useState(amountToInput(existing ? (balances.get(existing.id) ?? 0) : 0));

  const value = balance.trim() === '' ? 0 : parseAmount(balance);
  const valid = name.trim().length > 0 && Number.isFinite(value);

  const save = () => {
    if (!valid) return;
    const initialBalance = existing ? initialBalanceFor(existing, value, transactions, transfers, today()) : value;
    saveAccount({ id: existing?.id, name: name.trim(), type, color, initialBalance });
    router.back();
  };

  const remove = async () => {
    if (!existing) return;
    const fallback = accounts.find((a) => a.id !== existing.id);
    if (!fallback) {
      notify('Suppression impossible', 'Il doit rester au moins un compte.');
      return;
    }
    const count = transactions.filter((t) => t.accountId === existing.id).length;
    const message = count
      ? `${count} transaction${count > 1 ? 's seront rattachées' : ' sera rattachée'} à « ${fallback.name} ».`
      : 'Ce compte ne contient aucune transaction.';
    if (await confirm(`Supprimer « ${existing.name} » ?`, message)) {
      deleteAccount(existing.id, fallback.id);
      router.dismissTo('/accounts');
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier le compte' : 'Nouveau compte' }} />
      <Row style={{ justifyContent: 'center' }}>
        <CategoryIcon icon={ACCOUNT_TYPES[type].icon} color={color} size={56} />
      </Row>
      <Field label="Nom">
        <Input value={name} onChangeText={setName} placeholder="Ex. Orange Money, Banque, Portefeuille" maxLength={40} autoFocus={!existing} />
      </Field>
      <Field label="Type">
        <Row style={{ flexWrap: 'wrap' }}>
          {(Object.keys(ACCOUNT_TYPES) as AccountType[]).map((t) => (
            <Chip key={t} label={ACCOUNT_TYPES[t].label} icon={ACCOUNT_TYPES[t].icon} selected={type === t} onPress={() => setType(t)} />
          ))}
        </Row>
      </Field>
      <Field
        label={existing ? 'Solde actuel' : 'Solde de départ'}
        hint={
          existing
            ? 'Corrigez-le pour qu’il corresponde à votre relevé : l’historique reste inchangé.'
            : 'Le montant disponible aujourd’hui sur ce compte.'
        }>
        <AmountInput value={balance} onChangeText={setBalance} suffix={currency} placeholder="0" />
      </Field>
      <Field label="Couleur">
        <ColorPicker colors={COLORS} value={color} onChange={setColor} />
      </Field>
      <View style={{ gap: Spacing.md, marginTop: Spacing.sm }}>
        <Button title={existing ? 'Enregistrer' : 'Créer le compte'} icon="checkmark" onPress={save} disabled={!valid} />
        {existing && accounts.length > 1 ? (
          <Button title="Supprimer le compte" icon="trash-outline" variant="danger" onPress={remove} />
        ) : null}
      </View>
    </Screen>
  );
}
