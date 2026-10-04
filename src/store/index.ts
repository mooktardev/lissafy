import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CATEGORIES } from '@/lib/defaults';
import { debtBalance, monthlyInterest, round2 } from '@/lib/finance';
import { newId } from '@/lib/format';
import { today } from '@/lib/dates';
import type {
  Budget,
  Category,
  Contribution,
  Debt,
  Goal,
  ISODate,
  Settings,
  Transaction,
} from '@/lib/types';

export type AppData = {
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
};

type Actions = {
  updateSettings: (patch: Partial<Settings>) => void;

  saveTransaction: (t: Omit<Transaction, 'id'> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;

  saveCategory: (c: Omit<Category, 'id'> & { id?: string }) => void;
  /** Supprime une catégorie et réaffecte ses transactions à `fallbackId`. */
  deleteCategory: (id: string, fallbackId: string) => void;

  setBudget: (categoryId: string, amount: number) => void;

  saveGoal: (g: Omit<Goal, 'id' | 'contributions' | 'createdAt'> & { id?: string }) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, date: ISODate) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;

  saveDebt: (d: Omit<Debt, 'id' | 'payments' | 'createdAt'> & { id?: string }) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (debtId: string, amount: number, date: ISODate) => void;
  deleteDebtPayment: (debtId: string, paymentId: string) => void;

  importData: (data: AppData) => void;
  resetAll: () => void;
};

export type AppState = AppData & Actions;

export const initialData = (): AppData => ({
  settings: { currency: 'EUR', themeMode: 'system' },
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  budgets: [],
  goals: [],
  debts: [],
});

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialData(),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      saveTransaction: ({ id, ...rest }) =>
        set((s) => ({ transactions: upsert(s.transactions, { id: id ?? newId(), ...rest }) })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      saveCategory: ({ id, ...rest }) =>
        set((s) => ({ categories: upsert(s.categories, { id: id ?? newId(), ...rest }) })),
      deleteCategory: (id, fallbackId) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          transactions: s.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: fallbackId } : t)),
          budgets: s.budgets.filter((b) => b.categoryId !== id),
        })),

      setBudget: (categoryId, amount) =>
        set((s) => {
          const others = s.budgets.filter((b) => b.categoryId !== categoryId);
          return { budgets: amount > 0 ? [...others, { categoryId, amount }] : others };
        }),

      saveGoal: ({ id, ...rest }) =>
        set((s) => {
          const existing = id ? s.goals.find((g) => g.id === id) : undefined;
          const goal: Goal = existing
            ? { ...existing, ...rest }
            : { id: newId(), contributions: [], createdAt: today(), ...rest };
          return { goals: upsert(s.goals, goal) };
        }),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      addContribution: (goalId, amount, date) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const c: Contribution = { id: newId(), amount, date };
            return { ...g, contributions: [...g.contributions, c] };
          }),
        })),
      deleteContribution: (goalId, contributionId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) } : g,
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
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      addDebtPayment: (debtId, amount, date) =>
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== debtId) return d;
            const interest = Math.min(amount, monthlyInterest(debtBalance(d), d.annualRate));
            return { ...d, payments: [...d.payments, { id: newId(), amount: round2(amount), interest, date }] };
          }),
        })),
      deleteDebtPayment: (debtId, paymentId) =>
        set((s) => ({
          debts: s.debts.map((d) =>
            d.id === debtId ? { ...d, payments: d.payments.filter((p) => p.id !== paymentId) } : d,
          ),
        })),

      importData: (data) => set({ ...initialData(), ...data }),
      resetAll: () => set(initialData()),
    }),
    {
      name: 'planifin-data',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ settings, categories, transactions, budgets, goals, debts }): AppData => ({
        settings,
        categories,
        transactions,
        budgets,
        goals,
        debts,
      }),
    },
  ),
);

export function selectData(s: AppState): AppData {
  const { settings, categories, transactions, budgets, goals, debts } = s;
  return { settings, categories, transactions, budgets, goals, debts };
}

/** Validation minimale d'un fichier de sauvegarde importé. */
export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.settings === 'object' &&
    Array.isArray(v.categories) &&
    Array.isArray(v.transactions) &&
    Array.isArray(v.budgets) &&
    Array.isArray(v.goals) &&
    Array.isArray(v.debts)
  );
}
