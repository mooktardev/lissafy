import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { accountBalance, DEFAULT_ACCOUNT_ID, initialBalanceFor } from '@/lib/accounts';
import type { Account, Transaction, Transfer } from '@/lib/types';
import { initialData, normalizeData, useStore } from '@/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const acc = (id: string, initialBalance = 0): Account => ({
  id,
  name: id,
  type: 'bank',
  color: '#000',
  initialBalance,
  createdAt: '2026-01-01',
});
const tx = (accountId: string, kind: Transaction['kind'], amount: number, date = '2026-10-01'): Transaction => ({
  id: `${accountId}-${kind}-${amount}-${date}`,
  accountId,
  kind,
  amount,
  categoryId: 'c',
  date,
  note: '',
});

describe('solde des comptes', () => {
  const transfers: Transfer[] = [
    { id: 'tr', fromAccountId: 'bank', toAccountId: 'cash', amount: 100, date: '2026-10-02', note: '' },
  ];
  const txs = [tx('bank', 'income', 2000), tx('bank', 'expense', 500), tx('cash', 'expense', 30), tx('bank', 'expense', 999, '2026-12-01')];

  it('additionne solde de départ, revenus, dépenses et virements', () => {
    expect(accountBalance(acc('bank', 50), txs, transfers, '2026-10-31')).toBe(1450);
    expect(accountBalance(acc('cash'), txs, transfers, '2026-10-31')).toBe(70);
  });

  it('ignore les mouvements postérieurs à la date', () => {
    expect(accountBalance(acc('bank', 50), txs, transfers, '2026-10-01')).toBe(1550);
  });

  it('calcule le solde de départ pour atteindre un solde réel', () => {
    const initial = initialBalanceFor(acc('bank', 50), 1000, txs, transfers, '2026-10-31');
    expect(accountBalance(acc('bank', initial), txs, transfers, '2026-10-31')).toBe(1000);
  });
});

describe('migration vers les comptes', () => {
  it('crée un compte principal et y rattache les données existantes', () => {
    const data = normalizeData({
      transactions: [{ id: 't', kind: 'expense', amount: 10, categoryId: 'c', date: '2026-10-01', note: '' }],
      recurrings: [],
    });
    expect(data.accounts.map((a) => a.id)).toEqual([DEFAULT_ACCOUNT_ID]);
    expect(data.transactions[0].accountId).toBe(DEFAULT_ACCOUNT_ID);
    expect(data.transfers).toEqual([]);
  });

  it('rattache au premier compte les transactions d’un compte inconnu', () => {
    const data = normalizeData({ accounts: [acc('a'), acc('b')], transactions: [tx('zzz', 'income', 1)] });
    expect(data.transactions[0].accountId).toBe('a');
  });
});

describe('actions', () => {
  const s = () => useStore.getState();
  beforeEach(() => {
    useStore.setState(initialData());
  });

  it('supprimer un compte déplace ses transactions et supprime les virements devenus internes', () => {
    const cash = s().saveAccount({ name: 'Espèces', type: 'cash', color: '#000', initialBalance: 0 });
    s().saveTransaction(tx(cash, 'expense', 20));
    s().saveTransfer({ fromAccountId: DEFAULT_ACCOUNT_ID, toAccountId: cash, amount: 50, date: '2026-10-01', note: '' });
    s().deleteAccount(cash, DEFAULT_ACCOUNT_ID);
    expect(s().accounts).toHaveLength(1);
    expect(s().transactions[0].accountId).toBe(DEFAULT_ACCOUNT_ID);
    expect(s().transfers).toHaveLength(0);
  });

  it('les transactions générées sont rattachées à un compte', () => {
    s().saveRecurring({
      kind: 'expense',
      amount: 10,
      categoryId: 'c',
      note: '',
      frequency: 'monthly',
      startDate: '2026-09-01',
      endDate: null,
      active: true,
    });
    s().applyRecurring('2026-10-05');
    expect(s().transactions.every((t) => t.accountId === DEFAULT_ACCOUNT_ID)).toBe(true);
  });
});
