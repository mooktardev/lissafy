import { useState } from 'react';
import { View } from 'react-native';

import { LineChart } from '@/components/charts';
import { AmountInput, Card, Chip, Field, Input, Row, Screen, SectionHeader, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { today } from '@/lib/dates';
import { averageMonthlyNet, compoundProjection, monthsToReach } from '@/lib/finance';
import { amountToInput, formatDuration, formatMoney, parseAmount } from '@/lib/format';
import { useStore } from '@/store';

const RATE_PRESETS = [
  { label: 'Livret ~3 %', rate: 3 },
  { label: 'Fonds euros ~2,5 %', rate: 2.5 },
  { label: 'Actions ~7 %', rate: 7 },
];

const num = (s: string) => {
  const v = parseAmount(s);
  return Number.isFinite(v) ? v : 0;
};

export default function Simulator() {
  const theme = useTheme();
  const currency = useCurrency();
  const transactions = useStore((s) => s.transactions);
  const avg = averageMonthlyNet(transactions, today().slice(0, 7));

  const [initial, setInitial] = useState('1000');
  const [monthly, setMonthly] = useState(amountToInput(avg && avg > 0 ? Math.round(avg) : 200));
  const [rate, setRate] = useState('3');
  const [years, setYears] = useState('10');
  const [target, setTarget] = useState('');

  const params = { initial: num(initial), monthly: num(monthly), annualRate: num(rate) };
  const yearCount = Math.min(60, Math.max(1, Math.round(num(years))));
  const points = compoundProjection({ ...params, years: yearCount });
  const final = points[points.length - 1];
  const interest = final.value - final.contributed;
  const targetValue = num(target);
  const reach = targetValue > 0 ? monthsToReach({ ...params, target: targetValue }) : null;

  const money = (n: number, compact?: boolean) => formatMoney(n, currency, { compact });

  return (
    <Screen>
      <Card style={{ gap: Spacing.md }}>
        <Row gap={Spacing.md}>
          <View style={{ flex: 1 }}>
            <Field label="Capital de départ">
              <AmountInput value={initial} onChangeText={setInitial} suffix={currency} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Versement mensuel">
              <AmountInput value={monthly} onChangeText={setMonthly} suffix={currency} />
            </Field>
          </View>
        </Row>
        <Row gap={Spacing.md}>
          <View style={{ flex: 1 }}>
            <Field label="Rendement annuel">
              <AmountInput value={rate} onChangeText={setRate} suffix="%" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Durée">
              <Input value={years} onChangeText={setYears} keyboardType="number-pad" inputMode="numeric" suffix="ans" />
            </Field>
          </View>
        </Row>
        <Row style={{ flexWrap: 'wrap' }}>
          {RATE_PRESETS.map((p) => (
            <Chip key={p.label} label={p.label} selected={num(rate) === p.rate} onPress={() => setRate(amountToInput(p.rate))} />
          ))}
        </Row>
        {avg !== null ? (
          <T variant="caption" tone="secondary">
            Votre épargne moyenne récente : {formatMoney(avg, currency, { sign: true })} / mois.
          </T>
        ) : null}
      </Card>

      <Card style={{ gap: Spacing.xs }}>
        <T variant="caption" tone="secondary">
          Capital dans {yearCount} an{yearCount > 1 ? 's' : ''}
        </T>
        <T variant="amountLarge" tone="income">
          {money(final.value)}
        </T>
      </Card>
      <Row gap={Spacing.md}>
        <StatTile label="Total versé" value={money(final.contributed)} />
        <StatTile label="Intérêts gagnés" value={money(interest)} tone="income" />
      </Row>

      <SectionHeader title="Projection" />
      <Card style={{ gap: Spacing.sm }}>
        <LineChart
          labels={points.map((p) => `${p.year}a`)}
          series={[
            { values: points.map((p) => p.value), color: theme.income, fill: true },
            { values: points.map((p) => p.contributed), color: theme.textSecondary },
          ]}
          formatValue={(v) => money(v, true)}
        />
        <Row gap={Spacing.lg} style={{ justifyContent: 'center' }}>
          <Row gap={Spacing.xs}>
            <View style={{ width: 12, height: 3, backgroundColor: theme.income }} />
            <T variant="caption" tone="secondary">
              Capital
            </T>
          </Row>
          <Row gap={Spacing.xs}>
            <View style={{ width: 12, height: 3, backgroundColor: theme.textSecondary }} />
            <T variant="caption" tone="secondary">
              Versements cumulés
            </T>
          </Row>
        </Row>
      </Card>

      <SectionHeader title="Atteindre un montant" />
      <Card style={{ gap: Spacing.md }}>
        <Field label="Montant visé">
          <AmountInput value={target} onChangeText={setTarget} suffix={currency} placeholder="Ex. 50 000" />
        </Field>
        {targetValue > 0 ? (
          <T tone={reach === null ? 'expense' : 'default'}>
            {reach === null
              ? 'Montant hors de portée avec ces paramètres (plus de 100 ans).'
              : reach === 0
                ? 'Déjà atteint avec votre capital de départ.'
                : `Atteint en ${formatDuration(reach)}.`}
          </T>
        ) : null}
      </Card>

      <T variant="caption" tone="secondary">
        Simulation indicative : capitalisation mensuelle, versements en fin de mois, hors fiscalité et inflation.
      </T>
    </Screen>
  );
}
