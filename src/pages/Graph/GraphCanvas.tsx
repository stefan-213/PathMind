/**
 * 图表渲染组件
 * 使用 react-drawio 嵌入 draw.io
 */
import { useEffect, useMemo, useRef } from 'react';
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
  const embedRef = useRef<any>(null);

  // 使用 XML 内容的哈希作为 key，确保 XML 变化时组件重新挂载
  // 不使用 Date.now()，避免 iframe 还没加载完就被销毁重建
  const drawioKey = useMemo(() => {
    if (!xml) return 'empty';
    const prefix = xml.substring(0, 200).replace(/\s/g, '');
    let hash = 0;
    for (let i = 0; i < prefix.length; i++) {
      hash = ((hash << 5) - hash + prefix.charCodeAt(i)) | 0;
    }
    return `drawio-${xml.length}-${hash}`;
  }, [xml]);

  // 修复：draw.io iframe 加载后 react-drawio 内部 init 事件链可能断裂
  // 在 iframe 就绪后直接通过 postMessage 发送 XML，绕过 react-drawio 的内部状态管理
  useEffect(() => {
    if (!xml) return;

    const sendXmlToIframe = () => {
      const iframe = document.querySelector('.graph-canvas iframe') as HTMLIFrameElement;
      if (!iframe?.contentWindow) return;

      const loadMsg = JSON.stringify({
        action: 'load',
        xml,
        autosave: false,
      });
      iframe.contentWindow.postMessage(loadMsg, '*');
    };

    // 等待 iframe 加载 draw.io 后发送 XML（多重延迟确保可靠性）
    const t1 = setTimeout(sendXmlToIframe, 2000);
    const t2 = setTimeout(sendXmlToIframe, 5000);
    const t3 = setTimeout(sendXmlToIframe, 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [xml, drawioKey]);

  return (
    <div className="graph-canvas">
      {xml ? (
        <DrawIoEmbed
          ref={embedRef}
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
