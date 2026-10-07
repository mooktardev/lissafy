import { round2 } from './finance';
import type { Account, AccountType, IconName, ISODate, Transaction, Transfer } from './types';

export const ACCOUNT_TYPES: Record<AccountType, { label: string; icon: IconName }> = {
  bank: { label: 'Banque', icon: 'business' },
  cash: { label: 'Espèces', icon: 'cash' },
  mobile: { label: 'Mobile money', icon: 'phone-portrait' },
  savings: { label: 'Épargne', icon: 'wallet' },
  other: { label: 'Autre', icon: 'ellipsis-horizontal-circle' },
};

export const DEFAULT_ACCOUNT_ID = 'acc-main';

export const defaultAccount = (createdAt: ISODate): Account => ({
  id: DEFAULT_ACCOUNT_ID,
  name: 'Compte principal',
  type: 'bank',
  color: '#34C924',
  initialBalance: 0,
  createdAt,
});

/**
 * Solde d'un compte à une date (incluse) : solde de départ, plus les revenus,
 * moins les dépenses, plus ou moins les virements.
 */
export function accountBalance(
  account: Account,
  transactions: Transaction[],
  transfers: Transfer[],
  at: ISODate,
): number {
  let balance = account.initialBalance;
  for (const t of transactions) {
    if (t.accountId !== account.id || t.date > at) continue;
    balance += t.kind === 'income' ? t.amount : -t.amount;
  }
  for (const tr of transfers) {
    if (tr.date > at) continue;
    if (tr.fromAccountId === account.id) balance -= tr.amount;
    if (tr.toAccountId === account.id) balance += tr.amount;
  }
  return round2(balance);
}

/** Solde de départ à enregistrer pour que le solde à `at` vaille `target`. */
export function initialBalanceFor(
  account: Account,
  target: number,
  transactions: Transaction[],
  transfers: Transfer[],
  at: ISODate,
): number {
  const movements = accountBalance(account, transactions, transfers, at) - account.initialBalance;
  return round2(target - movements);
}
