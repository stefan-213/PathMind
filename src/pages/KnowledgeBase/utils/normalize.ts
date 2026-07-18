/**
 * 知识库数据规范化工具
 * 解析和标准化知识库、知识库文件的 API 响应数据
 */

import type { KnowledgeBase, KnowledgeBaseFile } from '../../../types/api';
import { isRecord } from '../../../utils/typeGuards';

export type DataRecord = Record<string, unknown>;
export type KnowledgeBaseDialogMode = 'create' | 'rename';

export const getText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

export const getFirstText = (record: DataRecord, keys: string[], fallback = ''): string => {
  for (const key of keys) {
    const text = getText(record[key]);
    if (text) return text;
  }
  return fallback;
};

export const getNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

export const getArray = (record: DataRecord, keys: string[]): unknown[] => {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

export const hasKnowledgeBaseShape = (record: DataRecord): boolean =>
  [
    'id',
    'knowledgeBaseId',
    'kbId',
    'libraryId',
    'name',
    'title',
    'knowledgeBaseName',
    'files',
    'fileList',
  ].some((key) => record[key] !== undefined && record[key] !== null);

export const hasKnowledgeFileShape = (record: DataRecord): boolean =>
  [
    'id',
    'fileId',
    'documentId',
    'name',
    'fileName',
    'title',
    'size',
    'type',
  ].some((key) => record[key] !== undefined && record[key] !== null);

export const normalizeKnowledgeBaseFile = (
  value: unknown,
  index: number,
): KnowledgeBaseFile | null => {
  if (typeof value === 'string') {
    return {
      id: value,
      name: value,
    };
  }

  if (!isRecord(value) || !hasKnowledgeFileShape(value)) return null;

  const id = getFirstText(
    value,
    ['id', 'fileId', 'documentId', 'resourceId'],
    `file-${index + 1}`,
  );
  const name = getFirstText(
    value,
    ['name', 'fileName', 'title', 'originalName'],
    id || `文件 ${index + 1}`,
  );

  return {
    id,
    name,
    size: getNumber(value.size ?? value.fileSize),
    type: getFirstText(value, ['type', 'mimeType', 'extension']),
    createdAt: getFirstText(value, ['createdAt', 'createTime', 'uploadedAt']),
  };
};

export const normalizeKnowledgeBase = (
  value: unknown,
  index: number,
  fallbackName?: string,
): KnowledgeBase | null => {
  if (typeof value === 'string') {
    return {
      id: value,
      name: fallbackName || value,
      files: [],
    };
  }

  if (!isRecord(value) || !hasKnowledgeBaseShape(value)) return null;

  const id = getFirstText(
    value,
    ['id', 'knowledgeBaseId', 'kbId', 'libraryId'],
    `knowledge-base-${index + 1}`,
  );
  const name = getFirstText(
    value,
    ['name', 'title', 'knowledgeBaseName', 'libraryName'],
    fallbackName || `知识库 ${index + 1}`,
  );
  const fileValues = getArray(value, [
    'files',
    'fileList',
    'documents',
    'documentList',
    'children',
  ]);

  return {
    id,
    name,
    files: fileValues
      .map((fileValue, fileIndex) => normalizeKnowledgeBaseFile(fileValue, fileIndex))
      .filter((file): file is KnowledgeBaseFile => Boolean(file)),
    createdAt: getFirstText(value, ['createdAt', 'createTime']),
    updatedAt: getFirstText(value, ['updatedAt', 'updateTime']),
  };
};

export const getKnowledgeBaseArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  const directArray = getArray(value, [
    'items',
    'list',
    'records',
    'knowledgeBases',
    'knowledgeBaseList',
    'data',
  ]);

  if (directArray.length > 0) return directArray;

  if (value.data !== undefined) {
    return getKnowledgeBaseArray(value.data);
  }

  if (hasKnowledgeBaseShape(value)) return [value];

  const recordValues = Object.values(value);
  if (recordValues.some((item) => isRecord(item) && hasKnowledgeBaseShape(item))) {
    return recordValues;
  }

  return [];
};

export const normalizeKnowledgeBaseList = (value: unknown): KnowledgeBase[] =>
  getKnowledgeBaseArray(value)
    .map((item, index) => normalizeKnowledgeBase(item, index))
    .filter((item): item is KnowledgeBase => Boolean(item));

export const normalizeCreatedKnowledgeBase = (
  value: unknown,
  fallbackName: string,
): KnowledgeBase | null => {
  if (value === undefined || value === null) return null;
  if (isRecord(value) && value.data !== undefined) {
    return normalizeCreatedKnowledgeBase(value.data, fallbackName);
  }
  return normalizeKnowledgeBase(value, 0, fallbackName);
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const formatFileSize = (size?: number): string => {
  if (!size || size <= 0) return '未知大小';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export const formatDate = (value?: string): string => {
  if (!value) return '刚刚';
  const num = Number(value);
  const date = Number.isFinite(num) && num > 1e12 ? new Date(num) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getFileActionId = (knowledgeBaseId: string, fileId: string): string =>
  `${knowledgeBaseId}:${fileId}`;