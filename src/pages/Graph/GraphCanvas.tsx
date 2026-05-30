/**
 * 图表渲染组件
 * 使用 react-drawio 嵌入 draw.io
 */
import { useMemo } from 'react';
import { DrawIoEmbed } from 'react-drawio';
import './GraphCanvas.scss';

interface GraphCanvasProps {
  /** draw.io XML 数据 */
  xml: string | null;
  emptyMessage?: string;
}

const DEFAULT_EMPTY_MESSAGE = '在Copilot页面输入需求，让 AI 为你生成计划图表';

const getDrawIoBaseUrl = () => {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:'
    ? 'http'
    : 'https';

  return `${protocol}://embed.diagrams.net`;
};

export function GraphCanvas({ xml, emptyMessage = DEFAULT_EMPTY_MESSAGE }: GraphCanvasProps) {
  const drawIoBaseUrl = getDrawIoBaseUrl();

  // 使用 XML 内容的哈希作为 key 的一部分，确保 XML 变化时组件重新挂载
  const drawioKey = useMemo(() => {
    if (!xml) return 'empty';
    // 使用简单的方式生成唯一标识
    const hash = xml.length + '-' + xml.substring(0, 100).replace(/\s/g, '').length;
    return `drawio-${hash}-${Date.now()}`;
  }, [xml]);

  return (
    <div className="graph-canvas">
      {xml ? (
        <DrawIoEmbed
          key={drawioKey}
          baseUrl={drawIoBaseUrl}
          xml={xml}
          urlParameters={{
            ui: 'sketch',
            spin: false,
            libraries: false,
            noSaveBtn: true,
            noExitBtn: true,
          }}
          configuration={{
            // 隐藏格式面板
            formatPanel: false,
            // 隐藏形状面板
            shapePanel: false,
            // 隐藏工具栏
            toolbar: false,
          }}
        />
      ) : (
        <div className="empty-graph">
          <i className="fas fa-project-diagram"></i>
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
