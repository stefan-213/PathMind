import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as d3 from 'd3';
import { Header, Footer } from '../../components/layout';
import { Card } from '../../components/common';
import { getUserProfile } from '../../utils/storage';
import {
  getFilteredGraphData,
  getGoalName,
  getCategoryName,
  categoryColors,
  categoryStats,
  type GraphNode,
  type GraphEdge
} from '../../data/graphData';
import './GraphPage.scss';

interface D3Node extends d3.SimulationNodeDatum, GraphNode {
  isCore: boolean;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  type?: string;
}

export function GraphPage() {
  const [searchParams] = useSearchParams();
  const goalParam = searchParams.get('goal') || '';

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [pathResult, setPathResult] = useState<D3Node[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const profile = getUserProfile();
  const goal = goalParam || profile?.goal || '';

  const graphData = useMemo(() => getFilteredGraphData(goal), [goal]);

  // 初始化 D3 图谱
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 清空之前的图谱
    svg.selectAll('*').remove();

    // 准备数据
    const nodeIds = new Set(graphData.corePath);
    const nodes: D3Node[] = graphData.nodes.map(n => ({
      ...n,
      isCore: nodeIds.has(n.id),
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links: D3Link[] = graphData.edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        type: e.type,
      }));

    // 创建容器组
    const g = svg.append('g');

    // 缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 力导向模拟
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // 边
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => categoryColors[d.source.category || 'basic']);

    // 节点组
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active && physicsEnabled) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active && physicsEnabled) simulation.alphaTarget(0);
          if (!physicsEnabled) {
            d.fx = null;
            d.fy = null;
          }
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // 节点圆圈
    node.append('circle')
      .attr('r', d => d.isCore ? 28 : 22)
      .attr('fill', d => categoryColors[d.category])
      .attr('stroke', d => d.isCore ? '#10b981' : '#fff')
      .attr('stroke-width', d => d.isCore ? 4 : 2);

    // 节点图标/文字
    node.append('text')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', d => d.isCore ? 12 : 10)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text(d => d.label.substring(0, 6));

    // 节点标签
    node.append('text')
      .attr('dy', d => (d.isCore ? 28 : 22) + 14)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-text')
      .text(d => d.label);

    // 悬停效果
    node
      .on('mouseenter', function(event, d) {
        setHoveredNode(d);
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.isCore ? 32 : 26);
      })
      .on('mouseleave', function(event, d) {
        setHoveredNode(null);
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.isCore ? 28 : 22);
      });

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 存储 simulation 引用供后续使用
    (svgRef.current as any).simulation = simulation;
    (svgRef.current as any).nodeElements = node;

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  // 高亮相关节点
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const nodeElements = svg.selectAll('.node');
    const linkElements = svg.selectAll('.link');

    if (hoveredNode) {
      const connectedIds = new Set<string>();
      connectedIds.add(hoveredNode.id);

      graphData.edges.forEach(edge => {
        if (edge.source === hoveredNode.id) connectedIds.add(edge.target);
        if (edge.target === hoveredNode.id) connectedIds.add(edge.source);
      });

      nodeElements.each(function(d: any) {
        if (connectedIds.has(d.id)) {
          d3.select(this).style('opacity', 1);
        } else {
          d3.select(this).style('opacity', 0.2);
        }
      });

      linkElements.each(function(d: any) {
        if (d.source.id === hoveredNode.id || d.target.id === hoveredNode.id) {
          d3.select(this)
            .style('opacity', 1)
            .attr('stroke-width', 3);
        } else {
          d3.select(this).style('opacity', 0.1);
        }
      });
    } else {
      nodeElements.style('opacity', 1);
      linkElements.style('opacity', 1).attr('stroke-width', 2);
    }
  }, [hoveredNode, graphData]);

  // 高亮路径
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const linkElements = svg.selectAll('.link');

    if (pathResult) {
      linkElements.each(function(d: any) {
        const idx1 = pathResult.findIndex(n => n.id === d.source.id);
        const idx2 = pathResult.findIndex(n => n.id === d.target.id);
        if (Math.abs(idx1 - idx2) === 1) {
          d3.select(this)
            .attr('class', 'link highlighted')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 3);
        }
      });
    } else {
      linkElements.attr('class', 'link').attr('stroke-width', 2);
    }
  }, [pathResult, graphData]);

  // 缩放控制
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (direction === 'reset') {
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
    } else {
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        direction === 'in' ? 1.3 : 0.7
      );
    }
  };

  // 物理效果切换
  const togglePhysics = () => {
    if (!svgRef.current) return;
    const simulation: d3.Simulation<D3Node> = (svgRef.current as any).simulation;

    if (physicsEnabled) {
      simulation.alphaTarget(0);
      simulation.stop();
    } else {
      simulation.alphaTarget(0.3).restart();
    }
    setPhysicsEnabled(!physicsEnabled);
  };

  // BFS 路径查找
  const findPath = useCallback((startId: string, endId: string): D3Node[] | null => {
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === endId) {
        return path.map(id => graphData.nodes.find(n => n.id === id) as D3Node);
      }

      graphData.edges.forEach(edge => {
        let next: string | null = null;
        if (edge.source === current && !visited.has(edge.target)) {
          next = edge.target;
        } else if (edge.target === current && !visited.has(edge.source)) {
          next = edge.source;
        }

        if (next) {
          visited.add(next);
          queue.push([...path, next]);
        }
      });
    }

    return null;
  }, [graphData]);

  // AI 搜索
  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    setLoading(true);

    // 模拟 AI 处理
    setTimeout(() => {
      // 简单演示：找到 Python 到 RAG 的路径
      const path = findPath('python', 'rag');
      if (path) {
        setPathResult(path);
      }
      setLoading(false);
    }, 1500);
  };

  // 聚焦节点
  const focusNode = (nodeId: string) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const node = graphData.nodes.find(n => n.id === nodeId);

    if (node) {
      setSelectedNode(node as D3Node);

      // 移动视图到节点
      svg.transition()
        .duration(500)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity.translate(400, 300).scale(1.5)
        );
    }
  };

  // 分类筛选
  const filteredNodes = useMemo(() => {
    let nodes = graphData.nodes;

    if (activeCategory !== 'all') {
      nodes = nodes.filter(n => n.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(n =>
        n.label.toLowerCase().includes(query) ||
        n.name.toLowerCase().includes(query)
      );
    }

    return nodes;
  }, [graphData, activeCategory, searchQuery]);

  // 显示全部节点
  const showAllNodes = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('.node').style('opacity', 1);
    svg.selectAll('.link').style('opacity', 1);
    setActiveCategory('all');
    setSearchQuery('');
    handleZoom('reset');
  };

  return (
    <div className="graph-page">
      <Header />

      <div className="graph-main">
        {/* Page Header */}
        <div className="graph-header">
          <h1 className="graph-title"><i className="fas fa-project-diagram"></i> 知识图谱</h1>
          <p className="graph-desc">
            {goal ? `学习目标: ${getGoalName(goal)}` : '探索技术知识之间的关联'}
          </p>
        </div>

        {/* Main Container */}
        <div className="graph-main-container">
          {/* Sidebar */}
          <aside className="graph-sidebar">
            {/* <div className="sidebar-section">
              <div className="sidebar-title">🔍 搜索节点</div>
              <input
                type="text"
                className="search-box"
                placeholder="搜索技术、概念..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div> */}

            <div className="sidebar-section">
              <div className="sidebar-title"><i className="fas fa-folder"></i> 技术分类</div>
              <div className="category-list">
                <button
                  className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                >
                  <span><i className="fas fa-globe"></i> 全部技术</span>
                  <span className="count">{graphData.nodes.length}</span>
                </button>
                <button
                  className={`category-btn ${activeCategory === 'frontend' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('frontend')}
                >
                  <span><i className="fas fa-paint-brush"></i> 前端</span>
                  <span className="count">{categoryStats.frontend}</span>
                </button>
                <button
                  className={`category-btn ${activeCategory === 'backend' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('backend')}
                >
                  <span><i className="fas fa-cogs"></i> 后端</span>
                  <span className="count">{categoryStats.backend}</span>
                </button>
                <button
                  className={`category-btn ${activeCategory === 'ai' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('ai')}
                >
                  <span><i className="fas fa-robot"></i> AI</span>
                  <span className="count">{categoryStats.ai}</span>
                </button>
                <button
                  className={`category-btn ${activeCategory === 'devops' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('devops')}
                >
                  <span><i className="fas fa-rocket"></i> DevOps</span>
                  <span className="count">{categoryStats.devops}</span>
                </button>
                <button
                  className={`category-btn ${activeCategory === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('basic')}
                >
                  <span><i className="fas fa-book"></i> 基础</span>
                  <span className="count">{categoryStats.basic}</span>
                </button>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title"><i className="fas fa-star"></i> 热门节点</div>
              <div className="hot-nodes">
                {['react', 'vue', 'langchain', 'rag', 'nextjs', 'python'].map(id => (
                  <span
                    key={id}
                    className="node-tag"
                    onClick={() => focusNode(id)}
                  >
                    {graphData.nodes.find(n => n.id === id)?.label || id}
                  </span>
                ))}
              </div>
            </div>

            {/* <div className="sidebar-section ai-search-section">
              <div className="sidebar-title">💬 AI 智能搜索</div>
              <div className="ai-input-wrapper">
                <textarea
                  className="ai-input"
                  placeholder="例如：我想做 AI 应用，应该学什么？"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAISearch();
                    }
                  }}
                />
                <button
                  className="ai-search-btn"
                  onClick={handleAISearch}
                  disabled={loading}
                >
                  {loading ? '...' : '→'}
                </button>
              </div>
              <p className="ai-hint"><i className="fas fa-lightbulb"></i> AI 会分析你的目标，推荐技术路径并解释原因</p>
            </div> */}
          </aside>

          {/* Graph Container */}
          <div className="graph-wrapper" ref={containerRef}>
            {/* Controls */}
            <div className="graph-controls">
              <button className="control-btn" onClick={() => handleZoom('in')} title="放大">+</button>
              <button className="control-btn" onClick={() => handleZoom('out')} title="缩小">−</button>
              <button className="control-btn" onClick={() => handleZoom('reset')} title="重置视图">↺</button>
              <button
                className={`control-btn ${physicsEnabled ? 'active' : ''}`}
                onClick={togglePhysics}
                title="切换物理效果"
              >
                <i className="fas fa-bolt"></i>
              </button>
              {goal && (
                <button
                  className="control-btn"
                  onClick={showAllNodes}
                  title="显示全部"
                >
                  <i className="fas fa-eye"></i>
                </button>
              )}
            </div>

            {/* Legend */}
            <div className="graph-legend">
              <div className="legend-title">图例</div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                <span>前端</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                <span>后端</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span>AI</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                <span>DevOps</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#64748b' }}></span>
                <span>基础</span>
              </div>
              <div className="legend-item recommended">
                <span className="legend-dot" style={{ border: '3px solid #10b981', background: 'transparent' }}></span>
                <span>推荐路径</span>
              </div>
            </div>

            {/* SVG Graph */}
            <svg ref={svgRef} className="graph-svg" />

            {/* Loading */}
            {loading && (
              <div className="loading-overlay show">
                <div className="spinner"></div>
              </div>
            )}

            {/* Node Detail Panel */}
            {selectedNode && (
              <div className="node-detail-panel show">
                <button className="btn-close" onClick={() => setSelectedNode(null)}>×</button>
                <div className="node-detail-header">
                  <div className="node-detail-icon"><i className={selectedNode.icon}></i></div>
                  <div className="node-detail-title">{selectedNode.label}</div>
                  <div className="node-detail-category">{getCategoryName(selectedNode.category)}</div>
                </div>
                <div className="node-detail-body">
                  <p className="node-detail-desc">{selectedNode.desc}</p>
                  <div className="node-meta">
                    <div className="meta-item">
                      <div className="meta-value">{selectedNode.difficulty}</div>
                      <div className="meta-label">难度</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-value">{selectedNode.heat}</div>
                      <div className="meta-label">热度</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-value">{selectedNode.scene}</div>
                      <div className="meta-label">场景</div>
                    </div>
                  </div>
                  <div className="node-tags">
                    {selectedNode.tags.map(tag => (
                      <span key={tag} className="node-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="node-actions">
                    <Link to="/copilot" className="btn btn-primary">开始学习</Link>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        // 展开关联节点
                        const relatedNodes = graphData.edges
                          .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                          .flatMap(e => [e.source, e.target]);
                        console.log('关联节点:', relatedNodes);
                      }}
                    >
                      展开关联
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Path Result Panel */}
            {pathResult && (
              <div className="path-panel show">
                <div className="path-header">
                  <span className="path-title"><i className="fas fa-route"></i> AI 推荐路径</span>
                  <button className="btn-close" onClick={() => setPathResult(null)}>×</button>
                </div>
                <div className="path-content">
                  {pathResult.map((node, index) => (
                    <div key={node.id} className="path-node-wrapper">
                      <span className="path-node"><i className={node.icon}></i> {node.label}</span>
                      {index < pathResult.length - 1 && <span className="path-arrow">→</span>}
                    </div>
                  ))}
                  <p className="path-explain">
                    <strong><i className="fas fa-lightbulb"></i> AI 建议：</strong>
                    这是最适合你的学习路径，从 {pathResult[0]?.label} 开始，逐步掌握 {pathResult[pathResult.length - 1]?.label}。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {/* <div className="graph-stats">
          <Card className="stat-card">
            <div className="stat-value">{graphData.nodes.length}</div>
            <div className="stat-label">知识点</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-value">{graphData.edges.length}</div>
            <div className="stat-label">关联关系</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-value">{graphData.corePath.length}</div>
            <div className="stat-label">推荐路径</div>
          </Card>
        </div> */}
      </div>

      <Footer />
    </div>
  );
}
