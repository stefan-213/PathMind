export interface QuestionOption {
  text: string;
  icon: string;
}

export interface Question {
  question: string;
  options: QuestionOption[];
}

export interface PathNode {
  text: string;
  recommended?: boolean;
}

export interface ComparisonItem {
  dim: string;
  a: string;
  b: string;
}

export interface ScheduleItem {
  week: string;
  items: string[];
}

export interface ResultData {
  title: string;
  desc: string;
  path: string[];
  branch: PathNode[];
  comparison: ComparisonItem[];
  schedule: ScheduleItem[];
}

export interface UserProfile {
  goal: string;
  recommendTitle: string;
  answers: number[];
  createdAt: string;
}

export interface Task {
  id: string;
  week: string;
  day: string;
  title: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface UserProgress {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
}
