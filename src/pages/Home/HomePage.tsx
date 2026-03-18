import { Link } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card } from '../../components/common/Card';
import './HomePage.css';
import sampleImage from '../../assets/img/sample.png';

export function HomePage() {
  return (
    <div className="home-page">
      <Header />

      {/* Hero */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-rocket"></i> 帮你做技术选择与计划的 AI 工具
          </div>
          <h1>
            技术选错了？<br />
            <span>让 AI 帮你决策</span>
          </h1>
          <p className="hero-desc">
            不只是给你一条路，而是帮你分析该选哪个、为什么选。
            结构化对比 + 推荐理由 + 一键开始，让技术选择不再纠结。
          </p>
          <div className="hero-cta">
            <Link to="/copilot" className="btn btn-primary">
              <i className="fas fa-rocket"></i> 立即体验
            </Link>
            <Link to="/graph" className="btn btn-secondary">
              <i className="fas fa-layer-group"></i> 查看图谱
            </Link>
          </div>

          {/* Stats */}
          {/* <div className="stats">
            <div className="stat-item">
              <span className="stat-number">20,000+</span>
              <div className="stat-label">用户</div>
            </div>
            <div className="stat-item">
              <span className="stat-number">1,600+</span>
              <div className="stat-label">技术栈</div>
            </div>
            <div className="stat-item">
              <span className="stat-number">1,300+</span>
              <div className="stat-label">学习路径</div>
            </div>
          </div> */}

          {/* Screenshot */}
          <div className="screenshot">
            <img
              src={sampleImage}
              alt="PathMind 产品预览"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Steps */}
        <section>
          <div className="section-header">
            <h2>简单三步</h2>
          </div>
          <div className="steps-grid">
            <Card className="step-card" padding="lg">
              <span className="step-badge">步骤 1</span>
              <div className="step-icon"><i className="fas fa-bullseye"></i></div>
              <h3>输入目标</h3>
              <p>告诉 AI 你的学习目标，如"我想做 AI 应用"</p>
            </Card>
            <Card className="step-card" padding="lg">
              <span className="step-badge">步骤 2</span>
              <div className="step-icon"><i className="fas fa-clipboard-list"></i></div>
              <h3>问答了解</h3>
              <p>通过几个简单问题，了解你的场景和偏好</p>
            </Card>
            <Card className="step-card" padding="lg">
              <span className="step-badge">步骤 3</span>
              <div className="step-icon"><i className="fas fa-rocket"></i></div>
              <h3>生成计划</h3>
              <p>获得对比方案、推荐理由和可执行的任务清单</p>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="section-header">
            <h2>强大功能</h2>
          </div>
          <div className="features-grid">
            <Card className="feature-item" padding="lg">
              <div className="feature-icon"><i className="fas fa-brain"></i></div>
              <h4>AI 智能决策</h4>
              <p>输入你的目标，AI 帮你分析该选哪个、为什么选。</p>
            </Card>
            <Card className="feature-item" padding="lg">
              <div className="feature-icon"><i className="fas fa-table"></i></div>
              <h4>结构化对比</h4>
              <p>不做模糊推荐，直接给你表格对比，维度清晰。</p>
            </Card>
            <Card className="feature-item" padding="lg">
              <div className="feature-icon"><i className="fas fa-tasks"></i></div>
              <h4>任务执行</h4>
              <p>生成可执行的任务清单，每天该学什么一目了然。</p>
            </Card>
            <Card className="feature-item" padding="lg">
              <div className="feature-icon"><i className="fas fa-project-diagram"></i></div>
              <h4>知识图谱</h4>
              <p>可视化技术节点关系，理解技术之间的关联。</p>
            </Card>
            <Card className="feature-item" padding="lg">
              <div className="feature-icon"><i className="fas fa-route"></i></div>
              <h4>路径规划</h4>
              <p>BFS 算法找到最短学习路径，高效学习。</p>
            </Card>
            <Card className="feature-item" padding="lg">
              <div className="feature-icon"><i className="fas fa-history"></i></div>
              <h4>进度追踪</h4>
              <p>记录你的学习轨迹，见证每一次进步。</p>
            </Card>
          </div>
        </section>

        {/* Split Section */}
        <section>
          <div className="split-section">
            <div className="split-left">
              <h2>为什么选择 PathMind</h2>
              <p>它给你一条路，但我们需要的是"该选哪个"的决策。不只是给建议，而是陪你做到结果。</p>
            </div>
            <div className="split-right">
              <ul className="check-list">
                <li><i className="fas fa-check-circle"></i> 结构化对比 <span className="highlight">清晰</span></li>
                <li><i className="fas fa-check-circle"></i> 推荐理由 <span className="highlight">充分</span></li>
                <li><i className="fas fa-check-circle"></i> 任务可执行 <span className="highlight">落地</span></li>
                <li><i className="fas fa-check-circle"></i> 记忆用户 <span className="highlight">持久</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="section-header">
            <h2>常见问题</h2>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-question">
                PathMind 和 ChatGPT 有什么区别？
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="faq-answer">
                ChatGPT 给一条路，但我们需要的是"该选哪个"的决策。PathMind 提供结构化对比、推荐理由和可执行的任务清单。
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                如何开始使用？
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="faq-answer">
                很简单！点击"立即体验"，输入你的学习目标（如"我想做 AI 应用"），AI 会引导你完成整个流程。
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                数据安全吗？
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="faq-answer">
                是的！我们使用本地存储，所有数据都保存在你的浏览器中，不会上传到服务器。
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                支持哪些学习目标？
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="faq-answer">
                目前支持 AI 应用开发、企业官网、前端学习等多种场景。还在持续更新中！
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="final-cta">
            <h2>准备好规划你的技术路径了吗？</h2>
            <p>加入数千名开发者，立即使用 PathMind。</p>
            <Link to="/copilot" className="btn-cta-white">
              立即开始
            </Link>
          </div>
        </section>
      </main>

      <Footer tagline="基于图结构推理的 AI 技术路径推荐系统" />
    </div>
  );
}
