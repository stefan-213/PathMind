/**
 * 图表渲染组件
 * 使用 react-drawio 嵌入 draw.io
 */
import { DrawIoEmbed } from 'react-drawio';
import './GraphCanvas.scss';

interface GraphCanvasProps {
  /** draw.io XML 数据 */
  xml: string | null;
}

const getDrawIoBaseUrl = () => {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:'
    ? 'http'
    : 'https';

  return `${protocol}://embed.diagrams.net`;
};

export function GraphCanvas({ xml }: GraphCanvasProps) {
  const drawIoBaseUrl = getDrawIoBaseUrl();

  return (
    <div className="graph-canvas">
      {xml ? (
        <DrawIoEmbed
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
          <p>在Copilot页面输入需求，让 AI 为你生成计划图表</p>
        </div>
      )}
    </div>
  );
}
