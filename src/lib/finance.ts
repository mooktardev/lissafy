import { addMonths, monthOf, monthsBetween } from './dates';
import type { Budget, Debt, Goal, ISODate, MonthKey, Transaction } from './types';

export const round2 = (n: number) => Math.round(n * 100) / 100;

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);

// ---------------------------------------------------------------------------
// Transactions & budgets
// ---------------------------------------------------------------------------

export type MonthSummary = {
  income: number;
  expense: number;
  net: number;
  /** Part des revenus épargnée (0–1), `null` sans revenus. */
  savingsRate: number | null;
};

export function transactionsOfMonth(transactions: Transaction[], month: MonthKey): Transaction[] {
  return transactions.filter((t) => monthOf(t.date) === month);
}

export function monthSummary(transactions: Transaction[], month: MonthKey): MonthSummary {
  const list = transactionsOfMonth(transactions, month);
  const income = sum(list.filter((t) => t.kind === 'income').map((t) => t.amount));
  const expense = sum(list.filter((t) => t.kind === 'expense').map((t) => t.amount));
  const net = income - expense;
  return { income, expense, net, savingsRate: income > 0 ? net / income : null };
}

export function spendingByCategory(
  transactions: Transaction[],
  month: MonthKey,
): { categoryId: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const t of transactionsOfMonth(transactions, month)) {
    if (t.kind !== 'expense') continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

export function monthlyHistory(
  transactions: Transaction[],
  endMonth: MonthKey,
  count: number,
): ({ month: MonthKey } & MonthSummary)[] {
  const months = Array.from({ length: count }, (_, i) => addMonths(endMonth, i - count + 1));
  return months.map((month) => ({ month, ...monthSummary(transactions, month) }));
}

/** Solde net moyen des `count` mois précédant `month` (mois sans transaction ignorés). */
export function averageMonthlyNet(transactions: Transaction[], month: MonthKey, count = 3): number | null {
  const history = monthlyHistory(transactions, addMonths(month, -1), count).filter(
    (m) => m.income > 0 || m.expense > 0,
  );
  if (history.length === 0) return null;
  return sum(history.map((m) => m.net)) / history.length;
}

export type BudgetStatus = {
  categoryId: string;
  limit: number;
  spent: number;
  remaining: number;
  /** spent / limit */
  ratio: number;
};

export function budgetStatuses(budgets: Budget[], transactions: Transaction[], month: MonthKey): BudgetStatus[] {
  const spent = new Map(spendingByCategory(transactions, month).map((s) => [s.categoryId, s.total]));
  return budgets
    .filter((b) => b.amount > 0)
    .map((b) => {
      const s = spent.get(b.categoryId) ?? 0;
      return {
        categoryId: b.categoryId,
        limit: b.amount,
        spent: s,
        remaining: b.amount - s,
        ratio: s / b.amount,
      };
    });
}

// ---------------------------------------------------------------------------
// Objectifs d'épargne
// ---------------------------------------------------------------------------

export function goalSaved(goal: Goal): number {
  return sum(goal.contributions.map((c) => c.amount));
}

export function goalProgress(goal: Goal): number {
  if (goal.target <= 0) return 0;
  return Math.min(1, Math.max(0, goalSaved(goal) / goal.target));
}

/**
 * Montant à mettre de côté chaque mois pour atteindre l'objectif à l'échéance.
 * Le mois en cours compte comme un mois disponible.
 * `null` si pas d'échéance, 0 si l'objectif est atteint.
 */
export function goalMonthlyNeeded(goal: Goal, from: ISODate): number | null {
  const remaining = goal.target - goalSaved(goal);
  if (remaining <= 0) return 0;
  if (!goal.deadline) return null;
  const months = Math.max(1, monthsBetween(monthOf(from), monthOf(goal.deadline)) + 1);
  return remaining / months;
}

// ---------------------------------------------------------------------------
// Dettes & prêts
// ---------------------------------------------------------------------------

export function monthlyInterest(balance: number, annualRate: number): number {
  return round2((balance * annualRate) / 100 / 12);
}

export function debtBalance(debt: Debt): number {
  const repaidPrincipal = sum(debt.payments.map((p) => p.amount - p.interest));
  return Math.max(0, round2(debt.startingBalance - repaidPrincipal));
}

export function debtProgress(debt: Debt): number {
  if (debt.originalAmount <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - debtBalance(debt) / debt.originalAmount));
}

/** Mensualité constante d'un prêt amortissable. */
export function loanPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0) return principal;
  const r = annualRate / 100 / 12;
  if (r === 0) return round2(principal / months);
  return round2((principal * r) / (1 - Math.pow(1 + r, -months)));
}

export type AmortizationRow = {
  index: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

export type AmortizationResult = {
  rows: AmortizationRow[];
  totalInterest: number;
  totalPaid: number;
  /** `false` si la mensualité ne couvre pas les intérêts (ou dépasse la limite). */
  paysOff: boolean;
};

export function amortizationSchedule(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  maxMonths = 600,
): AmortizationResult {
  const rows: AmortizationRow[] = [];
  let remaining = round2(balance);
  if (remaining <= 0) return { rows, totalInterest: 0, totalPaid: 0, paysOff: true };
  if (monthlyPayment <= monthlyInterest(remaining, annualRate)) {
    return { rows, totalInterest: 0, totalPaid: 0, paysOff: false };
  }
  for (let i = 1; i <= maxMonths && remaining > 0; i++) {
    const interest = monthlyInterest(remaining, annualRate);
    const payment = Math.min(monthlyPayment, round2(remaining + interest));
    const principal = round2(payment - interest);
    remaining = Math.max(0, round2(remaining - principal));
    rows.push({ index: i, payment, interest, principal, balance: remaining });
  }
  return {
    rows,
    totalInterest: round2(sum(rows.map((r) => r.interest))),
    totalPaid: round2(sum(rows.map((r) => r.payment))),
    paysOff: remaining <= 0,
  };
}

// ---------------------------------------------------------------------------
// Simulateur d'épargne
// ---------------------------------------------------------------------------

export type ProjectionPoint = {
  year: number;
  contributed: number;
  value: number;
};

/** Capitalisation mensuelle avec versements en fin de mois. */
export function compoundProjection(params: {
  initial: number;
  monthly: number;
  annualRate: number;
  years: number;
}): ProjectionPoint[] {
  const { initial, monthly, annualRate } = params;
  const years = Math.max(0, Math.floor(params.years));
  const r = annualRate / 100 / 12;
  const points: ProjectionPoint[] = [{ year: 0, contributed: initial, value: initial }];
  let value = initial;
  let contributed = initial;
  for (let m = 1; m <= years * 12; m++) {
    value = value * (1 + r) + monthly;
    contributed += monthly;
    if (m % 12 === 0) {
      points.push({ year: m / 12, contributed: round2(contributed), value: round2(value) });
    }
  }
  return points;
}

/** Nombre de mois pour atteindre `target` (null si jamais / plus de 100 ans). */
export function monthsToReach(params: {
  initial: number;
  monthly: number;
  annualRate: number;
  target: number;
}): number | null {
  const { initial, monthly, annualRate, target } = params;
  if (initial >= target) return 0;
  const r = annualRate / 100 / 12;
  let value = initial;
  for (let m = 1; m <= 1200; m++) {
    value = value * (1 + r) + monthly;
    if (value >= target) return m;
  }
  return null;
}
