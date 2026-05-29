/**
 * 知识库 API 服务
 */
import { get, post, put, del } from './axios';
import type {
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types/api';

export const getKnowledgeBaseList = () => {
  return get<unknown>('/api/knowledge/base/list');
};

export const createKnowledgeBase = (data: CreateKnowledgeBaseRequest) => {
  return post<unknown>('/api/knowledge/base', data);
};

export const updateKnowledgeBase = (data: UpdateKnowledgeBaseRequest) => {
  return put<unknown>('/api/knowledge/base', data);
};

export const deleteKnowledgeBase = (id: string) => {
  return del<unknown>(`/api/knowledge/base/${id}`);
};

export const getDocuments = (knowledgeBaseId: string) => {
  return get<unknown>('/api/knowledge/document/list', { knowledgeBaseId });
};

export const uploadDocument = (knowledgeBaseId: string, file: File) => {
  const formData = new FormData();
  formData.append('knowledgeBaseId', knowledgeBaseId);
  formData.append('file', file);

  return post<unknown>('/api/knowledge/document/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteDocument = (documentId: string) => {
  return del<unknown>(`/api/knowledge/document/${documentId}`);
};
