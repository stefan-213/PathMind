import type { SubSchedule } from '../../../../types/api';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type PlanRecord = Record<string, unknown>;

export const QUICK_OPTIONS = [
  '帮我拆解这个任务的学习步骤',
  '推荐完成这个任务需要看的资料',
  '给我设计一个练习题',
  '如何判断这个任务已经完成',
];

export const isRecord = (value: unknown): value is PlanRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toText = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

export const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const splitDetails = (value: unknown) => {
  if (typeof value !== 'string') return [];
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/(第\d+(?:-\d+)?[天周])\s*\n\s*(?!第\d+(?:-\d+)?[天周])([^\n]+)/g, '$1-$2')
    .replace(/[，,；;]\s*(?=第\d+(?:-\d+)?[天周](?:\s*[-—－:：])?)/g, '\n')
    .split(/[；;\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
};

export const parseTaskText = (value: string, taskIndex: number) => {
  const text = value.trim();
  const match = text.match(/^(第\d+(?:-\d+)?[天周])\s*[-—－:：]\s*(.+)$/);

  if (match) {
    return {
      day: match[1],
      task: match[2].trim(),
    };
  }

  return {
    day: `第${taskIndex + 1}天`,
    task: text,
  };
};

export const expandTaskInputs = (inputs: unknown[]) =>
  inputs.flatMap(input => {
    if (typeof input === 'string') return splitDetails(input);

    if (isRecord(input)) {
      const taskText = toText(input.task ?? input.title ?? input.name);
      const splitItems = splitDetails(taskText);
      if (splitItems.length > 1) {
        return splitItems.map(task => ({
          ...input,
          id: undefined,
          day: undefined,
          task,
          status: 0,
          completedAt: null,
        }));
      }
    }

    return [input];
  });

export const normalizeTask = (
  taskInput: unknown,
  taskIndex: number,
  parentId: string,
  fallbackGoal: string,
): SubSchedule | null => {
  const fallbackId = `${parentId}-${taskIndex}`;

  if (typeof taskInput === 'string') {
    const { day, task } = parseTaskText(taskInput, taskIndex);
    return {
      id: fallbackId,
      parentId,
      day,
      task,
      taskGoal: fallbackGoal,
      status: 0,
      description: null,
      completedAt: null,
    };
  }

  if (!isRecord(taskInput)) return null;
  const task = toText(taskInput.task ?? taskInput.title ?? taskInput.name).trim();
  if (!task) return null;
  const parsedTask = parseTaskText(task, taskIndex);

  return {
    id: String(toNumber(taskInput.id, Number(fallbackId))),
    parentId: String(toNumber(taskInput.parentId, Number(parentId))),
    day: toText(taskInput.day, parsedTask.day),
    task: parsedTask.task,
    taskGoal: toText(taskInput.taskGoal ?? taskInput.goal ?? taskInput.week, fallbackGoal),
    description: toText(taskInput.description) || null,
    status: taskInput.status === 1 || taskInput.status === '1' || taskInput.status === true ? 1 : 0,
    completedAt: toText(taskInput.completedAt) || null,
  };
};