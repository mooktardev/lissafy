import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { today } from "@/lib/dates";
import { DEFAULT_CATEGORIES, SYSTEM_CATEGORIES, SYSTEM_CATEGORY_IDS } from "@/lib/defaults";
import { debtBalance, monthlyInterest, round2 } from "@/lib/finance";
import { newId } from "@/lib/format";
import { defaultAccount } from "@/lib/accounts";
import { dueOccurrences } from "@/lib/recurring";
import type {
    Account,
    Budget,
    Category,
    Contribution,
    Debt,
    Goal,
    ISODate,
    Recurring,
    Settings,
    Transaction,
    Transfer,
} from "@/lib/types";

export type AppData = {
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  recurrings: Recurring[];
  accounts: Account[];
  transfers: Transfer[];
};

type Actions = {
  updateSettings: (patch: Partial<Settings>) => void;

  /** Enregistre une transaction ; si elle est liée, la date et la note sont répercutées. */
  saveTransaction: (t: Omit<Transaction, "id"> & { id?: string }) => void;
  /** Supprime une transaction et, si elle est liée, le mouvement d'objectif ou le paiement. */
  deleteTransaction: (id: string) => void;

  saveCategory: (c: Omit<Category, "id"> & { id?: string }) => void;
  /** Supprime une catégorie et réaffecte ses transactions à `fallbackId`. */
  deleteCategory: (id: string, fallbackId: string) => void;

  setBudget: (categoryId: string, amount: number) => void;

  saveGoal: (
    g: Omit<Goal, "id" | "contributions" | "createdAt"> & { id?: string },
  ) => void;
  /** Supprime l'objectif ; ses transactions restent, sans lien. */
  deleteGoal: (id: string) => void;
  /**
   * Versement (> 0) ou retrait (< 0). Avec `record`, crée aussi la transaction
   * correspondante (dépense « Épargne » ou revenu « Retrait d'épargne »).
   */
  addContribution: (
    goalId: string,
    amount: number,
    date: ISODate,
    record?: boolean,
  ) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;

  saveDebt: (
    d: Omit<Debt, "id" | "payments" | "createdAt"> & { id?: string },
  ) => void;
  /** Supprime la dette ; ses transactions restent, sans lien. */
  deleteDebt: (id: string) => void;
  /** Avec `record`, crée aussi la dépense « Remboursements » correspondante. */
  addDebtPayment: (
    debtId: string,
    amount: number,
    date: ISODate,
    record?: boolean,
  ) => void;
  deleteDebtPayment: (debtId: string, paymentId: string) => void;

  /** Crée ou modifie une récurrence (les échéances passées ne sont pas regénérées). */
  saveRecurring: (
    r: Omit<Recurring, "id" | "lastGenerated"> & {
      id?: string;
      lastGenerated?: ISODate | null;
    },
  ) => string;
  /** Supprime la règle ; les transactions déjà créées sont conservées. */
  deleteRecurring: (id: string) => void;

  saveAccount: (a: Omit<Account, "id" | "createdAt"> & { id?: string }) => string;
  /** Supprime un compte et rattache ses transactions et virements à `fallbackId`. */
  deleteAccount: (id: string, fallbackId: string) => void;
  saveTransfer: (t: Omit<Transfer, "id"> & { id?: string }) => void;
  deleteTransfer: (id: string) => void;
  /** Crée les transactions des échéances arrivées jusqu'à `date` incluse. */
  applyRecurring: (date: ISODate) => void;

  importData: (data: AppData) => void;
  resetAll: () => void;
};

export type AppState = AppData & Actions;

export const initialData = (): AppData => ({
  settings: {
    currency: "EUR",
    themeMode: "system",
    lockEnabled: false,
    biometricEnabled: false,
    lockDelay: 0,
    lastBackupAt: null,
    backupSnoozedUntil: null,
  },
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  budgets: [],
  goals: [],
  debts: [],
  recurrings: [],
  accounts: [defaultAccount(today())],
  transfers: [],
});

/**
 * Met des données anciennes ou importées au format courant : catégories
 * système, compte par défaut, transactions et récurrences rattachées à un compte.
 */
