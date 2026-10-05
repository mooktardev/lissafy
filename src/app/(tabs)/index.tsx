import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { BarChart, DonutChart } from "@/components/charts";
import { MonthSwitcher } from "@/components/pickers";
import { TransactionRow } from "@/components/transaction-row";
import {
    Button,
    Card,
    CategoryIcon,
    Divider,
    EmptyState,
    GradientCard,
    IconButton,
    ProgressBar,
    ProgressRing,
    QuickAction,
    Row,
    Screen,
    SectionHeader,
    T,
} from "@/components/ui";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useCurrency, useTheme } from "@/hooks/use-theme";
import {
    currentMonth,
    daysInMonth,
    formatMonthShort,
    today,
} from "@/lib/dates";
import {
    averageMonthlyNet,
    budgetStatuses,
    goalMonthlyNeeded,
    goalProgress,
    goalSaved,
    monthSummary,
    monthlyHistory,
    spendingByCategory,
    transactionsOfMonth,
} from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import { useStore } from "@/store";
import { useUi } from "@/store/ui";

function greeting() {
  const h = new Date().getHours();
  if (h < 5 || h >= 18) return "Bonsoir";
  return "Bonjour";
}

export default function Dashboard() {
  const theme = useTheme();
  const currency = useCurrency();
  const { month, setMonth } = useUi();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const goals = useStore((s) => s.goals);

  const money = (n: number, opts?: { sign?: boolean; compact?: boolean }) =>
    formatMoney(n, currency, opts);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const summary = monthSummary(transactions, month);
  const spending = spendingByCategory(transactions, month);
  const history = monthlyHistory(transactions, month, 6);
  const avgNet = averageMonthlyNet(transactions, month);
  const statuses = budgetStatuses(budgets, transactions, month);
  const recent = transactionsOfMonth(transactions, month)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const activeGoals = goals.filter((g) => goalProgress(g) < 1);

  const topSpending = spending.slice(0, 4);
  const otherSpending = spending.slice(4).reduce((a, s) => a + s.total, 0);

  // « Reste à dépenser » sur les catégories budgétées.
  const budgetTotal = statuses.reduce((a, b) => a + b.limit, 0);
  const budgetSpent = statuses.reduce((a, b) => a + b.spent, 0);
  const budgetLeft = budgetTotal - budgetSpent;
  const isCurrent = month === currentMonth();
  const daysLeft = isCurrent
    ? daysInMonth(month) - Number(today().slice(8, 10)) + 1
    : 0;
  const overBudget = statuses.filter((s) => s.ratio > 1).length;

  const savingsRate = summary.savingsRate;

  return (
<<<<<<< HEAD
    <Screen>
      {/* En-tête */}
      <Row style={{ marginTop: Spacing.sm }}>
        <View style={{ flex: 1 }}>
          <T variant="caption" tone="secondary">
            {greeting()} 👋
          </T>
          <T variant="title">Mon budget</T>
        </View>
        <IconButton
          icon="grid-outline"
          label="Outils"
          filled
          onPress={() => router.push("/tools")}
        />
        <IconButton
          icon="settings-outline"
          label="Réglages"
          filled
          onPress={() => router.push("/settings")}
        />
      </Row>

=======
    <Screen
      subtitle={`${greeting()} 👋`}
      title="Mon budget"
      right={
        <Row gap={Spacing.sm}>
          <IconButton icon="grid-outline" label="Outils" filled size={20} onPress={() => router.push('/tools')} />
          <IconButton icon="settings-outline" label="Réglages" filled size={20} onPress={() => router.push('/settings')} />
        </Row>
      }>
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
      {/* Carte principale */}
      <GradientCard style={{ gap: Spacing.md }}>
        <Row>
          <T
            variant="caption"
            tone="inverse"
            style={{ flex: 1, opacity: 0.85 }}
          >
            Solde du mois
          </T>
          <MonthSwitcher
            month={month}
            onChange={setMonth}
            variant="onGradient"
          />
        </Row>
        <T variant="hero" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
          {money(summary.net, { sign: true })}
        </T>
        <Row gap={Spacing.md}>
          <View style={styles.heroStat}>
<<<<<<< HEAD
            <View
              style={[
                styles.heroStatIcon,
                { backgroundColor: "rgba(61, 213, 152, 0.25)" },
              ]}
            >
              <Ionicons name="arrow-down" size={16} color="#7CF5C4" />
=======
            <View style={[styles.heroStatIcon, { backgroundColor: 'rgba(61, 213, 152, 0.25)' }]}>
              <Ionicons name="arrow-down" size={14} color="#7CF5C4" />
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
            </View>
            <View style={{ flex: 1 }}>
              <T variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
                Revenus
              </T>
              <T
                variant="amount"
                tone="inverse"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {money(summary.income)}
              </T>
            </View>
          </View>
          <View style={styles.heroStat}>
<<<<<<< HEAD
            <View
              style={[
                styles.heroStatIcon,
                { backgroundColor: "rgba(255, 107, 112, 0.25)" },
              ]}
            >
              <Ionicons name="arrow-up" size={16} color="#FFB4B6" />
=======
            <View style={[styles.heroStatIcon, { backgroundColor: 'rgba(255, 107, 112, 0.25)' }]}>
              <Ionicons name="arrow-up" size={14} color="#FFB4B6" />
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
            </View>
            <View style={{ flex: 1 }}>
              <T variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
                Dépenses
              </T>
              <T
                variant="amount"
                tone="inverse"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {money(summary.expense)}
              </T>
            </View>
          </View>
        </Row>
        {savingsRate !== null ? (
          <View style={{ gap: Spacing.sm }}>
            <Row>
              <T
                variant="caption"
                tone="inverse"
                style={{ flex: 1, opacity: 0.85 }}
              >
                Taux d&apos;épargne
              </T>
              <T
                variant="caption"
                tone="inverse"
                style={{ fontFamily: Fonts.bold }}
              >
                {formatPercent(savingsRate)}
              </T>
            </Row>
            <ProgressBar
              ratio={savingsRate}
              color={savingsRate >= 0 ? "#7CF5C4" : "#FFB4B6"}
              track="rgba(255,255,255,0.2)"
              height={6}
            />
          </View>
        ) : null}
      </GradientCard>

      {/* Actions rapides */}
      <Card style={{ paddingVertical: Spacing.md }}>
        <Row gap={Spacing.xs}>
          <QuickAction
            icon="remove-circle"
            label="Dépense"
            color={theme.expense}
            onPress={() =>
              router.push({
                pathname: "/transaction",
                params: { kind: "expense" },
              })
            }
          />
          <QuickAction
            icon="add-circle"
            label="Revenu"
            color={theme.income}
            onPress={() =>
              router.push({
                pathname: "/transaction",
                params: { kind: "income" },
              })
            }
          />
          <QuickAction
            icon="flag"
            label="Objectif"
            color={theme.primary}
            onPress={() => router.push("/goal-edit")}
          />
          <QuickAction
            icon="trending-up"
            label="Simuler"
            color="#D9822B"
            onPress={() => router.push("/simulator")}
          />
        </Row>
      </Card>

      {transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon="sparkles"
            title="Bienvenue dans Lissafy"
            message="Enregistrez vos revenus et dépenses, fixez des budgets et suivez vos objectifs d'épargne. Tout reste sur votre téléphone."
            action={
              <Button
                title="Ajouter ma première transaction"
                icon="add"
                onPress={() => router.push("/transaction")}
                style={{ marginTop: Spacing.sm, alignSelf: "stretch" }}
              />
            }
          />
        </Card>
      ) : null}

      {/* Reste à dépenser */}
      {budgetTotal > 0 ? (
        <Card onPress={() => router.navigate("/budget")}>
          <Row gap={Spacing.lg}>
            <ProgressRing
              ratio={budgetSpent / budgetTotal}
<<<<<<< HEAD
              color={
                budgetLeft < 0
                  ? theme.expense
                  : budgetSpent / budgetTotal > 0.85
                    ? theme.warning
                    : theme.primary
              }
              size={72}
              thickness={8}
            >
=======
              color={budgetLeft < 0 ? theme.expense : budgetSpent / budgetTotal > 0.85 ? theme.warning : theme.primary}
              size={60}
              thickness={6}>
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
              <T variant="caption" style={{ fontFamily: Fonts.bold }}>
                {formatPercent(budgetSpent / budgetTotal)}
              </T>
            </ProgressRing>
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="caption" tone="secondary">
                {budgetLeft >= 0 ? "Reste à dépenser" : "Budget dépassé de"}
              </T>
<<<<<<< HEAD
              <T
                variant="amountLarge"
                tone={budgetLeft < 0 ? "expense" : "default"}
                style={{ fontSize: 24 }}
              >
=======
              <T variant="amountLarge" tone={budgetLeft < 0 ? 'expense' : 'default'} style={{ fontSize: 20 }}>
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
                {money(Math.abs(budgetLeft))}
              </T>
              <T
                variant="caption"
                tone={overBudget > 0 ? "expense" : "secondary"}
              >
                {overBudget > 0
                  ? `${overBudget} catégorie${overBudget > 1 ? "s" : ""} en dépassement`
                  : isCurrent && budgetLeft > 0
                    ? `Soit ${money(budgetLeft / daysLeft)} / jour pendant ${daysLeft} j`
                    : `sur ${money(budgetTotal)} budgétés`}
              </T>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </Row>
        </Card>
      ) : null}

      {/* Dépenses par catégorie */}
      {spending.length > 0 ? (
        <>
          <SectionHeader title="Où va votre argent" />
          <Card>
            <Row
              gap={Spacing.lg}
              style={{ flexWrap: "wrap", justifyContent: "center" }}
            >
              <DonutChart
                size={120}
                thickness={14}
                data={[
                  ...topSpending.map((s) => ({
                    value: s.total,
                    color: catById.get(s.categoryId)?.color ?? "#64748B",
                  })),
                  ...(otherSpending > 0
                    ? [{ value: otherSpending, color: theme.textSecondary }]
                    : []),
                ]}
              >
                <T variant="caption" tone="secondary">
                  Dépensé
                </T>
                <T variant="bodyBold" style={{ fontFamily: Fonts.extrabold }}>
                  {money(summary.expense, { compact: true })}
                </T>
              </DonutChart>
              <View style={{ flex: 1, minWidth: 170, gap: Spacing.md }}>
                {topSpending.map((s) => {
                  const c = catById.get(s.categoryId);
                  return (
                    <Row key={s.categoryId} gap={Spacing.sm}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: c?.color },
                        ]}
                      />
                      <T
                        variant="caption"
                        style={{ flex: 1 }}
                        numberOfLines={1}
                      >
                        {c?.name ?? "Sans catégorie"}
                      </T>
                      <T variant="caption" style={{ fontFamily: Fonts.bold }}>
                        {formatPercent(s.total / summary.expense)}
                      </T>
                    </Row>
                  );
                })}
                {otherSpending > 0 ? (
                  <Row gap={Spacing.sm}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: theme.textSecondary },
                      ]}
                    />
                    <T variant="caption" style={{ flex: 1 }}>
                      Autres
                    </T>
                    <T variant="caption" style={{ fontFamily: Fonts.bold }}>
                      {formatPercent(otherSpending / summary.expense)}
                    </T>
                  </Row>
                ) : null}
              </View>
            </Row>
          </Card>
        </>
      ) : null}

      {/* Objectifs : carrousel */}
      {activeGoals.length > 0 ? (
        <>
          <SectionHeader
            title="Mes objectifs"
            action="Tout voir"
            onAction={() => router.navigate("/goals")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -Spacing.lg }}
<<<<<<< HEAD
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              gap: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          >
=======
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingVertical: Spacing.xs }}>
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
            {activeGoals.map((g) => {
              const needed = goalMonthlyNeeded(g, today());
              return (
                <Card
                  key={g.id}
                  style={styles.goalCard}
<<<<<<< HEAD
                  onPress={() =>
                    router.push({
                      pathname: "/goal/[id]",
                      params: { id: g.id },
                    })
                  }
                >
                  <Row style={{ justifyContent: "space-between" }}>
                    <CategoryIcon icon={g.icon} color={g.color} size={40} />
                    <ProgressRing
                      ratio={goalProgress(g)}
                      color={g.color}
                      size={44}
                      thickness={5}
                    >
                      <T
                        variant="caption"
                        style={{ fontSize: 11, fontFamily: Fonts.bold }}
                      >
=======
                  onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <CategoryIcon icon={g.icon} color={g.color} size={34} />
                    <ProgressRing ratio={goalProgress(g)} color={g.color} size={38} thickness={4}>
                      <T variant="caption" style={{ fontSize: 10, fontFamily: Fonts.bold }}>
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
                        {Math.round(goalProgress(g) * 100)}%
                      </T>
                    </ProgressRing>
                  </Row>
                  <T variant="bodyBold" numberOfLines={1}>
                    {g.name}
                  </T>
                  <View>
                    <T variant="amount">{money(goalSaved(g))}</T>
                    <T variant="caption" tone="secondary">
                      sur {money(g.target)}
                    </T>
                  </View>
                  {needed ? (
<<<<<<< HEAD
                    <View
                      style={[
                        styles.goalBadge,
                        { backgroundColor: `${g.color}1A` },
                      ]}
                    >
                      <T
                        variant="caption"
                        style={{
                          color: g.color,
                          fontFamily: Fonts.semibold,
                          fontSize: 12,
                        }}
                      >
=======
                    <View style={[styles.goalBadge, { backgroundColor: `${g.color}1A` }]}>
                      <T variant="caption" style={{ color: g.color, fontFamily: Fonts.semibold, fontSize: 11 }}>
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
                        {money(needed)} / mois
                      </T>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      {/* Évolution */}
      {history.some((h) => h.income > 0 || h.expense > 0) ? (
        <>
          <SectionHeader title="Sur 6 mois" />
          <Card style={{ gap: Spacing.md }}>
            {avgNet !== null ? (
              <Row gap={Spacing.sm}>
                <View
                  style={[
                    styles.insightIcon,
                    {
                      backgroundColor:
                        avgNet >= 0 ? theme.incomeSoft : theme.expenseSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name={avgNet >= 0 ? "trending-up" : "trending-down"}
                    size={16}
                    color={avgNet >= 0 ? theme.income : theme.expense}
                  />
                </View>
                <T variant="caption" tone="secondary" style={{ flex: 1 }}>
                  En moyenne{" "}
                  {avgNet >= 0 ? "vous épargnez" : "vous dépensez en trop"}{" "}
                  <T
                    variant="caption"
                    tone={avgNet >= 0 ? "income" : "expense"}
                    style={{ fontFamily: Fonts.bold }}
                  >
                    {money(Math.abs(avgNet))}
                  </T>{" "}
                  par mois.
                </T>
              </Row>
            ) : null}
            <BarChart
              data={history.map((h) => ({
                label: formatMonthShort(h.month),
                values: [
                  { value: h.income, color: theme.income },
                  { value: h.expense, color: theme.expense },
                ],
              }))}
              formatValue={(v) => money(v, { compact: true })}
            />
            <Row gap={Spacing.lg} style={{ justifyContent: "center" }}>
              <Row gap={Spacing.xs}>
                <View
                  style={[styles.legendDot, { backgroundColor: theme.income }]}
                />
                <T variant="caption" tone="secondary">
                  Revenus
                </T>
              </Row>
              <Row gap={Spacing.xs}>
                <View
                  style={[styles.legendDot, { backgroundColor: theme.expense }]}
                />
                <T variant="caption" tone="secondary">
                  Dépenses
                </T>
              </Row>
            </Row>
          </Card>
        </>
      ) : null}

      {/* Dernières transactions */}
      {recent.length > 0 ? (
        <>
          <SectionHeader
            title="Récemment"
            action="Tout voir"
            onAction={() => router.navigate("/transactions")}
          />
          <Card style={{ paddingVertical: Spacing.xs }}>
            {recent.map((t, i) => (
              <View key={t.id}>
<<<<<<< HEAD
                {i > 0 ? <Divider inset={58} /> : null}
                <TransactionRow
                  transaction={t}
                  category={catById.get(t.categoryId)}
                  showDate
                />
=======
                {i > 0 ? <Divider inset={50} /> : null}
                <TransactionRow transaction={t} category={catById.get(t.categoryId)} showDate />
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  heroStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
<<<<<<< HEAD
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  goalCard: { width: 190, gap: Spacing.md },
  goalBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
=======
  heroStatIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  goalCard: { width: 170, gap: Spacing.sm, padding: Spacing.md },
  goalBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  insightIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
>>>>>>> e6cf9706e9e0f5893dd474a69ab2f09cf3f2b5df
});
