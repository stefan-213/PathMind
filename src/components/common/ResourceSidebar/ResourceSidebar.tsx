import { memo } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import './ResourceSidebar.scss';

export interface ResourceSidebarHeader {
  title: string;
  iconClass?: string;
  href?: string;
  subtitle?: string;
}

export interface ResourceSidebarAction {
  label: string;
  iconClass?: string;
  title?: string;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}

export interface ResourceSidebarItem {
  id: string;
  title: string;
  iconClass?: string;
  description?: string;
  disabled?: boolean;
}

export interface ResourceSidebarProps {
  header: ResourceSidebarHeader;
  primaryAction?: ResourceSidebarAction;
  sectionTitle: string;
  items: ResourceSidebarItem[];
  activeItemId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  emptyText?: string;
  children?: ReactNode;
  className?: string;
  collapseTitle?: string;
  expandTitle?: string;
  deleteTitle?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  mobileCloseTitle?: string;
}

function renderHeaderLogo(header: ResourceSidebarHeader) {
  const logoContent = header.iconClass ? <i className={header.iconClass}></i> : null;

  if (header.href) {
    return (
      <Link to={header.href} className="resource-sidebar__logo" aria-label={header.title}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className="resource-sidebar__logo" aria-hidden={header.iconClass ? undefined : true}>
      {logoContent}
    </div>
  );
}

export const ResourceSidebar = memo(function ResourceSidebar({
  header,
  primaryAction,
  sectionTitle,
  items,
  activeItemId,
  isCollapsed,
  onToggleCollapse,
  onSelectItem,
  onDeleteItem,
  emptyText = '暂无数据',
  children,
  className = '',
  collapseTitle = '收起侧栏',
  expandTitle = '展开侧栏',
  deleteTitle = '删除',
  isMobileOpen = false,
  onMobileClose,
  mobileCloseTitle = '关闭侧栏',
}: ResourceSidebarProps) {
  const shouldRenderCollapsed = isCollapsed && !isMobileOpen;
  const sidebarClassName = [
    'resource-sidebar',
    shouldRenderCollapsed ? 'resource-sidebar--collapsed' : '',
    isMobileOpen ? 'resource-sidebar--mobile-open' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleSelectItem = (item: ResourceSidebarItem) => {
    if (item.disabled) return;
    onSelectItem(item.id);
    if (isMobileOpen) onMobileClose?.();
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: ResourceSidebarItem) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleSelectItem(item);
  };

  const handlePrimaryAction = async () => {
    if (!primaryAction || primaryAction.disabled) return;
    await primaryAction.onClick();
    if (isMobileOpen) onMobileClose?.();
  };

  const renderBody = () => {
    if (shouldRenderCollapsed) {
      return (
        <div className="resource-sidebar__compact-actions">
          <button
            type="button"
            className="resource-sidebar__compact-btn"
            onClick={onToggleCollapse}
            title={expandTitle}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          {primaryAction ? (
            <button
              type="button"
              className="resource-sidebar__compact-btn resource-sidebar__compact-btn--primary"
              onClick={handlePrimaryAction}
              title={primaryAction.title || primaryAction.label}
              disabled={primaryAction.disabled}
            >
              {primaryAction.iconClass ? <i className={primaryAction.iconClass}></i> : null}
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <>
        {primaryAction ? (
          <button
            type="button"
            className="resource-sidebar__primary-action"
            onClick={handlePrimaryAction}
            disabled={primaryAction.disabled}
            title={primaryAction.title || primaryAction.label}
          >
            {primaryAction.iconClass ? <i className={primaryAction.iconClass}></i> : null}
            <span className="resource-sidebar__primary-action-text">{primaryAction.label}</span>
          </button>
        ) : null}

        <div className="resource-sidebar__section">
          <span className="resource-sidebar__section-title">{sectionTitle}</span>
          {children ? (
            <div className="resource-sidebar__custom-content">{children}</div>
          ) : (
            <div className="resource-sidebar__list">
              {items.length > 0 ? (
                items.map((item) => {
                  const isActive = activeItemId === item.id;
                  const itemClassName = [
                    'resource-sidebar__item',
                    isActive ? 'resource-sidebar__item--active' : '',
                    item.disabled ? 'resource-sidebar__item--disabled' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <div
                      key={item.id}
                      className={itemClassName}
                      role="button"
                      tabIndex={item.disabled ? -1 : 0}
                      aria-current={isActive ? 'page' : undefined}
                      aria-disabled={item.disabled || undefined}
                      onClick={() => handleSelectItem(item)}
                      onKeyDown={(event) => handleItemKeyDown(event, item)}
                    >
                      <div className="resource-sidebar__item-content">
                        {item.iconClass ? (
                          <i className={`${item.iconClass} resource-sidebar__item-icon`}></i>
                        ) : null}
                        <span className="resource-sidebar__item-text">
                          <span className="resource-sidebar__item-title">{item.title}</span>
                          {item.description ? (
                            <span className="resource-sidebar__item-description">{item.description}</span>
                          ) : null}
                        </span>
                      </div>
                      {onDeleteItem ? (
                        <button
                          type="button"
                          className="resource-sidebar__delete-btn"
                          title={deleteTitle}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="resource-sidebar__empty">{emptyText}</div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <button
        type="button"
        className={`resource-sidebar__mobile-backdrop ${isMobileOpen ? 'resource-sidebar__mobile-backdrop--show' : ''}`}
        onClick={onMobileClose}
        aria-label={mobileCloseTitle}
      />
      <aside className={sidebarClassName}>
        <div className="resource-sidebar__header">
          {renderHeaderLogo(header)}
          <div className="resource-sidebar__title-area">
            <div className="resource-sidebar__header-text">
              <span className="resource-sidebar__title">{header.title}</span>
              {header.subtitle ? (
                <span className="resource-sidebar__subtitle">{header.subtitle}</span>
              ) : null}
            </div>
            <button
              type="button"
              className="resource-sidebar__collapse-btn"
              onClick={onToggleCollapse}
              title={collapseTitle}
            >
              <i className="fas fa-angle-left"></i>
            </button>
            <button
              type="button"
              className="resource-sidebar__mobile-close-btn"
              onClick={onMobileClose}
              title={mobileCloseTitle}
              aria-label={mobileCloseTitle}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {renderBody()}
      </aside>
    </>
  );
});
