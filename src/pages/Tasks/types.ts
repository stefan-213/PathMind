import type { Schedule } from '../../types/api';

export interface StageTaskViewModel {
  id: number | string;
  scheduleId: string;
  taskId?: string | number;
  timeText: string;
  taskTitle: string;
  status: number;
}

export interface StageViewModel {
  id: string;
  title: string;
  tasks: StageTaskViewModel[];
}