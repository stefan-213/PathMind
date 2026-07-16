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

  // 使用 XML 内容的哈希作为 key，确保 XML 变化时组件重新挂载
  const drawioKey = useMemo(() => {
    if (!xml) return 'empty';
    const prefix = xml.substring(0, 200).replace(/\s/g, '');
    let hash = 0;
    for (let i = 0; i < prefix.length; i++) {
      hash = ((hash << 5) - hash + prefix.charCodeAt(i)) | 0;
    }
    return `drawio-${xml.length}-${hash}`;
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
            formatPanel: false,
            shapePanel: false,
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
