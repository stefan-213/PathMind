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

    const iframe = document.querySelector('.graph-canvas iframe') as HTMLIFrameElement;
    if (!iframe) return;

    let sent = false;
    const trySend = () => {
      if (sent) return;
      // 检查 iframe 是否已加载完毕
      if (iframe.contentDocument?.readyState === 'complete') {
        sent = true;
        sendXmlToIframe();
        return;
      }
    };

    // 兜底：如果 iframe 已完成加载，直接发送
    trySend();

    // 监听 iframe load 事件
    const handleLoad = () => {
      if (!sent) {
        sent = true;
        // 短暂延迟确保 diagrams.net 完全就绪
        setTimeout(sendXmlToIframe, 100);
      }
    };
    iframe.addEventListener('load', handleLoad);

    // 兜底超时（3 秒），防止 load 事件未触发
    const fallback = setTimeout(() => {
      if (!sent) {
        sent = true;
        sendXmlToIframe();
      }
    }, 3000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearTimeout(fallback);
    };
  }, [xml, drawioKey, drawIoBaseUrl]);

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
