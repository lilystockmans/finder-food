import { create } from 'zustand';
import type { MealEntry } from '../lib/db';

type Slot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
type ProfileSheet = 'target' | 'macros' | 'goal' | 'settings' | null;

interface AppState {
  entryOpen: boolean;
  entrySlot: Slot;
  editingMeal: MealEntry | null;
  profileSheet: ProfileSheet;
  viewDate: string;
  mealsRefreshKey: number;

  openEntry: (slot?: Slot) => void;
  closeEntry: () => void;
  setEditingMeal: (meal: MealEntry | null) => void;
  openProfileSheet: (sheet: ProfileSheet) => void;
  closeProfileSheet: () => void;
  setViewDate: (date: string) => void;
  refreshMeals: () => void;
}

function defaultSlot(): Slot {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 14) return 'Lunch';
  if (h < 18) return 'Dinner';
  return 'Snack';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const useAppStore = create<AppState>((set) => ({
  entryOpen: false,
  entrySlot: defaultSlot(),
  editingMeal: null,
  profileSheet: null,
  viewDate: todayStr(),
  mealsRefreshKey: 0,

  openEntry: (slot) =>
    set({ entryOpen: true, entrySlot: slot ?? defaultSlot() }),
  closeEntry: () => set({ entryOpen: false }),
  setEditingMeal: (meal) => set({ editingMeal: meal }),
  openProfileSheet: (sheet) => set({ profileSheet: sheet }),
  closeProfileSheet: () => set({ profileSheet: null }),
  setViewDate: (date) => set({ viewDate: date }),
  refreshMeals: () => set((s) => ({ mealsRefreshKey: s.mealsRefreshKey + 1 })),
}));
