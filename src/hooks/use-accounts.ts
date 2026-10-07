import { accountBalance } from '@/lib/accounts';
import { today } from '@/lib/dates';
import { useStore } from '@/store';

/** Comptes avec leur solde du jour, et le total disponible. */
export function useAccountBalances() {
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const transfers = useStore((s) => s.transfers);
  const t = today();
  const balances = new Map(accounts.map((a) => [a.id, accountBalance(a, transactions, transfers, t)]));
  const total = [...balances.values()].reduce((sum, b) => sum + b, 0);
  return { accounts, balances, total };
}
