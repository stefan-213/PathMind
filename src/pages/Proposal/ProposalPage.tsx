import { Link } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import './ProposalPage.scss';

export function ProposalPage() {
  return (
    <div className="proposal-page">
      <Header />

      <main className="main-container">
        {/* Breadcrumb */}
        {/* <div className="breadcrumb">
          <Link to="/">首页</Link>
          <span>›</span>
          <Link to="/copilot">AI Copilot</Link>
          <span>›</span>
          <span>技术方案详情</span>
        </div> */}

        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-title-section">
              <div className="page-badge"><i className="fas fa-robot"></i> AI 应用开发</div>
              <h1 className="page-title">RAG 知识库问答系统</h1>
              <p className="page-desc">
                基于 RAG 技术的知识库问答系统，适合构建企业知识库、产品文档问答等场景。
              </p>
              <div className="page-meta">
                <div className="page-meta-item">
                  <span><i className="fas fa-clock"></i></span> 预计学习周期：2-4 周
                </div>
                <div className="page-meta-item">
                  <span><i className="fas fa-signal"></i></span> 难度：中等
                </div>
                <div className="page-meta-item">
                  <span><i className="fas fa-bullseye"></i></span> 适合场景：知识库、文档问答
                </div>
              </div>
            </div>
            <div className="page-actions">
              <a href="#" className="btn btn-success">
                <span><i className="fas fa-rocket"></i></span> 一键克隆项目
              </a>
              <Link to="/graph" className="btn btn-secondary">
                <span><i className="fas fa-project-diagram"></i></span> 查看知识图谱
              </Link>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Main Content */}
          <div className="main-content">
            {/* Tech Stack */}
            <div className="section">
              <div className="section-title"><i className="fas fa-tools"></i> 推荐技术栈</div>
              <div className="tech-stack-grid">
                <div className="tech-stack-item">
                  <div className="tech-stack-icon"><i className="fab fa-python"></i></div>
                  <div className="tech-stack-name">Python</div>
                  <div className="tech-stack-role">后端语言</div>
                </div>
                <div className="tech-stack-item">
                  <div className="tech-stack-icon"><i className="fas fa-link"></i></div>
                  <div className="tech-stack-name">LangChain</div>
                  <div className="tech-stack-role">RAG 框架</div>
                </div>
                <div className="tech-stack-item">
                  <div className="tech-stack-icon"><i className="fas fa-book"></i></div>
                  <div className="tech-stack-name">LlamaIndex</div>
                  <div className="tech-stack-role">数据索引</div>
                </div>
                <div className="tech-stack-item">
                  <div className="tech-stack-icon"><i className="fas fa-fire"></i></div>
                  <div className="tech-stack-name">FastAPI</div>
                  <div className="tech-stack-role">API 框架</div>
                </div>
                <div className="tech-stack-item">
                  <div className="tech-stack-icon"><i className="fas fa-database"></i></div>
                  <div className="tech-stack-name">Chroma</div>
                  <div className="tech-stack-role">向量数据库</div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="section">
              <div className="section-title"><i className="fas fa-chart-bar"></i> 技术方案对比</div>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>维度</th>
                    <th style={{ width: '40%' }}>
                      <span className="tech-name recommended">方案一：LangChain + Chroma</span>
                      <span className="badge">推荐</span>
                    </th>
                    <th style={{ width: '40%' }}>
                      <span className="tech-name">方案二：LlamaIndex + Pinecone</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>上手难度</strong></td>
                    <td>⭐⭐ 简单</td>
                    <td>⭐⭐⭐ 中等</td>
                  </tr>
                  <tr>
                    <td><strong>中文支持</strong></td>
                    <td><span className="check-icon">✓</span> 好</td>
                    <td><span className="check-icon">✓</span> 好</td>
                  </tr>
                  <tr>
                    <td><strong>成本</strong></td>
                    <td>免费（本地）</td>
                    <td>需付费云服务</td>
                  </tr>
                  <tr>
                    <td><strong>定制化</strong></td>
                    <td><span className="check-icon">✓</span> 灵活</td>
                    <td><span className="check-icon">✓</span> 灵活</td>
                  </tr>
                  <tr>
                    <td><strong>社区活跃</strong></td>
                    <td><span className="check-icon">✓</span> 非常活跃</td>
                    <td><span className="check-icon">✓</span> 活跃</td>
                  </tr>
                  <tr>
                    <td><strong>推荐度</strong></td>
                    <td>⭐⭐⭐⭐⭐</td>
                    <td>⭐⭐⭐⭐</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Learning Path */}
            <div className="section">
              <div className="section-title"><i className="fas fa-map-marker-alt"></i> 推荐学习路径</div>
              <div className="path-timeline">
                <div className="path-item recommended">
                  <div className="path-phase">第 1 阶段（推荐）</div>
                  <div className="path-title">RAG 基础 + 项目实战</div>
                  <div className="path-desc">
                    直接开始做项目，遇到问题再查文档。这是最快的方式，适合有 Python 基础的同学。
                  </div>
                  <div className="path-duration"><i className="fas fa-clock"></i> 1-2 周</div>
                </div>
                <div className="path-item">
                  <div className="path-phase">第 2 阶段</div>
                  <div className="path-title">LangChain 深入</div>
                  <div className="path-desc">
                    学习 LangChain 的核心概念：Chain、Agent、Memory、Tool 等。
                  </div>
                  <div className="path-duration"><i className="fas fa-clock"></i> 1 周</div>
                </div>
                <div className="path-item">
                  <div className="path-phase">第 3 阶段</div>
                  <div className="path-title">向量数据库深入</div>
                  <div className="path-desc">
                    了解向量检索原理，学习优化检索效果的方法。
                  </div>
                  <div className="path-duration"><i className="fas fa-clock"></i> 1 周</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Quick Start */}
            <div className="sidebar-card">
              <div className="sidebar-title"><i className="fas fa-rocket"></i> 快速开始</div>
              <div className="quick-start-list">
                <a href="#" className="quick-start-item">
                  <span className="quick-start-icon"><i className="fas fa-code-branch"></i></span>
                  <span className="quick-start-text">克隆模板项目</span>
                  <span className="quick-start-arrow">→</span>
                </a>
                <a href="#" className="quick-start-item">
                  <span className="quick-start-icon"><i className="fas fa-play-circle"></i></span>
                  <span className="quick-start-text">查看 Demo</span>
                  <span className="quick-start-arrow">→</span>
                </a>
                <a href="#" className="quick-start-item">
                  <span className="quick-start-icon"><i className="fas fa-file-alt"></i></span>
                  <span className="quick-start-text">运行示例代码</span>
                  <span className="quick-start-arrow">→</span>
                </a>
                <Link to="/copilot" className="quick-start-item">
                  <span className="quick-start-icon"><i className="fas fa-comments"></i></span>
                  <span className="quick-start-text">问 AI 问题</span>
                  <span className="quick-start-arrow">→</span>
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div className="sidebar-card">
              <div className="sidebar-title"><i className="fas fa-book"></i> 学习资源</div>
              <div className="resource-list">
                <a href="#" className="resource-item">
                  <i className="fas fa-book"></i> LangChain 官方文档
                </a>
                <a href="#" className="resource-item">
                  <i className="fas fa-play-circle"></i> RAG 入门视频教程
                </a>
                <a href="#" className="resource-item">
                  <i className="fas fa-comments"></i> 中文社区问答
                </a>
                <a href="#" className="resource-item">
                  <i className="fas fa-folder"></i> GitHub Awesome RAG
                </a>
              </div>
            </div>

            {/* Related */}
            <div className="sidebar-card">
              <div className="sidebar-title"><i className="fas fa-link"></i> 相关技术</div>
              <div className="tags-list">
                <span className="tag">Agent</span>
                <span className="tag">Fine-tuning</span>
                <span className="tag">向量数据库</span>
                <span className="tag">Embedding</span>
                <span className="tag">Prompt 工程</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer tagline="帮你做技术选择的 AI 工具" />
    </div>
  );
}
