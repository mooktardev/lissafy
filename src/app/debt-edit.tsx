import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AmountInput, Button, Card, Field, Input, Row, Screen, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/use-theme';
import { addMonths, currentMonth, formatMonth } from '@/lib/dates';
import { amortizationSchedule, debtBalance, loanPayment } from '@/lib/finance';
import { amountToInput, formatDuration, formatMoney, parseAmount } from '@/lib/format';
import { useStore } from '@/store';

const num = (s: string) => {
  const v = parseAmount(s);
  return Number.isFinite(v) ? v : NaN;
};

export default function DebtEdit() {
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.debts.find((d) => d.id === id));
  const saveDebt = useStore((s) => s.saveDebt);
  const hasPayments = (existing?.payments.length ?? 0) > 0;

  const [name, setName] = useState(existing?.name ?? '');
  const [original, setOriginal] = useState(amountToInput(existing?.originalAmount ?? 0));
  const [balance, setBalance] = useState(amountToInput(existing?.startingBalance ?? 0));
  const [rate, setRate] = useState(amountToInput(existing?.annualRate ?? 0));
  const [payment, setPayment] = useState(amountToInput(existing?.monthlyPayment ?? 0));
  const [duration, setDuration] = useState('');

  const originalV = num(original);
  const balanceV = balance.trim() === '' ? originalV : num(balance);
  const rateV = rate.trim() === '' ? 0 : num(rate);
  const paymentV = num(payment);
  const valid =
    name.trim().length > 0 &&
    originalV > 0 &&
    balanceV >= 0 &&
    balanceV <= originalV &&
    rateV >= 0 &&
    paymentV > 0;

  const previewBalance = existing && hasPayments ? debtBalance({ ...existing, startingBalance: balanceV, annualRate: rateV }) : balanceV;
  const preview = valid ? amortizationSchedule(previewBalance, rateV, paymentV) : null;

  const computePayment = () => {
    const months = Math.round(num(duration));
    if (!(months > 0) || !(balanceV > 0)) return;
    setPayment(amountToInput(loanPayment(balanceV, rateV, months)));
  };

  const save = () => {
    if (!valid) return;
    saveDebt({
      id: existing?.id,
      name: name.trim(),
      originalAmount: originalV,
      startingBalance: balanceV,
      annualRate: rateV,
      monthlyPayment: paymentV,
    });
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier la dette' : 'Nouvelle dette' }} />
      <Field label="Nom">
        <Input value={name} onChangeText={setName} placeholder="Ex. Prêt auto" maxLength={50} autoFocus={!existing} />
      </Field>
      <Field label="Montant emprunté">
        <AmountInput value={original} onChangeText={setOriginal} suffix={currency} />
      </Field>
      <Field
        label="Capital restant dû aujourd'hui"
        hint={hasPayments ? 'Capital au moment de la création, avant les paiements enregistrés dans l’app.' : 'Laissez vide si le prêt commence maintenant.'}>
        <AmountInput value={balance} onChangeText={setBalance} suffix={currency} placeholder={original || '0'} />
      </Field>
      <Field label="Taux annuel">
        <AmountInput value={rate} onChangeText={setRate} suffix="%" placeholder="0" />
      </Field>
      <Field label="Mensualité">
        <AmountInput value={payment} onChangeText={setPayment} suffix={currency} />
      </Field>
      <Card style={{ gap: Spacing.sm }}>
        <T variant="caption" tone="secondary">
          Vous ne connaissez pas la mensualité ? Calculez-la à partir de la durée restante.
        </T>
        <Row>
          <View style={{ flex: 1 }}>
            <Input value={duration} onChangeText={setDuration} keyboardType="number-pad" inputMode="numeric" placeholder="Durée" suffix="mois" />
          </View>
          <Button title="Calculer" variant="secondary" onPress={computePayment} />
        </Row>
      </Card>

      {preview ? (
        <Card style={{ gap: Spacing.xs }}>
          {preview.paysOff ? (
            <>
              <T variant="bodyBold">
                Remboursé en {formatDuration(preview.rows.length)} ({formatMonth(addMonths(currentMonth(), preview.rows.length))})
              </T>
              <T variant="caption" tone="secondary">
                Intérêts restants : {formatMoney(preview.totalInterest, currency)}
              </T>
            </>
          ) : (
            <T tone="expense">La mensualité ne couvre pas les intérêts : la dette ne diminuera jamais.</T>
          )}
        </Card>
      ) : null}
      {balanceV > originalV ? <T tone="expense">Le capital restant ne peut pas dépasser le montant emprunté.</T> : null}

      <Button title="Enregistrer" icon="checkmark" onPress={save} disabled={!valid} />
    </Screen>
  );
}
