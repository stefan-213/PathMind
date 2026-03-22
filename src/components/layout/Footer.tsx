import { Link } from 'react-router-dom';
import './Footer.scss';

interface FooterProps {
  tagline?: string;
}

export function Footer({ tagline = '基于图结构推理的 AI 技术路径推荐系统' }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <i className="fas fa-code-branch"></i> PathMind
      </div>
      <div className="footer-tagline">{tagline}</div>
      <div className="footer-links">
        <Link to="/">首页</Link>
        <Link to="/copilot">AI Copilot</Link>
        <Link to="/graph">知识图谱</Link>
        <Link to="/tasks">我的任务</Link>
      </div>
      <div className="footer-copy">© 2024 PathMind. All rights reserved.</div>
    </footer>
  );
}
