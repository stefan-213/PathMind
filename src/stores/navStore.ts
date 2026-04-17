/**
 * 导航状态 Store - 使用 Zustand
 */
import { create } from 'zustand';

const STORAGE_KEY = 'pathmind-nav-expanded';

interface NavState {
  isNavExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
  toggleNav: () => void;
}

// 从 localStorage 读取初始值
const getInitialState = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const useNavStore = create<NavState>()((set) => ({
  isNavExpanded: getInitialState(),

  setNavExpanded: (expanded) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(expanded));
    } catch {
      // ignore
    }
    set({ isNavExpanded: expanded });
  },

  toggleNav: () => {
    try {
      const newValue = !useNavStore.getState().isNavExpanded;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      set({ isNavExpanded: newValue });
    } catch {
      // ignore
    }
  },
}));
