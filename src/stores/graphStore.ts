/**
 * 图表数据状态管理
 */
import { create } from 'zustand';
import type { GraphData } from '../types/graph';

interface GraphState {
  /** 当前图表数据（AI 返回什么就存什么） */
  graphData: GraphData | null;
  /** 加载状态 */
  isLoading: boolean;

  /** 设置图表数据 */
  setGraphData: (data: GraphData | null) => void;
  /** 清空图表 */
  clearGraph: () => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graphData: null,
  isLoading: false,

  setGraphData: (data) => set({ graphData: data }),

  clearGraph: () => set({ graphData: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));