export function normalizeData(data: Partial<AppData>): AppData {
  const merged: AppData = { ...initialData(), ...data };
  const accounts =
    Array.isArray(data.accounts) && data.accounts.length > 0
      ? data.accounts
      : [defaultAccount(today())];
  const fallback = accounts[0].id;
  const known = new Set(accounts.map((a) => a.id));
  const attach = <T extends { accountId?: string }>(x: T): T =>
    x.accountId && known.has(x.accountId) ? x : { ...x, accountId: fallback };
  return {
    ...merged,
    // Les réglages ajoutés au fil des versions prennent leur valeur par défaut.
    settings: { ...initialData().settings, ...data.settings },
    categories: withSystemCategories(merged.categories),
    accounts,
    transfers: Array.isArray(data.transfers) ? data.transfers : [],
    transactions: merged.transactions.map(attach),
    recurrings: merged.recurrings.map(attach),
  };
}

/** Ajoute les catégories système manquantes (données antérieures à leur création). */
export function withSystemCategories(categories: Category[]): Category[] {
  const missing = SYSTEM_CATEGORIES.filter(
    (sc) => !categories.some((c) => c.id === sc.id),
  );
  return missing.length ? [...categories, ...missing] : categories;
}

/** Retire le lien des transactions dont l'objectif ou la dette a été supprimé. */
function unlink(
  transactions: Transaction[],
  match: (link: NonNullable<Transaction["link"]>) => boolean,
): Transaction[] {
  return transactions.map((t) =>
    t.link && match(t.link) ? { ...t, link: undefined } : t,
  );
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
}

/** Clé utilisée avant le renommage de l'application (Planifin → Lissafy). */
const LEGACY_STORAGE_KEY = "planifin-data";

/**
 * AsyncStorage avec repli sur l'ancienne clé : les données enregistrées avant
 * le renommage sont relues une fois, puis réécrites sous la nouvelle clé.
 */
