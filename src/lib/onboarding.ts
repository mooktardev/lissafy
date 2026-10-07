/**
 * Arrondit à une valeur « ronde » adaptée à l'ordre de grandeur, quelle que
 * soit la devise : 2 chiffres significatifs sous 10 000 (437 → 440), 3 au-delà
 * pour rester précis sur les gros montants (105 000 → 105 000, 43 720 → 43 700).
 */
export function roundNice(x: number): number {
  if (x <= 0) return 0;
  if (x < 10) return Math.round(x);
  const digits = x >= 10_000 ? 3 : 2;
  const step = Math.pow(10, Math.floor(Math.log10(x)) + 1 - digits);
  return Math.round(x / step) * step;
}

export type BudgetGroup = 'needs' | 'wants';

/** Répartition des besoins (50 %) et envies (30 %) entre les catégories par défaut. */
export const BUDGET_SPLIT: { categoryId: string; group: BudgetGroup; share: number }[] = [
  { categoryId: 'exp-housing', group: 'needs', share: 0.5 },
  { categoryId: 'exp-food', group: 'needs', share: 0.25 },
  { categoryId: 'exp-transport', group: 'needs', share: 0.1 },
  { categoryId: 'exp-bills', group: 'needs', share: 0.1 },
  { categoryId: 'exp-health', group: 'needs', share: 0.05 },
  { categoryId: 'exp-restaurant', group: 'wants', share: 0.35 },
  { categoryId: 'exp-leisure', group: 'wants', share: 0.35 },
  { categoryId: 'exp-shopping', group: 'wants', share: 0.3 },
];

export type BudgetPlan = {
  needs: number;
  wants: number;
  savings: number;
  budgets: { categoryId: string; group: BudgetGroup; amount: number }[];
  /** Fonds d'urgence conseillé : 3 mois de besoins essentiels. */
  emergencyFund: number;
};

/** Règle 50 / 30 / 20 : besoins, envies, épargne. */
export function suggestBudgets(income: number): BudgetPlan {
  const totals: Record<BudgetGroup, number> = { needs: roundNice(income * 0.5), wants: roundNice(income * 0.3) };
  const budgets = BUDGET_SPLIT.map(({ categoryId, group, share }) => ({
    categoryId,
    group,
    amount: roundNice(totals[group] * share),
  }));
  // L'écart d'arrondi va à la plus grosse catégorie du groupe : la somme reste exacte.
  for (const group of ['needs', 'wants'] as const) {
    const items = budgets.filter((b) => b.group === group);
    const drift = totals[group] - items.reduce((a, b) => a + b.amount, 0);
    const largest = items.reduce((max, b) => (b.amount > max.amount ? b : max));
    largest.amount += drift;
  }
  return {
    needs: totals.needs,
    wants: totals.wants,
    savings: roundNice(income * 0.2),
    budgets,
    emergencyFund: roundNice(totals.needs * 3),
  };
}
