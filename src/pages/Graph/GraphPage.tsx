/**
 * 知识图谱页面
 * 支持 AI 生成图表
 */
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { GraphCanvas } from './GraphCanvas';
import { AISidePanel } from './AISidePanel';
import type { GraphNode } from '../../types/graph';
import { mockGraphXml } from '../../api/mock';
import './GraphPage.scss';

export function GraphPage() {
  const [searchParams] = useSearchParams();
  const goalParam = searchParams.get('goal') || '';

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // AI 生成图表 XML 数据
  const [graphXml, setGraphXml] = useState<string | null>(mockGraphXml);

  // 处理图表更新（AI 返回的 XML）
  const handleGraphUpdate = (xml: string) => {
    setGraphXml(xml);
  };

  return (
    <div className="graph-page">
      <Header />

      <div className="graph-main">
        {/* Page Header */}
        {/* <div className="graph-header">
          <h1 className="graph-title">
            <i className="fas fa-project-diagram"></i>
            {graphXml ? 'AI 生成图谱' : '知识图谱'}
          </h1>
          <p className="graph-desc">
            {goalParam || '探索技术知识之间的关联'}
          </p>
        </div> */}

        {/* Main Container */}
        <div className="graph-main-container">
          {/* Graph Container */}
          <div className={`graph-wrapper ${isPanelOpen ? 'with-ai-panel' : ''}`}>
            {/* AI 图谱标题 */}
            {/* {graphXml && (
              <div className="ai-graph-title">
                <i className="fas fa-chart-pie"></i> 前端开发学习路线图
              </div>
            )} */}

            {/* 返回知识图谱按钮 */}
            {/* {graphXml && (
              <button
                className="back-to-knowledge-btn"
                onClick={() => setGraphXml(null)}
                title="返回知识图谱"
              >
                <i className="fas fa-arrow-left"></i> 返回知识图谱
              </button>
            )} */}

            {/* 图表渲染 */}
            <GraphCanvas xml={graphXml} />

            {/* Node Detail Panel */}
            {selectedNode && (
              <div className="node-detail-panel show">
                <button className="btn-close" onClick={() => setSelectedNode(null)}>
                  ×
                </button>
                <div className="node-detail-header">
                  <div className="node-detail-icon">
                    <i className={selectedNode.icon || 'fas fa-circle'}></i>
                  </div>
                  <div className="node-detail-title">{selectedNode.label}</div>
                  {selectedNode.category && (
                    <div className="node-detail-category">{selectedNode.category}</div>
                  )}
                </div>
                <div className="node-detail-body">
                  {selectedNode.description && (
                    <p className="node-detail-desc">{selectedNode.description}</p>
                  )}
                  {selectedNode.tags && selectedNode.tags.length > 0 && (
                    <div className="node-tags">
                      {selectedNode.tags.map((tag: string) => (
                        <span key={tag} className="node-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="node-actions">
                    <Link to="/copilot" className="btn btn-primary">
                      开始学习
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* AI 助手切换按钮 - 放在图表右上角 */}
            <button
              className="ai-panel-toggle-corner"
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              title={isPanelOpen ? '关闭 AI 助手' : '打开 AI 助手'}
            >
              <i className={`fas ${isPanelOpen ? 'fa-chevron-right' : 'fa-comment-dots'}`}></i>
              {!isPanelOpen && <span>AI 助手</span>}
            </button>
          </div>

          {/* AI 对话面板 */}
          {isPanelOpen && <AISidePanel onGraphUpdate={handleGraphUpdate} />}
        </div>
      </div>

      <Footer />
    </div>
  );
}