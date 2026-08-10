export type ChartStreamStage =
  | 'START'
  | 'ANALYZE_GOAL'
  | 'GENERATE_PLAN'
  | 'LOAD_CONTEXT'
  | 'BUILD_STRUCTURE'
  | 'GENERATE_XML'
  | 'VALIDATE_RESULT'
  | 'SAVE_RESULT'
  | 'DONE';

export type ChartStreamProgressState = {
  stage: ChartStreamStage;
  content: string;
  progress: number;
};

export type ChartStreamProgressEvent = {
  type?: string;
  content?: string;
  stage?: string;
  progress?: number;
  replace?: boolean;
};

const STAGE_COPY: Record<ChartStreamStage, string> = {
  START: '已连接生成任务',
  ANALYZE_GOAL: '正在分析目标信息',
  GENERATE_PLAN: '正在生成预览方案',
  LOAD_CONTEXT: '正在读取方案与目标',
  BUILD_STRUCTURE: '正在整理图表结构',
  GENERATE_XML: '正在生成 draw.io XML',
  VALIDATE_RESULT: '正在校验图表数据',
  SAVE_RESULT: '正在保存生成结果',
  DONE: '生成完成',
};

const STAGE_PROGRESS: Record<ChartStreamStage, number> = {
  START: 0,
  ANALYZE_GOAL: 10,
  GENERATE_PLAN: 70,
  LOAD_CONTEXT: 10,
  BUILD_STRUCTURE: 35,
  GENERATE_XML: 60,
  VALIDATE_RESULT: 85,
  SAVE_RESULT: 95,
  DONE: 100,
};

export const INITIAL_CHART_STREAM_PROGRESS: ChartStreamProgressState = {
  stage: 'START',
  content: STAGE_COPY.START,
  progress: STAGE_PROGRESS.START,
};

export const DONE_CHART_STREAM_PROGRESS: ChartStreamProgressState = {
  stage: 'DONE',
  content: STAGE_COPY.DONE,
  progress: STAGE_PROGRESS.DONE,
};

const isChartStreamStage = (value: unknown): value is ChartStreamStage =>
  typeof value === 'string' && value in STAGE_PROGRESS;

const clampProgress = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export const normalizeChartStreamProgress = (event: ChartStreamProgressEvent): ChartStreamProgressState => {
  const fallbackStage = event.type === 'done' ? DONE_CHART_STREAM_PROGRESS.stage : INITIAL_CHART_STREAM_PROGRESS.stage;
  const stage = isChartStreamStage(event.stage) ? event.stage : fallbackStage;
  const content = typeof event.content === 'string' && event.content.trim()
    ? event.content
    : STAGE_COPY[stage];
  const progress = typeof event.progress === 'number' && Number.isFinite(event.progress)
    ? clampProgress(event.progress)
    : STAGE_PROGRESS[stage];

  return { stage, content, progress };
};