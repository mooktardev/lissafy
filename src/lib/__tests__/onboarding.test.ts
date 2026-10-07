import { describe, expect, it } from '@jest/globals';

import { roundNice, suggestBudgets } from '../onboarding';

describe('arrondi', () => {
  it('arrondit selon l’ordre de grandeur', () => {
    expect(roundNice(437)).toBe(440);
    expect(roundNice(43_720)).toBe(43_700);
    expect(roundNice(105_000)).toBe(105_000);
    expect(roundNice(7.4)).toBe(7);
    expect(roundNice(0)).toBe(0);
  });
});

describe('règle 50 / 30 / 20', () => {
  it('répartit un revenu en euros', () => {
    const plan = suggestBudgets(2000);
    expect([plan.needs, plan.wants, plan.savings]).toEqual([1000, 600, 400]);
    expect(plan.budgets.find((b) => b.categoryId === 'exp-housing')?.amount).toBe(500);
    expect(plan.budgets.find((b) => b.categoryId === 'exp-leisure')?.amount).toBe(210);
    expect(plan.emergencyFund).toBe(3000);
  });

  it('donne des montants ronds en francs CFA', () => {
    const plan = suggestBudgets(350_000);
    expect([plan.needs, plan.wants, plan.savings]).toEqual([175_000, 105_000, 70_000]);
    expect(plan.budgets.every((b) => b.amount % 100 === 0)).toBe(true);
  });

  it('les parts de chaque groupe totalisent 100 %', () => {
    const plan = suggestBudgets(10_000);
    const sum = (g: string) => plan.budgets.filter((b) => b.group === g).reduce((a, b) => a + b.amount, 0);
    expect(sum('needs')).toBe(5000);
    expect(sum('wants')).toBe(3000);
  });
});
