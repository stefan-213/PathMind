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
  primaryAction: ResourceSidebarAction;
  sectionTitle: string;
  items: ResourceSidebarItem[];
  activeItemId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  emptyText?: string;
  className?: string;
  collapseTitle?: string;
  expandTitle?: string;
  deleteTitle?: string;
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

export function ResourceSidebar({
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
  className = '',
  collapseTitle = '收起侧边栏',
  expandTitle = '展开',
  deleteTitle = '删除',
}: ResourceSidebarProps) {
  const sidebarClassName = [
    'resource-sidebar',
    isCollapsed ? 'resource-sidebar--collapsed' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleSelectItem = (item: ResourceSidebarItem) => {
    if (item.disabled) return;
    onSelectItem(item.id);
  };

  const handleItemKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, item: ResourceSidebarItem) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleSelectItem(item);
  };

  return (
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
        </div>
      </div>

      {isCollapsed ? (
        <div className="resource-sidebar__compact-actions">
          <button
            type="button"
            className="resource-sidebar__compact-btn"
            onClick={onToggleCollapse}
            title={expandTitle}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button
            type="button"
            className="resource-sidebar__compact-btn resource-sidebar__compact-btn--primary"
            onClick={primaryAction.onClick}
            title={primaryAction.title || primaryAction.label}
            disabled={primaryAction.disabled}
          >
            {primaryAction.iconClass ? <i className={primaryAction.iconClass}></i> : null}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="resource-sidebar__primary-action"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            title={primaryAction.title || primaryAction.label}
          >
            {primaryAction.iconClass ? <i className={primaryAction.iconClass}></i> : null}
            <span className="resource-sidebar__primary-action-text">{primaryAction.label}</span>
          </button>

          <div className="resource-sidebar__section">
            <span className="resource-sidebar__section-title">{sectionTitle}</span>
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
          </div>
        </>
      )}
    </aside>
  );
}
