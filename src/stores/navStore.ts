/**
 * 导航状态 Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

interface NavState {
  isNavExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
  toggleNav: () => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      isNavExpanded: false,

      setNavExpanded: (expanded) => set({ isNavExpanded: expanded }),

      toggleNav: () => set((state) => ({ isNavExpanded: !state.isNavExpanded })),
    }),
    {
      name: STORAGE_KEYS.NAV_EXPANDED,
    }
  )
);