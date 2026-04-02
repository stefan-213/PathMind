/**
 * 图表渲染组件
 * 使用 react-drawio (draw.io iframe 嵌入) 进行渲染
 */
import { useEffect, useRef, useState } from 'react';
import { DrawIoEmbed } from 'react-drawio';
import type { DrawIoEmbedRef } from 'react-drawio';
import './GraphCanvas.scss';

interface GraphCanvasProps {
  /** draw.io XML 数据 */
  xml: string | null;
}

export function GraphCanvas({ xml }: GraphCanvasProps) {
  const drawioRef = useRef<DrawIoEmbedRef>(null);
  const [isDrawioReady, setIsDrawioReady] = useState(false);
  const lastLoadedXmlRef = useRef<string>('');

  // Draw.io 加载完成回调
  const handleDrawioLoad = () => {
    setIsDrawioReady(true);
  };

  // 当 Draw.io 就绪后，加载图表 XML
  useEffect(() => {
    if (!isDrawioReady || !drawioRef.current || !xml) return;

    // 避免重复加载相同的 XML
    if (xml === lastLoadedXmlRef.current) return;
    lastLoadedXmlRef.current = xml;

    // 使用 ref 来加载图表
    drawioRef.current.load({ xml });
  }, [isDrawioReady, xml]);

  return (
    <div className="graph-canvas">
      {xml ? (
        <div style={{ width: '100%', height: '100%', minHeight: '600px' }}>
          <DrawIoEmbed
            ref={drawioRef}
            urlParameters={{
              ui: 'kennedy',
              spin: false,
              libraries: false,
              noSaveBtn: true,
              noExitBtn: true,
            }}
            onLoad={handleDrawioLoad}
          />
        </div>
      ) : (
        <div className="empty-graph">
          <i className="fas fa-project-diagram"></i>
          <p>在右侧输入需求，让 AI 为你生成图表</p>
        </div>
      )}
    </div>
  );
}