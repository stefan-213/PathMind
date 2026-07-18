import type { ResourceSidebarItem } from '../../../components/common';
import { ResourceSidebar } from '../../../components/common';

interface SessionSidebarProps {
  activeSessionTitle: string;
  fallbackSubtitle: string;
  sessionSidebarItems: ResourceSidebarItem[];
  activeSessionId: string | null;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectItem: (sessionId: string) => void;
  emptyText: string;
}

export function SessionSidebar({
  activeSessionTitle,
  fallbackSubtitle,
  sessionSidebarItems,
  activeSessionId,
  isSidebarCollapsed,
  onToggleCollapse,
  onSelectItem,
  emptyText,
}: SessionSidebarProps) {
  return (
    <ResourceSidebar
      header={{
        title: '我的任务',
        iconClass: 'fas fa-tasks',
        subtitle: activeSessionTitle || fallbackSubtitle,
      }}
      sectionTitle="历史会话"
      items={sessionSidebarItems}
      activeItemId={activeSessionId ?? ''}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={onToggleCollapse}
      onSelectItem={onSelectItem}
      emptyText={emptyText}
      collapseTitle="收起侧栏"
      expandTitle="展开侧栏"
      className="tasks-resource-sidebar"
    />
  );
}