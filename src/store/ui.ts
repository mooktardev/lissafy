import { create } from 'zustand';

import { currentMonth } from '@/lib/dates';
import type { MonthKey } from '@/lib/types';

/** État d'interface non persistant, partagé entre les onglets. */
export const useUi = create<{ month: MonthKey; setMonth: (m: MonthKey) => void }>()((set) => ({
  month: currentMonth(),
  setMonth: (month) => set({ month }),
}));
