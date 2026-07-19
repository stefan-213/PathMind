import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  ResourceSidebar,
  Spin,
  type ResourceSidebarItem,
} from '../../components/common';
import { Header } from '../../components/layout/Header';
import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  deleteDocument,
  getDocuments,
  getKnowledgeBaseList,
  updateKnowledgeBase,
  uploadDocument,
} from '../../api/knowledgeBase';
import type { KnowledgeBase, KnowledgeBaseFile } from '../../types/api';
import { isRecord } from '../../utils/typeGuards';
import {
  getText, getFirstText, getNumber, getArray,
  hasKnowledgeBaseShape, hasKnowledgeFileShape, normalizeKnowledgeBaseFile,
  normalizeKnowledgeBase, getKnowledgeBaseArray, normalizeKnowledgeBaseList,
  normalizeCreatedKnowledgeBase, getErrorMessage, formatFileSize, formatDate,
  getFileActionId,
  type DataRecord, type KnowledgeBaseDialogMode,
} from './utils/normalize';
import './KnowledgeBasePage.scss';

export function KnowledgeBasePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedKnowledgeBaseIds, setExpandedKnowledgeBaseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dialogMode, setDialogMode] = useState<KnowledgeBaseDialogMode | null>(null);
  const [dialogKnowledgeBaseId, setDialogKnowledgeBaseId] = useState<string | null>(null);
  const [dialogKnowledgeBaseName, setDialogKnowledgeBaseName] = useState('');
  const [isCreatingKnowledgeBase, setIsCreatingKnowledgeBase] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [deletingKnowledgeBaseId, setDeletingKnowledgeBaseId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedKnowledgeBase = useMemo(
    () => knowledgeBases.find((item) => item.id === selectedKnowledgeBaseId) ?? null,
    [knowledgeBases, selectedKnowledgeBaseId],
  );

  const totalFileCount = useMemo(
    () => knowledgeBases.reduce((total, item) => total + item.files.length, 0),
    [knowledgeBases],
  );

  const isDialogSubmitting = isCreatingKnowledgeBase || isSavingName;
  const dialogTitle = dialogMode === 'rename' ? '重命名知识库' : '创建知识库';
  const dialogSubmitText = dialogMode === 'rename' ? '保存' : '创建';

  const sidebarItems = useMemo<ResourceSidebarItem[]>(
    () =>
      knowledgeBases.map((item) => ({
        id: item.id,
        title: item.name,
        iconClass: 'fas fa-folder',
        description: item.files.length > 0 ? `${item.files.length} 个文件` : '暂无文件',
      })),
    [knowledgeBases],
  );

  const loadKnowledgeBases = useCallback(async (preferredId?: string | null) => {
    setIsLoadingList(true);
    setErrorMessage(null);

    try {
      const response = await getKnowledgeBaseList();
      if (response.success === false) {
        throw new Error(response.error || response.message || '获取知识库列表失败');
      }

      const rawList = normalizeKnowledgeBaseList(response.data);

      // 为每个知识库加载文档列表
      const nextKnowledgeBases: KnowledgeBase[] = await Promise.all(
        rawList.map(async (kb) => {
          try {
            const docResponse = await getDocuments(kb.id);
            if (docResponse.success === false) return kb;

            const docs = Array.isArray(docResponse.data) ? docResponse.data : [];
            const files: KnowledgeBaseFile[] = docs.map((doc: Record<string, unknown>) => ({
              id: getFirstText(doc, ['id', 'documentId'], ''),
              name: getFirstText(doc, ['fileName', 'name', 'title'], ''),
              size: getNumber(doc.fileSize ?? doc.size),
              type: getFirstText(doc, ['fileType', 'type'], ''),
              createdAt: getFirstText(doc, ['createdAt', 'createTime'], ''),
            }));
            return { ...kb, files };
          } catch {
            return kb;
          }
        }),
      );

      setKnowledgeBases(nextKnowledgeBases);
      setSelectedKnowledgeBaseId((currentId) => {
        const targetId = preferredId ?? currentId;
        if (targetId && nextKnowledgeBases.some((item) => item.id === targetId)) {
          return targetId;
        }
        return nextKnowledgeBases[0]?.id ?? null;
      });
      setSelectedFileId((currentFileId) => {
        if (
          currentFileId &&
          nextKnowledgeBases.some((item) =>
            item.files.some((file) => file.id === currentFileId),
          )
        ) {
          return currentFileId;
        }
        return null;
      });
      setExpandedKnowledgeBaseIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextKnowledgeBases.forEach((item) => {
          if (item.id === preferredId || (nextIds.has(item.id) && item.files.length > 0)) {
            nextIds.add(item.id);
          }
        });
        return nextIds;
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '获取知识库列表失败'));
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  const handleSelectKnowledgeBase = useCallback((id: string) => {
    setSelectedKnowledgeBaseId(id);
    setSelectedFileId(null);
    setExpandedKnowledgeBaseIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }
      return nextIds;
    });
  }, []);

  const handleToggleKnowledgeBase = useCallback((id: string) => {
    setExpandedKnowledgeBaseIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }
      return nextIds;
    });
  }, []);

  const openCreateDialog = useCallback(() => {
    setDialogMode('create');
    setDialogKnowledgeBaseId(null);
    setDialogKnowledgeBaseName('');
    setErrorMessage(null);
  }, []);

  const openRenameDialog = useCallback((knowledgeBase: KnowledgeBase) => {
    setDialogMode('rename');
    setDialogKnowledgeBaseId(knowledgeBase.id);
    setDialogKnowledgeBaseName(knowledgeBase.name);
    setErrorMessage(null);
  }, []);

  const closeDialog = useCallback(() => {
    if (isDialogSubmitting) return;
    setDialogMode(null);
    setDialogKnowledgeBaseId(null);
    setDialogKnowledgeBaseName('');
  }, [isDialogSubmitting]);

  const handleOpenFilePicker = useCallback(() => {
    if (isUploading || isLoadingList) return;

    if (!selectedKnowledgeBaseId) {
      openCreateDialog();
      setErrorMessage('请先创建或选择一个知识库');
      return;
    }

    fileInputRef.current?.click();
  }, [isLoadingList, isUploading, openCreateDialog, selectedKnowledgeBaseId]);

  const handleSubmitKnowledgeBaseDialog = useCallback(async () => {
    const name = dialogKnowledgeBaseName.trim();
    if (!name || isDialogSubmitting) {
      if (!name) setErrorMessage('请输入知识库名称');
      return;
    }

    if (dialogMode === 'rename') {
      if (!dialogKnowledgeBaseId) return;

      setIsSavingName(true);
      setErrorMessage(null);

      try {
        const response = await updateKnowledgeBase({ id: dialogKnowledgeBaseId, name });
        if (response.success === false) {
          throw new Error(response.error || response.message || '修改知识库失败');
        }

        setKnowledgeBases((currentItems) =>
          currentItems.map((item) =>
            item.id === dialogKnowledgeBaseId
              ? {
                  ...item,
                  name,
                }
              : item,
          ),
        );
        setDialogMode(null);
        setDialogKnowledgeBaseId(null);
        setDialogKnowledgeBaseName('');
        await loadKnowledgeBases(dialogKnowledgeBaseId);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, '修改知识库失败'));
      } finally {
        setIsSavingName(false);
      }

      return;
    }

    setIsCreatingKnowledgeBase(true);
    setErrorMessage(null);

    try {
      const response = await createKnowledgeBase({ name });
      if (response.success === false) {
        throw new Error(response.error || response.message || '新增知识库失败');
      }

      const createdKnowledgeBase = normalizeCreatedKnowledgeBase(response.data, name);
      if (createdKnowledgeBase) {
        setKnowledgeBases((currentItems) => {
          const exists = currentItems.some((item) => item.id === createdKnowledgeBase.id);
          return exists
            ? currentItems.map((item) =>
                item.id === createdKnowledgeBase.id ? createdKnowledgeBase : item,
              )
            : [...currentItems, createdKnowledgeBase];
        });
        setSelectedKnowledgeBaseId(createdKnowledgeBase.id);
        setExpandedKnowledgeBaseIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.add(createdKnowledgeBase.id);
          return nextIds;
        });
      }

      setDialogMode(null);
      setDialogKnowledgeBaseId(null);
      setDialogKnowledgeBaseName('');
      await loadKnowledgeBases(createdKnowledgeBase?.id ?? null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '新增知识库失败'));
    } finally {
      setIsCreatingKnowledgeBase(false);
    }
  }, [
    dialogKnowledgeBaseId,
    dialogKnowledgeBaseName,
    dialogMode,
    isDialogSubmitting,
    loadKnowledgeBases,
  ]);

  const handleUploadFiles = useCallback(async (
    files: File[],
  ) => {
    const targetKnowledgeBaseId = selectedKnowledgeBaseId;
    if (files.length === 0 || isUploading) return;

    if (!targetKnowledgeBaseId) {
      openCreateDialog();
      setErrorMessage('请先创建或选择一个知识库');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 逐个文件上传
      for (const file of files) {
        const response = await uploadDocument(targetKnowledgeBaseId, file);
        if (response.success === false) {
          throw new Error(response.error || response.message || `上传文件「${file.name}」失败`);
        }
      }

      setExpandedKnowledgeBaseIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(targetKnowledgeBaseId);
        return nextIds;
      });
      await loadKnowledgeBases(targetKnowledgeBaseId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '上传文件失败'));
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, loadKnowledgeBases, openCreateDialog, selectedKnowledgeBaseId]);

  const handleFileInputChange = useCallback((
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    void handleUploadFiles(files);
    event.target.value = '';
  }, [handleUploadFiles]);

  const handleDrop = useCallback((
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setIsDragActive(false);
    void handleUploadFiles(Array.from(event.dataTransfer.files));
  }, [handleUploadFiles]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) setIsDragActive(true);
  }, [isUploading]);

  const handleUploadZoneKeyDown = useCallback((
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleOpenFilePicker();
  }, [handleOpenFilePicker]);

  const handleRenameKeyDown = useCallback((
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSubmitKnowledgeBaseDialog();
    }
    if (event.key === 'Escape') {
      closeDialog();
    }
  }, [closeDialog, handleSubmitKnowledgeBaseDialog]);

  const handleDeleteKnowledgeBase = useCallback(async (
    knowledgeBase: KnowledgeBase,
  ) => {
    if (deletingKnowledgeBaseId) return;
    const confirmed = window.confirm(`确定删除知识库「${knowledgeBase.name}」吗？`);
    if (!confirmed) return;

    setDeletingKnowledgeBaseId(knowledgeBase.id);
    setErrorMessage(null);

    try {
      const response = await deleteKnowledgeBase(knowledgeBase.id);
      if (response.success === false) {
        throw new Error(response.error || response.message || '删除知识库失败');
      }

      const nextKnowledgeBases = knowledgeBases.filter((item) => item.id !== knowledgeBase.id);
      setKnowledgeBases(nextKnowledgeBases);
      setExpandedKnowledgeBaseIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(knowledgeBase.id);
        return nextIds;
      });
      setSelectedFileId(null);
      setSelectedKnowledgeBaseId((currentId) =>
        currentId === knowledgeBase.id ? nextKnowledgeBases[0]?.id ?? null : currentId,
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '删除知识库失败'));
    } finally {
      setDeletingKnowledgeBaseId(null);
    }
  }, [deletingKnowledgeBaseId, knowledgeBases]);

  const handleDeleteFile = useCallback(async (
    knowledgeBaseId: string,
    file: KnowledgeBaseFile,
  ) => {
    const actionId = getFileActionId(knowledgeBaseId, file.id);
    if (deletingFileId) return;
    const confirmed = window.confirm(`确定删除文件「${file.name}」吗？`);
    if (!confirmed) return;

    setDeletingFileId(actionId);
    setErrorMessage(null);

    try {
      const response = await deleteDocument(file.id);
      if (response.success === false) {
        throw new Error(response.error || response.message || '删除文件失败');
      }

      setKnowledgeBases((currentItems) =>
        currentItems.map((item) =>
          item.id === knowledgeBaseId
            ? {
                ...item,
                files: item.files.filter((currentFile) => currentFile.id !== file.id),
              }
            : item,
        ),
      );
      setSelectedFileId((currentId) => (currentId === file.id ? null : currentId));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '删除文件失败'));
    } finally {
      setDeletingFileId(null);
    }
  }, [deletingFileId]);

  const renderKnowledgeTree = () => {
    if (isLoadingList) {
      return (
        <div className="knowledge-sidebar-state">
          <Spin size="small" tip="加载中" />
        </div>
      );
    }

    if (knowledgeBases.length === 0) {
      return <div className="knowledge-sidebar-state">暂无知识库</div>;
    }

    return (
      <div className="knowledge-sidebar-tree">
        {knowledgeBases.map((knowledgeBase) => {
          const isExpanded = expandedKnowledgeBaseIds.has(knowledgeBase.id);
          const isActive = selectedKnowledgeBaseId === knowledgeBase.id;
          const isDeleting = deletingKnowledgeBaseId === knowledgeBase.id;

          return (
            <div
              key={knowledgeBase.id}
              className={`knowledge-sidebar-tree__folder ${isActive ? 'knowledge-sidebar-tree__folder--active' : ''}`}
            >
              <div className="knowledge-sidebar-tree__folder-row">
                <button
                  type="button"
                  className="knowledge-sidebar-tree__toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleKnowledgeBase(knowledgeBase.id);
                  }}
                  aria-label={isExpanded ? '收起文件列表' : '展开文件列表'}
                >
                  <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                </button>

                <div className="knowledge-sidebar-tree__folder-main">
                  <i className="fas fa-folder knowledge-sidebar-tree__folder-icon"></i>
                  <span className="knowledge-sidebar-tree__folder-text">
                    <span className="knowledge-sidebar-tree__folder-title">
                      {knowledgeBase.name}
                    </span>
                    <span className="knowledge-sidebar-tree__folder-meta">
                      {knowledgeBase.files.length > 0
                        ? `${knowledgeBase.files.length} 个文件`
                        : '暂无文件'}
                    </span>
                  </span>
                </div>

                <div className="knowledge-sidebar-tree__actions">
                  <button
                    type="button"
                    className="knowledge-sidebar-tree__icon-btn"
                    title="重命名知识库"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameDialog(knowledgeBase);
                    }}
                    disabled={isDeleting}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button
                    type="button"
                    className="knowledge-sidebar-tree__icon-btn knowledge-sidebar-tree__icon-btn--danger"
                    title="删除知识库"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteKnowledgeBase(knowledgeBase);
                    }}
                    disabled={isDeleting}
                  >
                    <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                  </button>
                </div>
              </div>

              {isExpanded && knowledgeBase.files.length > 0 ? (
                <div
                  className="knowledge-sidebar-tree__files"
                  onClick={(e) => e.stopPropagation()}
                >
                  {knowledgeBase.files.map((file) => {
                    const actionId = getFileActionId(knowledgeBase.id, file.id);
                    const isDeletingFile = deletingFileId === actionId;

                    return (
                      <div
                        key={`${knowledgeBase.id}-${file.id}`}
                        className={`knowledge-sidebar-tree__file-row ${selectedFileId === file.id ? 'knowledge-sidebar-tree__file-row--active' : ''}`}
                      >
                        <button
                          type="button"
                          className="knowledge-sidebar-tree__file-main"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKnowledgeBaseId(knowledgeBase.id);
                            setSelectedFileId(file.id);
                          }}
                        >
                          <i className="fas fa-file-alt"></i>
                          <span>{file.name}</span>
                        </button>
                        <button
                          type="button"
                          className="knowledge-sidebar-tree__icon-btn knowledge-sidebar-tree__icon-btn--danger"
                          title="删除文件"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteFile(knowledgeBase.id, file);
                          }}
                          disabled={isDeletingFile}
                        >
                          <i className={`fas ${isDeletingFile ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const uploadZoneClassName = [
    'knowledge-upload-zone',
    isDragActive ? 'knowledge-upload-zone--active' : '',
    isUploading ? 'knowledge-upload-zone--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="knowledge-base-page">
      <Header />
      <div className="knowledge-base-layout">
        <ResourceSidebar
          header={{
            title: '知识库',
            iconClass: 'fas fa-database',
            subtitle: `${knowledgeBases.length} 个知识库`,
          }}
          primaryAction={{
            label: '创建知识库',
            iconClass: 'fas fa-cloud-upload-alt',
            title: '创建知识库',
            disabled: isUploading || isLoadingList,
            onClick: openCreateDialog,
          }}
          sectionTitle="知识库列表"
          items={sidebarItems}
          activeItemId={selectedKnowledgeBaseId ?? ''}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
          onSelectItem={handleSelectKnowledgeBase}
          emptyText="暂无知识库"
          className="knowledge-resource-sidebar"
        >
          {renderKnowledgeTree()}
        </ResourceSidebar>

        <main className="knowledge-main">
          <input
            ref={fileInputRef}
            className="knowledge-file-input"
            type="file"
            multiple
            onChange={handleFileInputChange}
            disabled={isUploading || !selectedKnowledgeBaseId}
          />

          <header className="knowledge-main__header">
            <div className="knowledge-main__title-area">
              <span className="knowledge-main__eyebrow">Knowledge Base</span>
              <h1>知识库上传</h1>
              <p>
                {selectedKnowledgeBase
                  ? `当前知识库：${selectedKnowledgeBase.name}`
                  : '创建知识库后即可上传和管理文件'}
              </p>
            </div>
          </header>

          <div className="knowledge-mobile-selector">
            <select
              value={selectedKnowledgeBaseId ?? ''}
              onChange={(event) => handleSelectKnowledgeBase(event.target.value)}
              disabled={isLoadingList || knowledgeBases.length === 0}
              aria-label="选择知识库"
            >
              <option value="">选择知识库</option>
              {knowledgeBases.map((knowledgeBase) => (
                <option key={knowledgeBase.id} value={knowledgeBase.id}>
                  {knowledgeBase.name}
                </option>
              ))}
            </select>
          </div>

          {errorMessage ? (
            <div className="knowledge-alert" role="alert">
              <i className="fas fa-circle-exclamation"></i>
              <span>{errorMessage}</span>
              <button
                type="button"
                className="knowledge-alert__close"
                onClick={() => setErrorMessage(null)}
                title="关闭提示"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : null}

          <section className="knowledge-overview">
            <Card className="knowledge-stat-card" hoverable={false}>
              <span className="knowledge-stat-card__label">知识库</span>
              <strong>{knowledgeBases.length}</strong>
            </Card>
            <Card className="knowledge-stat-card" hoverable={false}>
              <span className="knowledge-stat-card__label">文件</span>
              <strong>{totalFileCount}</strong>
            </Card>
            <Card className="knowledge-stat-card" hoverable={false}>
              <span className="knowledge-stat-card__label">当前状态</span>
              <strong>{isUploading ? '上传中' : '待上传'}</strong>
            </Card>
          </section>

          <Card className="knowledge-upload-card" hoverable={false}>
            <div
              className={uploadZoneClassName}
              role="button"
              tabIndex={0}
              aria-disabled={isUploading}
              onClick={handleOpenFilePicker}
              onKeyDown={handleUploadZoneKeyDown}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="knowledge-upload-zone__icon">
                <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
              </div>
              <div className="knowledge-upload-zone__text">
                <h2>
                  {selectedKnowledgeBase?.files.length
                    ? '继续上传文件'
                    : '此知识库为空，请上传文件'}
                </h2>
                <p>
                  {selectedKnowledgeBase
                    ? '拖拽文件到这里，或点击选择文件'
                    : '请先创建或选择知识库'}
                </p>
              </div>
              <span className="knowledge-upload-zone__button">
                {isUploading ? '上传中...' : '选择文件'}
              </span>
            </div>
          </Card>

          <section className="knowledge-files-section">
            <div className="knowledge-files-section__header">
              <div>
                <h2>{selectedKnowledgeBase?.name ?? '文件列表'}</h2>
                <p>
                  {selectedKnowledgeBase
                    ? `共 ${selectedKnowledgeBase.files.length} 个文件`
                    : '暂无选中的知识库'}
                </p>
              </div>
              {selectedKnowledgeBase ? (
                <Badge variant={selectedKnowledgeBase.files.length > 0 ? 'primary' : 'warning'}>
                  {selectedKnowledgeBase.files.length > 0 ? '已上传' : '空知识库'}
                </Badge>
              ) : null}
            </div>

            {isLoadingList ? (
              <div className="knowledge-panel-state">
                <Spin size="large" tip="正在加载知识库" />
              </div>
            ) : selectedKnowledgeBase && selectedKnowledgeBase.files.length > 0 ? (
              <div className="knowledge-file-list">
                {selectedKnowledgeBase.files.map((file) => {
                  const actionId = getFileActionId(selectedKnowledgeBase.id, file.id);
                  const isDeletingFile = deletingFileId === actionId;

                  return (
                    <Card
                      key={`${selectedKnowledgeBase.id}-${file.id}`}
                      variant="bordered"
                      padding="md"
                      hoverable={false}
                      className={`knowledge-file-card ${selectedFileId === file.id ? 'knowledge-file-card--active' : ''}`}
                    >
                      <button
                        type="button"
                        className="knowledge-file-card__main"
                        onClick={() => setSelectedFileId(file.id)}
                      >
                        <span className="knowledge-file-card__icon">
                          <i className="fas fa-file-alt"></i>
                        </span>
                        <span className="knowledge-file-card__content">
                          <span className="knowledge-file-card__name">{file.name}</span>
                          <span className="knowledge-file-card__meta">
                            {formatFileSize(file.size)}
                            <span aria-hidden="true">·</span>
                            {file.type || '文件'}
                            <span aria-hidden="true">·</span>
                            {formatDate(file.createdAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="knowledge-icon-button knowledge-icon-button--danger"
                        title="删除文件"
                        onClick={() => void handleDeleteFile(selectedKnowledgeBase.id, file)}
                        disabled={isDeletingFile}
                      >
                        <i className={`fas ${isDeletingFile ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                      </button>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<i className="fas fa-folder-open"></i>}
                title="此知识库为空，请上传文件"
                description={
                  selectedKnowledgeBase
                    ? '当前知识库暂无文件。'
                    : '当前没有可用知识库。'
                }
                action={
                  <Button
                    variant={selectedKnowledgeBase ? 'primary-blue' : 'secondary'}
                    onClick={
                      selectedKnowledgeBase
                        ? handleOpenFilePicker
                        : () => {
                            openCreateDialog();
                          }
                    }
                    disabled={isUploading || isLoadingList}
                  >
                    {selectedKnowledgeBase ? '上传文件' : '创建知识库'}
                  </Button>
                }
              />
            )}
          </section>
        </main>
      </div>
      {dialogMode ? (
        <div
          className="knowledge-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="knowledge-modal-title"
        >
          <div className="knowledge-modal__backdrop" onClick={closeDialog}></div>
          <div className="knowledge-modal__panel">
            <div className="knowledge-modal__header">
              <h2 id="knowledge-modal-title">{dialogTitle}</h2>
              <button
                type="button"
                className="knowledge-icon-button"
                onClick={closeDialog}
                disabled={isDialogSubmitting}
                title="关闭"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <Input
              label="知识库名称"
              placeholder="请输入知识库名称"
              value={dialogKnowledgeBaseName}
              onChange={(event) => setDialogKnowledgeBaseName(event.target.value)}
              onKeyDown={handleRenameKeyDown}
              disabled={isDialogSubmitting}
              autoFocus
            />
            <div className="knowledge-modal__actions">
              <Button
                variant="secondary"
                onClick={closeDialog}
                disabled={isDialogSubmitting}
              >
                取消
              </Button>
              <Button
                variant="primary-blue"
                onClick={handleSubmitKnowledgeBaseDialog}
                disabled={isDialogSubmitting || !dialogKnowledgeBaseName.trim()}
              >
                {isDialogSubmitting ? '提交中...' : dialogSubmitText}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
