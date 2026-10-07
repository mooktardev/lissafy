import { create } from 'zustand';

/**
 * État du verrouillage (non persistant) : au démarrage l'application est
 * verrouillée si l'option est active.
 */
export const useLock = create<{
  unlocked: boolean;
  backgroundAt: number | null;
  unlock: () => void;
  lock: () => void;
  setBackgroundAt: (t: number | null) => void;
}>()((set) => ({
  unlocked: false,
  backgroundAt: null,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
  setBackgroundAt: (backgroundAt) => set({ backgroundAt }),
}));
