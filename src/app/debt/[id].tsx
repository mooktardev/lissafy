import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

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
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
  StatTile,
  T,
  ToggleRow,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { addMonths, currentMonth, formatDate, formatMonth, today } from '@/lib/dates';
import { amortizationSchedule, debtBalance, debtProgress, monthlyInterest, round2 } from '@/lib/finance';
import { amountToInput, formatDuration, formatMoney, formatPercent, parseAmount } from '@/lib/format';
import type { ISODate } from '@/lib/types';
import { useStore } from '@/store';

export default function DebtDetail() {
  const theme = useTheme();
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  const debt = useStore((s) => s.debts.find((d) => d.id === id));
  const addDebtPayment = useStore((s) => s.addDebtPayment);
  const deleteDebtPayment = useStore((s) => s.deleteDebtPayment);
  const deleteDebt = useStore((s) => s.deleteDebt);

  const [amount, setAmount] = useState(amountToInput(debt?.monthlyPayment ?? 0));
  const [date, setDate] = useState<ISODate>(today());
  const [record, setRecord] = useState(true);
  const [extra, setExtra] = useState('');
  const [showAll, setShowAll] = useState(false);

  if (!debt) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Dette introuvable" />
      </Screen>
    );
  }

  const money = (n: number) => formatMoney(n, currency);
  const balance = debtBalance(debt);
  const schedule = amortizationSchedule(balance, debt.annualRate, debt.monthlyPayment);
  const maxPayment = round2(balance + monthlyInterest(balance, debt.annualRate));
  const value = parseAmount(amount);
  const valid = Number.isFinite(value) && value > 0 && value <= maxPayment;

  const extraValue = parseAmount(extra);
  const withExtra =
    Number.isFinite(extraValue) && extraValue > 0
      ? amortizationSchedule(balance, debt.annualRate, debt.monthlyPayment + extraValue)
      : null;

  const submit = () => {
    if (!valid) return;
    addDebtPayment(debt.id, value, date, record);
    setAmount(amountToInput(Math.min(debt.monthlyPayment, maxPayment)));
  };

  const remove = async () => {
    if (await confirm(`Supprimer « ${debt.name} » ?`, 'La dette et son historique seront supprimés. Les dépenses déjà enregistrées restent dans votre activité.')) {
      deleteDebt(debt.id);
      router.back();
    }
  };

  const payments = [...debt.payments].sort((a, b) => b.date.localeCompare(a.date));
  const rows = showAll ? schedule.rows : schedule.rows.slice(0, 12);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: debt.name,
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Modifier"
              onPress={() => router.push({ pathname: '/debt-edit', params: { id: debt.id } })}
            />
          ),
        }}
      />

      <Card style={{ gap: Spacing.md }}>
        <T variant="caption" tone="secondary">
          Capital restant dû
        </T>
        <T variant="amountLarge" tone={balance > 0 ? 'expense' : 'income'}>
          {money(balance)}
        </T>
        <ProgressBar ratio={debtProgress(debt)} color={theme.income} height={10} />
        <T variant="caption" tone="secondary">
          {formatPercent(debtProgress(debt))} remboursé sur {money(debt.originalAmount)}
        </T>
      </Card>

      <Row gap={Spacing.md}>
        <StatTile label="Mensualité" value={money(debt.monthlyPayment)} />
        <StatTile label="Taux annuel" value={formatPercent(debt.annualRate / 100, 2)} />
      </Row>
      {balance > 0 ? (
        <Row gap={Spacing.md}>
          <StatTile
            label="Fin estimée"
            value={schedule.paysOff ? formatMonth(addMonths(currentMonth(), schedule.rows.length)) : 'Jamais'}
            tone={schedule.paysOff ? 'default' : 'expense'}
          />
          <StatTile label="Intérêts restants" value={schedule.paysOff ? money(schedule.totalInterest) : '—'} tone="expense" />
        </Row>
      ) : null}
      {!schedule.paysOff ? (
        <T tone="expense">La mensualité ne couvre pas les intérêts mensuels : augmentez-la pour faire baisser la dette.</T>
      ) : null}

      {balance > 0 ? (
        <>
          <SectionHeader title="Enregistrer un paiement" />
          <Card style={{ gap: Spacing.md }}>
            <Field label="Montant" hint={`Intérêts du mois estimés : ${money(monthlyInterest(balance, debt.annualRate))}`}>
              <AmountInput value={amount} onChangeText={setAmount} suffix={currency} />
            </Field>
            <Field label="Date">
              <DateField value={date} onChange={(d) => d && setDate(d)} />
            </Field>
            <ToggleRow
              label="Enregistrer dans mes dépenses"
              hint={
                record
                  ? 'Ajoute une dépense « Remboursements » à la date du paiement.'
                  : 'Paiement enregistré uniquement sur la dette (déjà saisi ailleurs).'
              }
              value={record}
              onChange={setRecord}
            />
            <Button title="Enregistrer le paiement" icon="checkmark" onPress={submit} disabled={!valid} />
          </Card>

          <SectionHeader title="Et si je remboursais plus ?" />
          <Card style={{ gap: Spacing.md }}>
            <Field label="Supplément mensuel">
              <AmountInput value={extra} onChangeText={setExtra} suffix={currency} placeholder="Ex. 50" />
            </Field>
            {withExtra && withExtra.paysOff && schedule.paysOff ? (
              <T>
                Remboursée{' '}
                <T variant="bodyBold" tone="income">
                  {formatDuration(schedule.rows.length - withExtra.rows.length)} plus tôt
                </T>
                , avec{' '}
                <T variant="bodyBold" tone="income">
                  {money(schedule.totalInterest - withExtra.totalInterest)}
                </T>{' '}
                d&apos;intérêts économisés.
              </T>
            ) : withExtra && withExtra.paysOff ? (
              <T>Avec ce supplément, la dette serait remboursée en {formatDuration(withExtra.rows.length)}.</T>
            ) : null}
          </Card>
        </>
      ) : null}

      {payments.length > 0 ? (
        <>
          <SectionHeader title="Paiements enregistrés" />
          <Card style={{ paddingVertical: Spacing.xs }}>
            {payments.map((p, i) => (
              <View key={p.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ paddingVertical: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <T>{formatDate(p.date)}</T>
                    <T variant="caption" tone="secondary">
                      dont {money(p.interest)} d&apos;intérêts
                    </T>
                  </View>
                  <T variant="amount">{money(p.amount)}</T>
                  <IconButton
                    icon="trash-outline"
                    label="Supprimer le paiement"
                    size={18}
                    color={theme.textSecondary}
                    onPress={async () => {
                      if (await confirm('Supprimer ce paiement ?', `${money(p.amount)} le ${formatDate(p.date)}. La dépense associée sera aussi supprimée.`)) {
                        deleteDebtPayment(debt.id, p.id);
                      }
                    }}
                  />
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {schedule.rows.length > 0 ? (
        <>
          <SectionHeader title="Échéancier prévisionnel" />
          <Card style={{ paddingVertical: Spacing.sm }}>
            <Row style={{ paddingVertical: Spacing.xs }}>
              <T variant="caption" tone="secondary" style={{ flex: 1.3 }}>
                Mois
              </T>
              <T variant="caption" tone="secondary" style={{ flex: 1, textAlign: 'right' }}>
                Intérêts
              </T>
              <T variant="caption" tone="secondary" style={{ flex: 1, textAlign: 'right' }}>
                Capital
              </T>
              <T variant="caption" tone="secondary" style={{ flex: 1.2, textAlign: 'right' }}>
                Restant
              </T>
            </Row>
            {rows.map((r) => (
              <View key={r.index}>
                <Divider />
                <Row style={{ paddingVertical: Spacing.xs }}>
                  <T variant="caption" style={{ flex: 1.3 }}>
                    {formatMonth(addMonths(currentMonth(), r.index))}
                  </T>
                  <T variant="caption" tone="expense" style={{ flex: 1, textAlign: 'right' }}>
                    {money(r.interest)}
                  </T>
                  <T variant="caption" style={{ flex: 1, textAlign: 'right' }}>
                    {money(r.principal)}
                  </T>
                  <T variant="caption" style={{ flex: 1.2, textAlign: 'right' }}>
                    {money(r.balance)}
                  </T>
                </Row>
              </View>
            ))}
          </Card>
          {schedule.rows.length > 12 ? (
            <Button
              title={showAll ? 'Réduire' : `Afficher les ${schedule.rows.length} mois`}
              variant="ghost"
              onPress={() => setShowAll(!showAll)}
            />
          ) : null}
        </>
      ) : null}

      <Button title="Supprimer la dette" icon="trash-outline" variant="danger" onPress={remove} />
    </Screen>
  );
}
