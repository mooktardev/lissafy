import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SYSTEM_CATEGORY_IDS } from '@/lib/defaults';
import { monthSummary } from '@/lib/finance';
import { initialData, useStore, withSystemCategories } from '@/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const state = () => useStore.getState();

beforeEach(() => {
  useStore.setState(initialData());
  state().saveGoal({ name: 'Vacances', target: 1000, deadline: null, icon: 'airplane', color: '#000' });
  state().saveDebt({ name: 'Prêt auto', originalAmount: 5000, startingBalance: 5000, annualRate: 6, monthlyPayment: 200 });
});

const goal = () => state().goals[0];
const debt = () => state().debts[0];

describe('objectifs ↔ transactions', () => {
  it('un versement crée une dépense « Épargne » liée', () => {
    state().addContribution(goal().id, 300, '2026-10-02');
    const [tx] = state().transactions;
    expect(tx).toMatchObject({
      kind: 'expense',
      amount: 300,
      categoryId: SYSTEM_CATEGORY_IDS.savingsIn,
      note: 'Vacances',
      link: { type: 'goal', goalId: goal().id, contributionId: goal().contributions[0].id },
    });
  });

  it('un retrait crée un revenu « Retrait d’épargne »', () => {
    state().addContribution(goal().id, -50, '2026-10-02');
    expect(state().transactions[0]).toMatchObject({ kind: 'income', amount: 50, categoryId: SYSTEM_CATEGORY_IDS.savingsOut });
  });

  it('sans enregistrement, aucune transaction n’est créée', () => {
    state().addContribution(goal().id, 300, '2026-10-02', false);
    expect(state().transactions).toHaveLength(0);
    expect(goal().contributions).toHaveLength(1);
  });

  it('supprimer le mouvement supprime la transaction, et inversement', () => {
    state().addContribution(goal().id, 300, '2026-10-02');
    state().deleteContribution(goal().id, goal().contributions[0].id);
    expect(state().transactions).toHaveLength(0);

    state().addContribution(goal().id, 200, '2026-10-03');
    state().deleteTransaction(state().transactions[0].id);
    expect(goal().contributions).toHaveLength(0);
  });

  it('changer la date de la transaction change celle du mouvement', () => {
    state().addContribution(goal().id, 300, '2026-10-02');
    const tx = state().transactions[0];
    state().saveTransaction({ ...tx, date: '2026-10-09' });
    expect(goal().contributions[0].date).toBe('2026-10-09');
  });

  it('supprimer l’objectif conserve les transactions, sans lien', () => {
    state().addContribution(goal().id, 300, '2026-10-02');
    state().deleteGoal(goal().id);
    expect(state().transactions).toHaveLength(1);
    expect(state().transactions[0].link).toBeUndefined();
  });
});

describe('dettes ↔ transactions', () => {
  it('un paiement crée une dépense « Remboursements » liée', () => {
    state().addDebtPayment(debt().id, 200, '2026-10-05');
    expect(state().transactions[0]).toMatchObject({
      kind: 'expense',
      amount: 200,
      categoryId: SYSTEM_CATEGORY_IDS.debt,
      link: { type: 'debt', debtId: debt().id, paymentId: debt().payments[0].id },
    });
    // Intérêts du mois : 5000 × 6 % / 12 = 25
    expect(debt().payments[0].interest).toBe(25);
  });

  it('supprimer la transaction supprime le paiement (le capital remonte)', () => {
    state().addDebtPayment(debt().id, 200, '2026-10-05');
    state().deleteTransaction(state().transactions[0].id);
    expect(debt().payments).toHaveLength(0);
  });
});

describe('taux d’épargne', () => {
  it('les versements vers un objectif comptent comme de l’épargne', () => {
    state().saveTransaction({ kind: 'income', amount: 2000, categoryId: 'inc-salary', date: '2026-10-01', note: '' });
    state().saveTransaction({ kind: 'expense', amount: 1200, categoryId: 'exp-housing', date: '2026-10-02', note: '' });
    state().addContribution(goal().id, 300, '2026-10-03');
    const s = monthSummary(state().transactions, '2026-10');
    expect(s.net).toBe(500); // solde du compte
    expect(s.saved).toBe(300);
    expect(s.savingsRate).toBeCloseTo(0.4); // (2000 − 1200) / 2000
  });
});

describe('migration', () => {
  it('ajoute les catégories système manquantes sans doublon', () => {
    const cats = withSystemCategories([{ id: 'x', name: 'X', icon: 'home', color: '#000', kind: 'expense' }]);
    expect(cats.map((c) => c.id)).toContain(SYSTEM_CATEGORY_IDS.debt);
    expect(withSystemCategories(cats)).toBe(cats);
  });
});
