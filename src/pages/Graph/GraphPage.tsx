/**
 * 知识图表页面
 * 支持 AI 生成图表
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { GraphCanvas } from './GraphCanvas';
import { AISidePanel } from './AISidePanel';
import type { GraphNode } from '../../types/graph';
import { charts } from '../../api/graph';
// import { conversationApi } from '../../api/useApi';
// import { mockGraphXml } from '../../api/mock';
import './GraphPage.scss';

export function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // AI 生成图表 XML 数据
  // const graphXml = mockGraphXml;
  const [graphXml, setGraphXml] = useState<string | null>(null);
  // console.log('【GraphPage】render, graphXml:', graphXml ? graphXml.substring(0, 100) + '...' : null);

  // // 加载状态
  // const [isLoading, setIsLoading] = useState(false);

  // // 发送消息并处理响应
  // const handleSendMessage = useCallback(async (message: string) => {
  //   if (!message.trim() || isLoading) return;

  //   setIsLoading(true);

  //   try {
  //     const res = await conversationApi.chatStream({
  //       agentId: '100001',
  //       sessionId: '',
  //       message: message.trim(),
  //     });

  //     const response = res.data;
  //     if (!response) {
  //       throw new Error('AI 响应数据异常');
  //     }

  //     // 原始消息内容
  //     const rawContent = response.message || '';

  //     // 去掉 think 标签内容，从剩余内容中提取 XML
  //     const contentWithoutThink = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  //     console.log('【GraphPage】contentWithoutThink:', contentWithoutThink.substring(0, 200));

  //     // 从剩余内容中提取 mxfile XML
  //     const xmlMatch = contentWithoutThink.match(/<mxfile[\s\S]*?<\/mxfile>/);
  //     const xmlData = xmlMatch ? xmlMatch[0] : '';
  //     console.log('【GraphPage】提取到 xmlData:', xmlData ? '是' : '否', xmlData ? xmlData.substring(0, 100) + '...' : '');

  //     // 如果提取到 XML，更新图表
  //     if (xmlData) {
  //       console.log('【GraphPage】设置 graphXml');
  //       setGraphXml(xmlData);
  //     } else {
  //       console.log('【GraphPage】未提取到 XML 数据');
  //     }
  //   } catch (err) {
  //     console.error('Chat error:', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [isLoading]);

  // 确保页面滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, []);

  // 检查是否有咨询方案数据，如果有则调用 charts API
  useEffect(() => {
    // TODO: 暂时使用静态数据，如需启用接口则取消注释下方代码
    const chartDataStr = localStorage.getItem('pathmind_consult_chart');
    console.log('【GraphPage】charts useEffect, chartDataStr:', chartDataStr ? '有数据' : '无数据');
    if (chartDataStr) {
      try {
        const chartData = JSON.parse(chartDataStr);
        console.log('【GraphPage】chartData:', chartData);
        // 使用固定 agentId 100004 调用 charts API
        charts({ ...chartData, agentId: '100004', sessionId: '' }).then((res) => {
          console.log('【GraphPage】Charts API response:', res);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = res as any;
          console.log('【GraphPage】response?.data:', response?.data);
    
          // 解析 content 字段获取数据
          if (response?.data?.content) {
            const contentData = response.data.content;
            console.log('【GraphPage】contentData 类型:', typeof contentData);
    
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let contentObj: any;
    
              if (typeof contentData === 'string') {
                // 去掉 think 标签内容
                const contentWithoutThink = contentData.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
                // 尝试直接解析
                try {
                  contentObj = JSON.parse(contentWithoutThink);
                  console.log('【GraphPage】直接解析 JSON 成功');
                } catch {
                  // 查找 {"xml": 的位置
                  const jsonStart = contentWithoutThink.indexOf('{"xml":');
                  if (jsonStart !== -1) {
                    // 找到匹配的结束括号
                    let braceCount = 0;
                    let jsonEnd = -1;
    
                    for (let i = jsonStart; i < contentWithoutThink.length; i++) {
                      if (contentWithoutThink[i] === '{') braceCount++;
                      else if (contentWithoutThink[i] === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                          jsonEnd = i;
                          break;
                        }
                      }
                    }
    
                    if (jsonEnd !== -1) {
                      const jsonStr = contentWithoutThink.substring(jsonStart, jsonEnd + 1);
                      console.log('【GraphPage】提取的 JSON 长度:', jsonStr.length);
                      contentObj = JSON.parse(jsonStr);
                    }
                  }
                }
              } else {
                contentObj = contentData;
              }
    
              console.log('【GraphPage】contentObj keys:', contentObj ? Object.keys(contentObj) : 'null');
    
              // 提取 XML 数据
              if (contentObj?.xml) {
                console.log('【GraphPage】成功获取 XML，长度:', contentObj.xml.length);
                if (contentObj.xml.includes('<mxGraphModel')) {
                  setGraphXml(contentObj.xml);
                }
              } else {
                console.log('【GraphPage】content 中没有 xml 字段');
              }
    
              // 提取 data 数据，传递给 task 页面
              if (contentObj?.data && Array.isArray(contentObj.data)) {
                console.log('【GraphPage】成功获取 data，长度:', contentObj.data.length);
                localStorage.setItem('pathmind_plan_data', JSON.stringify(contentObj.data));
              }
            } catch (e) {
              console.log('【GraphPage】content 解析失败:', e);
            }
          }
    
          // 清空 localStorage
          localStorage.removeItem('pathmind_consult_chart');
        }).catch((err) => {
          console.error('Charts API error:', err);
          localStorage.removeItem('pathmind_consult_chart');
        });
      } catch (err) {
        console.error('Parse chart data error:', err);
        localStorage.removeItem('pathmind_consult_chart');
      }
    }

  }, []);

  return (
    <div className="graph-page" ref={pageRef}>
      <Header />

      <div className="graph-main">
        {/* Page Header */}
        {/* <div className="graph-header">
          <h1 className="graph-title">
            <i className="fas fa-project-diagram"></i>
            {graphXml ? 'AI 生成图谱' : '知识图表'}
          </h1>
          <p className="graph-desc">
            {goalParam || '探索技术知识之间的关联'}
          </p>
        </div> */}

        {/* Main Container */}
        <div className="graph-main-container">
          {/* Graph Container */}
          <div className="graph-wrapper with-ai-panel">
            {/* AI 图谱标题 */}
            {/* {graphXml && (
              <div className="ai-graph-title">
                <i className="fas fa-chart-pie"></i> 前端开发学习路线图
              </div>
            )} */}

            {/* 返回知识图表按钮 */}
            {/* {graphXml && (
              <button
                className="back-to-knowledge-btn"
                onClick={() => setGraphXml(null)}
                title="返回知识图表"
              >
                <i className="fas fa-arrow-left"></i> 返回知识图表
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

          </div>

          {/* AI 对话面板 - 默认展开 */}
          <AISidePanel
              hasInitialGraph={Boolean(graphXml)}
            />
        </div>
      </div>
    </div>
  );
}
