import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/pickers';
import { AmountInput, Button, Card, CategoryIcon, Chip, Divider, Field, Input, Row, T, ToggleRow } from '@/components/ui';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ACCOUNT_TYPES } from '@/lib/accounts';
import { addMonths, currentMonth, formatDate, today } from '@/lib/dates';
import { amountToInput, CURRENCIES, formatMoney, parseAmount } from '@/lib/format';
import { suggestBudgets } from '@/lib/onboarding';
import type { AccountType, IconName, ISODate } from '@/lib/types';
import { useStore } from '@/store';

const STEPS = 5; // bienvenue, devise, revenus, compte, budgets (+ écran final)
const ACCOUNT_CHOICES: AccountType[] = ['bank', 'mobile', 'cash'];
const DEFAULT_NAMES: Record<AccountType, string> = {
  bank: 'Compte principal',
  mobile: 'Mobile money',
  cash: 'Espèces',
  savings: 'Épargne',
  other: 'Compte',
};

const num = (s: string) => {
  const v = parseAmount(s);
  return Number.isFinite(v) && v > 0 ? v : 0;
};

function Feature({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const theme = useTheme();
  return (
    <Row gap={Spacing.md} style={{ alignItems: 'flex-start' }}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={20} color={theme.primaryText} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyBold">{title}</T>
        <T variant="caption" tone="secondary">
          {text}
        </T>
      </View>
    </Row>
  );
}

export default function Onboarding() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const categories = store.categories;

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState(store.settings.currency);
  const [income, setIncome] = useState('');
  const [salaryAuto, setSalaryAuto] = useState(true);
  const [payday, setPayday] = useState<ISODate>(`${addMonths(currentMonth(), 1)}-01`);
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [balance, setBalance] = useState('');
  const [budgets, setBudgets] = useState<Record<string, string> | null>(null);
  const [budgetsFor, setBudgetsFor] = useState(0);
  const [applyBudgets, setApplyBudgets] = useState(true);
  const [emergencyGoal, setEmergencyGoal] = useState(true);

  const money = (n: number) => formatMoney(n, currency);
  const incomeValue = num(income);
  const plan = suggestBudgets(incomeValue);
  const name = accountName ?? DEFAULT_NAMES[accountType];
  const known = new Set(categories.map((c) => c.id));
  const planned = plan.budgets.filter((b) => known.has(b.categoryId));

  // Suggestions recalculées si le revenu change entre deux passages sur l'étape.
  const goTo = (next: number) => {
    if (next === 4 && (budgets === null || budgetsFor !== incomeValue)) {
      setBudgets(Object.fromEntries(planned.map((b) => [b.categoryId, amountToInput(b.amount)])));
      setBudgetsFor(incomeValue);
    }
    setStep(next);
  };

  const finish = () => {
    const s = useStore.getState();
    s.updateSettings({ currency });
    const account = s.accounts[0];
    if (account) {
      s.saveAccount({ id: account.id, name: name.trim() || DEFAULT_NAMES[accountType], type: accountType, color: account.color, initialBalance: num(balance) });
    }
    if (incomeValue > 0 && salaryAuto) {
      s.saveRecurring({
        kind: 'income',
        amount: incomeValue,
        categoryId: 'inc-salary',
        note: 'Salaire',
        frequency: 'monthly',
        startDate: payday,
        endDate: null,
        active: true,
        accountId: account?.id,
        // Le solde saisi inclut déjà les salaires reçus : seuls les prochains seront ajoutés.
        lastGenerated: today(),
      });
    }
    if (incomeValue > 0 && applyBudgets && budgets) {
      for (const [categoryId, value] of Object.entries(budgets)) s.setBudget(categoryId, num(value));
    }
    if (incomeValue > 0 && emergencyGoal && plan.savings > 0) {
      const months = Math.max(1, Math.ceil(plan.emergencyFund / plan.savings));
      s.saveGoal({
        name: "Fonds d'urgence",
        target: plan.emergencyFund,
        deadline: `${addMonths(currentMonth(), months)}-01`,
        icon: 'shield-checkmark',
        color: '#0284C7',
      });
    }
    s.updateSettings({ onboarded: true });
  };

  const skip = () => {
    if (step === 2) setIncome('');
    if (step === 3) setBalance('');
    if (step === 4) setApplyBudgets(false);
    goTo(step + 1);
  };

  const budgetCount = budgets ? Object.values(budgets).filter((v) => num(v) > 0).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top }}>
      {/* Progression et « Passer » */}
      <View style={styles.topBar}>
        {step > 0 && step <= STEPS ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={10} onPress={() => setStep(step - 1)}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <View style={styles.progress}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={[styles.progressPart, { backgroundColor: i <= Math.min(step, STEPS - 1) && step > 0 ? theme.primary : theme.cardMuted }]} />
          ))}
        </View>
        {step >= 1 && step <= 4 ? (
          <Pressable accessibilityRole="button" hitSlop={10} onPress={skip}>
            <T variant="caption" tone="secondary" style={{ fontFamily: Fonts.semibold }}>
              Passer
            </T>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAwareScrollView
        bottomOffset={Spacing.xl}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {step === 0 ? (
          <>
            <View style={[styles.hero, { backgroundColor: theme.primary }]}>
              <Ionicons name="wallet" size={44} color={theme.onPrimary} />
            </View>
            <View style={{ gap: Spacing.sm }}>
              <T variant="title" style={{ textAlign: 'center' }}>
                Bienvenue dans Lissafy
              </T>
              <T tone="secondary" style={{ textAlign: 'center' }}>
                Quelques questions pour préparer votre budget. Comptez une minute.
              </T>
            </View>
            <Card style={{ gap: Spacing.lg }}>
              <Feature icon="swap-vertical" title="Suivez vos dépenses" text="Revenus, dépenses et comptes au même endroit, mois après mois." />
              <Feature icon="pie-chart" title="Planifiez" text="Budgets par catégorie, objectifs d’épargne et remboursement de vos prêts." />
              <Feature icon="lock-closed" title="Restez maître de vos données" text="Tout reste sur ce téléphone : pas de compte, pas de serveur." />
            </Card>
            <Button title="Commencer" icon="arrow-forward" onPress={() => goTo(1)} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View style={{ gap: Spacing.xs }}>
              <T variant="title">Quelle est votre devise ?</T>
              <T tone="secondary">Elle sera utilisée pour tous les montants. Vous pourrez la changer dans les réglages.</T>
            </View>
            <Card style={{ paddingVertical: Spacing.xs }}>
              {CURRENCIES.map((c, i) => {
                const selected = c.code === currency;
                return (
                  <View key={c.code}>
                    {i > 0 ? <Divider /> : null}
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setCurrency(c.code)}
                      style={{ paddingVertical: Spacing.md }}>
                      <Row>
                        <View style={{ flex: 1 }}>
                          <T variant={selected ? 'bodyBold' : 'body'}>{c.label}</T>
                          <T variant="caption" tone="secondary">
                            {formatMoney(1234.5, c.code)}
                          </T>
                        </View>
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={selected ? theme.primaryText : theme.border}
                        />
                      </Row>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
            <Button title="Continuer" onPress={() => goTo(2)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <View style={{ gap: Spacing.xs }}>
              <T variant="title">Combien gagnez-vous par mois ?</T>
              <T tone="secondary">Revenu net, après impôts. Une estimation suffit : elle sert à proposer vos budgets.</T>
            </View>
            <AmountInput value={income} onChangeText={setIncome} suffix={currency} style={{ fontSize: 24, fontFamily: Fonts.bold }} autoFocus />
            {incomeValue > 0 ? (
              <Card style={{ gap: Spacing.lg }}>
                <ToggleRow
                  label="Ajouter mon salaire chaque mois"
                  hint="Il apparaîtra automatiquement dans vos revenus à chaque échéance."
                  value={salaryAuto}
                  onChange={setSalaryAuto}
                />
                {salaryAuto ? (
                  <Field label="Prochain versement" hint="Les salaires déjà reçus sont compris dans votre solde actuel.">
                    <DateField value={payday} onChange={(d) => d && setPayday(d)} />
                  </Field>
                ) : null}
              </Card>
            ) : null}
            <Button title="Continuer" onPress={() => goTo(3)} disabled={incomeValue <= 0} />
            <Button title="Je n’ai pas de revenu fixe" variant="ghost" onPress={skip} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <View style={{ gap: Spacing.xs }}>
              <T variant="title">Où est votre argent ?</T>
              <T tone="secondary">Votre compte principal. Vous pourrez en ajouter d’autres ensuite (espèces, mobile money…).</T>
            </View>
            <Row style={{ flexWrap: 'wrap' }}>
              {ACCOUNT_CHOICES.map((t) => (
                <Chip key={t} label={ACCOUNT_TYPES[t].label} icon={ACCOUNT_TYPES[t].icon} selected={accountType === t} onPress={() => setAccountType(t)} />
              ))}
            </Row>
            <Field label="Nom">
              <Input value={name} onChangeText={setAccountName} maxLength={40} />
            </Field>
            <Field label="Solde actuel" hint="Le montant disponible aujourd’hui sur ce compte.">
              <AmountInput value={balance} onChangeText={setBalance} suffix={currency} />
            </Field>
            <Button title="Continuer" onPress={() => goTo(4)} />
          </>
        ) : null}

        {step === 4 ? (
          incomeValue > 0 && budgets ? (
            <>
              <View style={{ gap: Spacing.xs }}>
                <T variant="title">Vos budgets</T>
                <T tone="secondary">Proposés selon la règle 50 / 30 / 20. Ajustez-les librement.</T>
              </View>
              <Card style={{ gap: Spacing.md }}>
                <View style={styles.splitBar}>
                  <View style={{ flex: 50, backgroundColor: '#0284C7' }} />
                  <View style={{ flex: 30, backgroundColor: '#D9822B' }} />
                  <View style={{ flex: 20, backgroundColor: theme.primary }} />
                </View>
                {[
                  { color: '#0284C7', label: 'Besoins · 50 %', value: plan.needs },
                  { color: '#D9822B', label: 'Envies · 30 %', value: plan.wants },
                  { color: theme.primary, label: 'Épargne · 20 %', value: plan.savings },
                ].map((g) => (
                  <Row key={g.label}>
                    <View style={[styles.legendDot, { backgroundColor: g.color }]} />
                    <T variant="caption" style={{ flex: 1 }}>
                      {g.label}
                    </T>
                    <T variant="caption" style={{ fontFamily: Fonts.bold }}>
                      {money(g.value)}
                    </T>
                  </Row>
                ))}
              </Card>
              <ToggleRow label="Créer ces budgets" value={applyBudgets} onChange={setApplyBudgets} />
              {applyBudgets ? (
                <Card style={{ paddingVertical: Spacing.xs }}>
                  {planned.map((b, i) => {
                    const c = categories.find((x) => x.id === b.categoryId);
                    if (!c) return null;
                    return (
                      <View key={b.categoryId}>
                        {i > 0 ? <Divider inset={48} /> : null}
                        <Row gap={Spacing.md} style={{ paddingVertical: Spacing.sm }}>
                          <CategoryIcon icon={c.icon} color={c.color} size={36} />
                          <View style={{ flex: 1 }}>
                            <T variant="bodyBold" numberOfLines={1}>
                              {c.name}
                            </T>
                            <T variant="caption" tone="secondary">
                              {b.group === 'needs' ? 'Besoin' : 'Envie'}
                            </T>
                          </View>
                          <View style={{ width: 130 }}>
                            <AmountInput
                              value={budgets[b.categoryId] ?? ''}
                              onChangeText={(v) => setBudgets({ ...budgets, [b.categoryId]: v })}
                              suffix={currency}
                              accessibilityLabel={`Budget ${c.name}`}
                            />
                          </View>
                        </Row>
                      </View>
                    );
                  })}
                </Card>
              ) : null}
              <Card>
                <ToggleRow
                  label="Créer un objectif « Fonds d’urgence »"
                  hint={`${money(plan.emergencyFund)}, soit 3 mois de dépenses essentielles, en mettant ${money(plan.savings)} de côté par mois.`}
                  value={emergencyGoal}
                  onChange={setEmergencyGoal}
                />
              </Card>
              <Button title="Continuer" onPress={() => goTo(5)} />
            </>
          ) : (
            <>
              <View style={{ gap: Spacing.xs }}>
                <T variant="title">Vos budgets</T>
                <T tone="secondary">
                  Sans revenu indiqué, pas de suggestion automatique. Vous pourrez fixer vos plafonds à tout moment dans l’onglet Budget.
                </T>
              </View>
              <Button title="Continuer" onPress={() => goTo(5)} />
            </>
          )
        ) : null}

        {step === 5 ? (
          <>
            <View style={[styles.hero, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={48} color={theme.onPrimary} />
            </View>
            <T variant="title" style={{ textAlign: 'center' }}>
              Tout est prêt !
            </T>
            <Card style={{ gap: Spacing.md }}>
              <Feature icon="cash-outline" title="Devise" text={CURRENCIES.find((c) => c.code === currency)?.label ?? currency} />
              <Feature icon={ACCOUNT_TYPES[accountType].icon} title={name} text={`Solde : ${money(num(balance))}`} />
              {incomeValue > 0 && salaryAuto ? (
                <Feature icon="repeat" title="Salaire" text={`${money(incomeValue)} chaque mois, à partir du ${formatDate(payday)}`} />
              ) : null}
              {incomeValue > 0 && applyBudgets && budgetCount > 0 ? (
                <Feature icon="pie-chart" title="Budgets" text={`${budgetCount} catégories suivies`} />
              ) : null}
              {incomeValue > 0 && emergencyGoal ? (
                <Feature icon="shield-checkmark" title="Fonds d’urgence" text={`Objectif de ${money(plan.emergencyFund)}`} />
              ) : null}
            </Card>
            <Button title="Découvrir mon budget" icon="arrow-forward" onPress={finish} />
            <Button
              title="Protéger l’app avec un code"
              icon="lock-closed"
              variant="secondary"
              onPress={() => {
                finish();
                router.push({ pathname: '/pin-setup', params: { mode: 'create' } });
              }}
            />
          </>
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  progressPart: { flex: 1, height: 5, borderRadius: 3 },
  content: { padding: Spacing.lg, gap: Spacing.lg, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  hero: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: Spacing.xl },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  splitBar: { flexDirection: 'row', height: 10, borderRadius: Radius.pill, overflow: 'hidden', gap: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});
