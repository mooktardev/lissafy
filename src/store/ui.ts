import { create } from 'zustand';

import { currentMonth } from '@/lib/dates';
import type { MonthKey } from '@/lib/types';

/** État d'interface non persistant, partagé entre les onglets. */
export const useUi = create<{
  month: MonthKey;
  setMonth: (m: MonthKey) => void;
  /** Dernier compte utilisé, proposé par défaut à la saisie suivante. */
  lastAccountId: string | null;
  setLastAccountId: (id: string) => void;
}>()((set) => ({
  month: currentMonth(),
  setMonth: (month) => set({ month }),
  lastAccountId: null,
  setLastAccountId: (lastAccountId) => set({ lastAccountId }),
}));
