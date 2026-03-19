import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Header, Footer } from '../../components/layout';
import { Card } from '../../components/common/Card';
import './HomePage.css';
import sampleImage from '../../assets/img/sample.png';

const faqData = [
  {
    question: '什么是 PathMind？',
    answer: 'PathMind 是一个 AI 技术选型与学习路径规划平台。通过问答形式了解你的需求，帮你分析该如何实现自己的目标、学什么技术、为什么选、怎么学，生成可执行的学习计划和任务清单。'
  },
  {
    question: '如何开始使用？',
    answer: '很简单！点击"立即体验"，输入你的目标（如"我想XXXXX"），回答几个简单问题，AI 就会为你生成专属的技术方案和学习计划。'
  },
  {
    question: 'PathMind 有什么不同？',
    answer: '不同于泛泛的建议，PathMind 提供：结构化对比（让你看清利弊）、推荐理由（充分有据）、可执行的任务清单（照做就行）、持久的学习记忆（陪你拿到结果）。'
  },
  {
    question: '这个服务收费吗？',
    answer: 'PathMind 目前完全免费使用！我们希望帮助更多开发者做出更好的技术决策，让学习之路更高效。'
  },
  {
    question: '零基础也能用吗？',
    answer: '完全可以！PathMind 会根据你的基础水平定制方案。无论你是转行、在职学习还是初学者，都能找到适合你的学习路径。'
  },
  {
    question: '推荐的技术栈会过时吗？',
    answer: '我们会定期更新技术栈数据，结合市场需求、薪资水平和行业发展趋势，确保推荐的技术具有长期价值和就业竞争力。'
  }
];

export function HomePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <div className="home-page">
      <Header />

      {/* Hero */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-rocket"></i> 帮你实现目标的 AI 工具
          </div>
          <h1>
            想做点什么？<br />
            <span>让 AI 帮你规划</span>
          </h1>
          <p className="hero-desc">
            输入你的目标，AI 帮你分析该用什么技术、为什么选、怎么学。
  结构化对比 + 推荐理由 + 可执行计划，让目标实现不再困难。
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
              <p>通过几个简单问题，了解你的条件和偏好</p>
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
              <p>&nbsp;&nbsp;&nbsp;&nbsp;我们不只给泛泛的建议，更用结构化对比让你看清利弊，用充分的理由让你信服，用可执行的任务让你行动，用持久的记忆陪你拿到结果。</p>
            </div>
            <div className="split-right">
              <ul className="check-list">
                <li><i className="fas fa-check-circle"></i> 终结选择困难 <span className="highlight">（决策）</span></li>
                <li><i className="fas fa-check-circle"></i> 节省 80% 时间 <span className="highlight">（效率）</span></li>
                <li><i className="fas fa-check-circle"></i> 任务可执行 <span className="highlight">（落地）</span></li>
                <li><i className="fas fa-check-circle"></i> 为你量身定制 <span className="highlight">（个性）</span></li>
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
            {faqData.map((item, index) => (
              <div key={index} className="faq-item">
                <div
                  className={`faq-question ${openIndex === index ? 'open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  {item.question}
                  <i className={`fas fa-chevron-${openIndex === index ? 'up' : 'down'}`}></i>
                </div>
                <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                  {item.answer}
                </div>
              </div>
            ))}
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
