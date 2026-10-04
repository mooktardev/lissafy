import { describe, expect, it } from '@jest/globals';

import { addMonths, isValidISODate, monthsBetween } from '../dates';
import {
  amortizationSchedule,
  averageMonthlyNet,
  budgetStatuses,
  compoundProjection,
  debtBalance,
  goalMonthlyNeeded,
  loanPayment,
  monthSummary,
  monthsToReach,
  spendingByCategory,
} from '../finance';
import { formatDuration, parseAmount } from '../format';
import type { Debt, Goal, Transaction } from '../types';

const tx = (date: string, kind: Transaction['kind'], amount: number, categoryId = 'c'): Transaction => ({
  id: `${date}-${kind}-${amount}-${categoryId}`,
  date,
  kind,
  amount,
  categoryId,
  note: '',
});

describe('dates', () => {
  it('ajoute des mois en franchissant les années', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('calcule l’écart en mois', () => {
    expect(monthsBetween('2026-10', '2027-03')).toBe(5);
  });

  it('valide les dates ISO', () => {
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('26-2-1')).toBe(false);
  });
});

describe('transactions', () => {
  const list = [
    tx('2026-10-01', 'income', 2500, 'salary'),
    tx('2026-10-03', 'expense', 800, 'rent'),
    tx('2026-10-10', 'expense', 150, 'food'),
    tx('2026-10-20', 'expense', 100, 'food'),
    tx('2026-09-15', 'expense', 999, 'food'),
  ];

  it('résume le mois', () => {
    const s = monthSummary(list, '2026-10');
    expect(s.income).toBe(2500);
    expect(s.expense).toBe(1050);
    expect(s.net).toBe(1450);
    expect(s.savingsRate).toBeCloseTo(0.58);
  });

  it('taux d’épargne nul sans revenus', () => {
    expect(monthSummary(list, '2026-09').savingsRate).toBeNull();
  });

  it('regroupe les dépenses par catégorie, triées', () => {
    expect(spendingByCategory(list, '2026-10')).toEqual([
      { categoryId: 'rent', total: 800 },
      { categoryId: 'food', total: 250 },
    ]);
  });

  it('calcule l’état des budgets', () => {
    const [food] = budgetStatuses([{ categoryId: 'food', amount: 200 }], list, '2026-10');
    expect(food.spent).toBe(250);
    expect(food.remaining).toBe(-50);
    expect(food.ratio).toBeCloseTo(1.25);
  });

  it('moyenne du solde net en ignorant les mois vides', () => {
    // Mois précédant novembre : août (vide), septembre (-999), octobre (+1450)
    expect(averageMonthlyNet(list, '2026-11', 3)).toBeCloseTo((1450 - 999) / 2);
    expect(averageMonthlyNet([], '2026-11')).toBeNull();
  });
});

describe('objectifs', () => {
  const goal: Goal = {
    id: 'g',
    name: 'Vacances',
    target: 1200,
    deadline: '2027-03-15',
    icon: 'airplane',
    color: '#000',
    contributions: [{ id: 'c1', amount: 200, date: '2026-09-01' }],
    createdAt: '2026-09-01',
  };

  it('répartit le reste sur les mois jusqu’à l’échéance (mois courant inclus)', () => {
    // oct, nov, déc, janv, févr, mars = 6 mois ; reste 1000
    expect(goalMonthlyNeeded(goal, '2026-10-04')).toBeCloseTo(1000 / 6);
  });

  it('retourne 0 si atteint et null sans échéance', () => {
    expect(goalMonthlyNeeded({ ...goal, target: 100 }, '2026-10-04')).toBe(0);
    expect(goalMonthlyNeeded({ ...goal, deadline: null }, '2026-10-04')).toBeNull();
  });

  it('échéance passée : tout le reste est dû maintenant', () => {
    expect(goalMonthlyNeeded({ ...goal, deadline: '2026-01-01' }, '2026-10-04')).toBe(1000);
  });
});

describe('dettes', () => {
  it('calcule une mensualité standard', () => {
    // 10 000 à 5 % sur 36 mois ≈ 299,71
    expect(loanPayment(10000, 5, 36)).toBeCloseTo(299.71, 2);
    expect(loanPayment(1200, 0, 12)).toBe(100);
  });

  it('l’échéancier rembourse le prêt avec la mensualité calculée', () => {
    const payment = loanPayment(10000, 5, 36);
    const s = amortizationSchedule(10000, 5, payment);
    expect(s.paysOff).toBe(true);
    expect(s.rows).toHaveLength(36);
    expect(s.rows[s.rows.length - 1].balance).toBe(0);
    expect(s.totalInterest).toBeGreaterThan(780);
    expect(s.totalInterest).toBeLessThan(800);
  });

  it('détecte une mensualité insuffisante', () => {
    expect(amortizationSchedule(10000, 12, 50).paysOff).toBe(false);
  });

  it('déduit uniquement la part de capital des paiements', () => {
    const debt: Debt = {
      id: 'd',
      name: 'Prêt',
      originalAmount: 10000,
      startingBalance: 8000,
      annualRate: 6,
      monthlyPayment: 300,
      payments: [{ id: 'p', amount: 300, interest: 40, date: '2026-10-01' }],
      createdAt: '2026-10-01',
    };
    expect(debtBalance(debt)).toBe(7740);
  });
});

describe('simulateur', () => {
  it('sans rendement, la valeur égale les versements', () => {
    const points = compoundProjection({ initial: 1000, monthly: 100, annualRate: 0, years: 2 });
    expect(points).toHaveLength(3);
    expect(points[2].value).toBe(3400);
    expect(points[2].contributed).toBe(3400);
  });

  it('capitalise les intérêts', () => {
    const [, y1] = compoundProjection({ initial: 10000, monthly: 0, annualRate: 12, years: 1 });
    expect(y1.value).toBeCloseTo(10000 * Math.pow(1.01, 12), 1);
  });

  it('calcule le délai pour atteindre un montant', () => {
    expect(monthsToReach({ initial: 0, monthly: 100, annualRate: 0, target: 1000 })).toBe(10);
    expect(monthsToReach({ initial: 0, monthly: 0, annualRate: 0, target: 1 })).toBeNull();
  });
});

describe('format', () => {
  it('lit les montants au format français', () => {
    expect(parseAmount('1 234,56')).toBeCloseTo(1234.56);
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('abc')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
  });

  it('formate les durées', () => {
    expect(formatDuration(14)).toBe('1 an et 2 mois');
    expect(formatDuration(24)).toBe('2 ans');
    expect(formatDuration(5)).toBe('5 mois');
  });
});