const storageWithLegacyFallback = {
  getItem: async (name: string) =>
    (await AsyncStorage.getItem(name)) ??
    (await AsyncStorage.getItem(LEGACY_STORAGE_KEY)),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialData(),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      saveTransaction: ({ id, ...rest }) =>
        set((s) => {
          const tx: Transaction = { id: id ?? newId(), ...rest };
          const link = tx.link;
          return {
            transactions: upsert(s.transactions, tx),
            // Une transaction liée garde le mouvement d'origine à la même date.
            goals:
              link?.type === "goal"
                ? s.goals.map((g) =>
                    g.id === link.goalId
                      ? {
                          ...g,
                          contributions: g.contributions.map((c) =>
                            c.id === link.contributionId
                              ? { ...c, date: tx.date }
                              : c,
                          ),
                        }
                      : g,
                  )
                : s.goals,
            debts:
              link?.type === "debt"
                ? s.debts.map((d) =>
                    d.id === link.debtId
                      ? {
                          ...d,
                          payments: d.payments.map((p) =>
                            p.id === link.paymentId ? { ...p, date: tx.date } : p,
                          ),
                        }
                      : d,
                  )
                : s.debts,
          };
        }),
      deleteTransaction: (id) =>
        set((s) => {
          const link = s.transactions.find((t) => t.id === id)?.link;
          return {
            transactions: s.transactions.filter((t) => t.id !== id),
            goals:
              link?.type === "goal"
                ? s.goals.map((g) =>
                    g.id === link.goalId
                      ? {
                          ...g,
                          contributions: g.contributions.filter(
                            (c) => c.id !== link.contributionId,
                          ),
                        }
                      : g,
                  )
                : s.goals,
            debts:
              link?.type === "debt"
                ? s.debts.map((d) =>
                    d.id === link.debtId
                      ? {
                          ...d,
                          payments: d.payments.filter(
                            (p) => p.id !== link.paymentId,
                          ),
                        }
                      : d,
                  )
                : s.debts,
          };
        }),

      saveCategory: ({ id, ...rest }) =>
        set((s) => ({
          categories: upsert(s.categories, { id: id ?? newId(), ...rest }),
        })),
      deleteCategory: (id, fallbackId) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          transactions: s.transactions.map((t) =>
            t.categoryId === id ? { ...t, categoryId: fallbackId } : t,
          ),
          budgets: s.budgets.filter((b) => b.categoryId !== id),
          recurrings: s.recurrings.map((r) =>
            r.categoryId === id ? { ...r, categoryId: fallbackId } : r,
          ),
        })),

      setBudget: (categoryId, amount) =>
        set((s) => {
          const others = s.budgets.filter((b) => b.categoryId !== categoryId);
          return {
            budgets: amount > 0 ? [...others, { categoryId, amount }] : others,
          };
        }),

      saveGoal: ({ id, ...rest }) =>
        set((s) => {
          const existing = id ? s.goals.find((g) => g.id === id) : undefined;
          const goal: Goal = existing
            ? { ...existing, ...rest }
            : { id: newId(), contributions: [], createdAt: today(), ...rest };
          return { goals: upsert(s.goals, goal) };
        }),
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          transactions: unlink(s.transactions, (l) => l.type === "goal" && l.goalId === id),
        })),
      addContribution: (goalId, amount, date, record = true) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id === goalId);
          if (!goal) return {};
          const c: Contribution = { id: newId(), amount, date };
          const tx: Transaction[] = record
            ? [
                {
                  id: newId(),
                  kind: amount >= 0 ? "expense" : "income",
                  amount: Math.abs(amount),
                  categoryId:
                    amount >= 0
                      ? SYSTEM_CATEGORY_IDS.savingsIn
                      : SYSTEM_CATEGORY_IDS.savingsOut,
                  date,
                  note: goal.name,
                  link: { type: "goal", goalId, contributionId: c.id },
                  accountId: s.accounts[0]?.id,
                },
              ]
            : [];
          return {
            categories: withSystemCategories(s.categories),
            goals: s.goals.map((g) =>
              g.id === goalId ? { ...g, contributions: [...g.contributions, c] } : g,
            ),
            transactions: [...s.transactions, ...tx],
          };
        }),
      deleteContribution: (goalId, contributionId) =>
        set((s) => ({
          transactions: s.transactions.filter(
            (t) =>
              !(t.link?.type === "goal" && t.link.contributionId === contributionId),
          ),
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  contributions: g.contributions.filter(
                    (c) => c.id !== contributionId,
                  ),
                }
              : g,
          ),
        })),

      saveDebt: ({ id, ...rest }) =>
        set((s) => {
          const existing = id ? s.debts.find((d) => d.id === id) : undefined;
          const debt: Debt = existing
            ? { ...existing, ...rest }
            : { id: newId(), payments: [], createdAt: today(), ...rest };
          return { debts: upsert(s.debts, debt) };
        }),
      deleteDebt: (id) =>
        set((s) => ({
          debts: s.debts.filter((d) => d.id !== id),
          transactions: unlink(s.transactions, (l) => l.type === "debt" && l.debtId === id),
        })),
      addDebtPayment: (debtId, amount, date, record = true) =>
        set((s) => {
          const debt = s.debts.find((d) => d.id === debtId);
          if (!debt) return {};
          const payment = {
            id: newId(),
            amount: round2(amount),
            interest: Math.min(
              amount,
              monthlyInterest(debtBalance(debt), debt.annualRate),
            ),
            date,
          };
          const tx: Transaction[] = record
            ? [
                {
                  id: newId(),
                  kind: "expense",
                  amount: payment.amount,
                  categoryId: SYSTEM_CATEGORY_IDS.debt,
                  date,
                  note: debt.name,
                  link: { type: "debt", debtId, paymentId: payment.id },
                  accountId: s.accounts[0]?.id,
                },
              ]
            : [];
          return {
            categories: withSystemCategories(s.categories),
            debts: s.debts.map((d) =>
              d.id === debtId ? { ...d, payments: [...d.payments, payment] } : d,
            ),
            transactions: [...s.transactions, ...tx],
          };
        }),
      deleteDebtPayment: (debtId, paymentId) =>
        set((s) => ({
          transactions: s.transactions.filter(
            (t) => !(t.link?.type === "debt" && t.link.paymentId === paymentId),
          ),
          debts: s.debts.map((d) =>
            d.id === debtId
              ? { ...d, payments: d.payments.filter((p) => p.id !== paymentId) }
              : d,
          ),
        })),

      saveRecurring: ({ id, lastGenerated, ...rest }) => {
        const ruleId = id ?? newId();
        set((s) => {
          const existing = s.recurrings.find((r) => r.id === ruleId);
          const rule: Recurring = {
            ...rest,
            id: ruleId,
            lastGenerated:
              lastGenerated !== undefined
                ? lastGenerated
                : (existing?.lastGenerated ?? null),
          };
          return { recurrings: upsert(s.recurrings, rule) };
        });
        return ruleId;
      },
      deleteRecurring: (id) =>
        set((s) => ({
          recurrings: s.recurrings.filter((r) => r.id !== id),
          // Les transactions passées restent, sans lien vers la règle supprimée.
          transactions: s.transactions.map((t) =>
            t.recurringId === id ? { ...t, recurringId: undefined } : t,
          ),
        })),
      applyRecurring: (date) =>
        set((s) => {
          const created: Transaction[] = [];
          const recurrings = s.recurrings.map((r) => {
            const due = dueOccurrences(r, date);
            if (due.length === 0) return r;
            for (const d of due) {
              created.push({
                id: newId(),
                kind: r.kind,
                amount: r.amount,
                categoryId: r.categoryId,
                accountId: r.accountId ?? s.accounts[0]?.id,
                note: r.note,
                date: d,
                recurringId: r.id,
              });
            }
            return { ...r, lastGenerated: due[due.length - 1] };
          });
          if (created.length === 0) return {};
          return { recurrings, transactions: [...s.transactions, ...created] };
        }),

      saveAccount: ({ id, ...rest }) => {
        const accountId = id ?? newId();
        set((s) => {
          const existing = s.accounts.find((a) => a.id === accountId);
          const account: Account = {
            createdAt: existing?.createdAt ?? today(),
            ...rest,
            id: accountId,
          };
          return { accounts: upsert(s.accounts, account) };
        });
        return accountId;
      },
      deleteAccount: (id, fallbackId) =>
        set((s) => {
          const move = <T extends { accountId?: string }>(x: T): T =>
            x.accountId === id ? { ...x, accountId: fallbackId } : x;
          return {
            accounts: s.accounts.filter((a) => a.id !== id),
            transactions: s.transactions.map(move),
            recurrings: s.recurrings.map(move),
            // Un virement vers le compte de repli devient sans objet.
            transfers: s.transfers
              .map((t) => ({
                ...t,
                fromAccountId: t.fromAccountId === id ? fallbackId : t.fromAccountId,
                toAccountId: t.toAccountId === id ? fallbackId : t.toAccountId,
              }))
              .filter((t) => t.fromAccountId !== t.toAccountId),
          };
        }),
      saveTransfer: ({ id, ...rest }) =>
        set((s) => ({
          transfers: upsert(s.transfers, { id: id ?? newId(), ...rest }),
        })),
      deleteTransfer: (id) =>
        set((s) => ({ transfers: s.transfers.filter((t) => t.id !== id) })),

      importData: (data) => set(normalizeData(data)),
      resetAll: () => set(initialData()),
    }),
    {
      name: "Lissafy-data",
      version: 4,
      // v2 : catégories système ; v3 : comptes et virements ; v4 : réglages de sécurité.
      migrate: (persisted, version) =>
        version < 4 ? normalizeData(persisted as Partial<AppData>) : (persisted as AppData),
      storage: createJSONStorage(() => storageWithLegacyFallback),
      partialize: ({
        settings,
        categories,
        transactions,
        budgets,
        goals,
        debts,
        recurrings,
        accounts,
        transfers,
      }): AppData => ({
        settings,
        categories,
        transactions,
        budgets,
        goals,
        debts,
        recurrings,
        accounts,
        transfers,
      }),
    },
  ),
);

export function selectData(s: AppState): AppData {
  const {
    settings,
    categories,
    transactions,
    budgets,
    goals,
    debts,
    recurrings,
    accounts,
    transfers,
  } = s;
  return {
    settings,
    categories,
    transactions,
    budgets,
    goals,
    debts,
    recurrings,
    accounts,
    transfers,
  };
}

/** Validation minimale d'un fichier de sauvegarde importé. */
export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.settings === "object" &&
    Array.isArray(v.categories) &&
    Array.isArray(v.transactions) &&
    Array.isArray(v.budgets) &&
    Array.isArray(v.goals) &&
    Array.isArray(v.debts)
  );
}
