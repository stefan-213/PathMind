/**
 * 图表渲染组件
 * 使用 react-drawio 嵌入 draw.io
 */
import { useEffect, useRef, useState } from 'react';
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [readyXml, setReadyXml] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !xml) {
      return;
    }

    let firstFrameId = 0;
    let secondFrameId = 0;

    const updateReadyState = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReadyXml(xml);
      }
    };

    const scheduleReadyCheck = () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);

      firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(updateReadyState);
      });
    };

    scheduleReadyCheck();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.cancelAnimationFrame(firstFrameId);
        window.cancelAnimationFrame(secondFrameId);
      };
    }

    const resizeObserver = new ResizeObserver(scheduleReadyCheck);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [xml]);

  const drawIoXml = xml ?? '';
  const shouldRenderDrawIo = Boolean(drawIoXml && readyXml === drawIoXml);
  const shouldRenderEmptyState = !xml;

  return (
    <div className="graph-canvas" ref={canvasRef}>
      {shouldRenderDrawIo && (
        <DrawIoEmbed
          baseUrl={drawIoBaseUrl}
          xml={drawIoXml}
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
      )}
      {shouldRenderEmptyState && (
        <div className="empty-graph">
          <i className="fas fa-project-diagram"></i>
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
