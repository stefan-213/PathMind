/**
 * 知识库 API 服务
 */
import { get, post } from './axios';
import type {
  CreateKnowledgeBaseRequest,
  DeleteKnowledgeBaseFileRequest,
  DeleteKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  UploadKnowledgeBaseFileRequest,
} from '../types/api';

export const KNOWLEDGE_BASE_ENDPOINTS = {
  list: '/api/knowledge-base/list',
  create: '/api/knowledge-base/create',
  update: '/api/knowledge-base/update',
  delete: '/api/knowledge-base/delete',
  upload: '/api/knowledge-base/upload',
  deleteFile: '/api/knowledge-base/file/delete',
} as const;

export const getKnowledgeBaseList = () => {
  return get<unknown>(KNOWLEDGE_BASE_ENDPOINTS.list);
};

export const createKnowledgeBase = (data: CreateKnowledgeBaseRequest) => {
  return post<unknown>(KNOWLEDGE_BASE_ENDPOINTS.create, data);
};

export const updateKnowledgeBase = (data: UpdateKnowledgeBaseRequest) => {
  return post<unknown>(KNOWLEDGE_BASE_ENDPOINTS.update, data);
};

export const deleteKnowledgeBase = (data: DeleteKnowledgeBaseRequest) => {
  return post<unknown>(KNOWLEDGE_BASE_ENDPOINTS.delete, data);
};

export const uploadKnowledgeBaseFiles = ({
  knowledgeBaseId,
  files,
}: UploadKnowledgeBaseFileRequest) => {
  const formData = new FormData();
  formData.append('knowledgeBaseId', knowledgeBaseId);
  files.forEach((file) => {
    formData.append('files', file);
  });

  return post<unknown>(KNOWLEDGE_BASE_ENDPOINTS.upload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteKnowledgeBaseFile = (data: DeleteKnowledgeBaseFileRequest) => {
  return post<unknown>(KNOWLEDGE_BASE_ENDPOINTS.deleteFile, data);
};
