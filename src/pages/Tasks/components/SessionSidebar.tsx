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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
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
  isMobileOpen = false,
  onMobileClose,
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
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      mobileCloseTitle="关闭历史会话"
      className="tasks-resource-sidebar"
    />
  );
}
