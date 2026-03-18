import { useState, useEffect } from 'react';
import { Header, Footer } from '../../components/layout';
import { quickTags, questionnaireData, resultsData } from '../../data/copilotData';
import { saveUserGoal, saveUserAnswers, saveUserProfile, saveUserTasks, getUserProfile, getUserProgress, hasActivePlan, clearUserData } from '../../utils/storage';
import type { ResultData, Task, Question } from '../../types/copilot';
import './CopilotPage.css';

type Step = 1 | 2 | 3;

// ========== Steps 组件 ==========
function Steps({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: '输入目标' },
    { num: 2, label: '问答了解' },
    { num: 3, label: '生成结果' },
  ];

  const getStatus = (stepNum: number) => {
    if (stepNum < currentStep) return 'completed';
    if (stepNum === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="steps-container">
      <div className="steps">
        {steps.map((step) => {
          const status = getStatus(step.num);
          return (
            <div key={step.num} className="step-item">
              <div className={`step-circle ${status}`}>
                {status === 'completed' ? <i className="fas fa-check"></i> : step.num}
              </div>
              <div className={`step-label ${status}`}>{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== GoalInput 组件 ==========
function GoalInput({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSubmit();
    }
  };

  return (
    <div className="goal-focus">
      <div className="focus-card">
        <h2>你的目标是什么？</h2>
        <p className="focus-desc">告诉我你想做什么，AI 会帮你分析最佳路径</p>
        <div className="goal-input-wrapper">
          <input
            type="text"
            className="goal-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：我想做 AI 应用"
          />
        </div>
        <div className="quick-tags">
          {quickTags.map((tag) => (
            <button key={tag.goal} className="tag" onClick={() => onChange(tag.goal)}>
              <i className={tag.icon} style={{ marginRight:'10px'}}></i> {tag.text}
            </button>
          ))}
        </div>
        <div className="next-button-wrapper">
          <button className="btn btn-primary" onClick={onSubmit}>
            下一步 <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== Questionnaire 组件 ==========
function Questionnaire({
  question,
  currentIndex,
  total,
  selectedIndex,
  onSelect
}: {
  question: Question;
  currentIndex: number;
  total: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="question-card">
      <div className="question-progress">问题 {currentIndex + 1} / {total}</div>
      <div className="question-text">{question.question}</div>
      <div className="options">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`option ${selectedIndex === i ? 'selected' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="option-icon"><i className={opt.icon}></i></span>
            <span className="option-text">{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== Result 组件 ==========
function Result({
  result,
  onOpenTasks,
  onOpenGraph,
  onOpenProposal,
  onRestart
}: {
  result: ResultData;
  onOpenTasks: () => void;
  onOpenGraph: () => void;
  onOpenProposal: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="result-section show">
      <div className="step-card">
        <div className="result-header">
          <div className="result-badge"><i className="fas fa-bullseye"></i> 为你推荐</div>
          <div className="result-title">{result.title}</div>
          <div className="result-desc">{result.desc}</div>
        </div>

        <div className="path-section">
          <div className="path-title"><i className="fas fa-map-marker-alt"></i> 推荐学习路径</div>
          <div className="path-flow">
            {result.path.map((p, i) => (
              <div key={i}>
                <div className="path-node">{p}</div>
                {i < result.path.length - 1 && <span className="path-arrow"><i className="fas fa-arrow-right"></i></span>}
              </div>
            ))}
          </div>
          <div className="path-branch">
            {result.branch.map((b, i) => (
              <div key={i}>
                <span className="path-arrow">{i === 0 ? '├─' : '└─'}</span>
                <div className={`branch-node ${b.recommended ? 'recommended' : ''}`}>{b.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="path-title"><i className="fas fa-table"></i> 方案对比</div>
        <table className="comparison-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>维度</th>
              <th style={{ width: '40%' }}>
                <span className="tech-name recommended">推荐方案</span>
                <span className="badge">适合你</span>
              </th>
              <th style={{ width: '40%' }}>备选方案</th>
            </tr>
          </thead>
          <tbody>
            {result.comparison.map((c, i) => (
              <tr key={i}>
                <td><strong>{c.dim}</strong></td>
                <td><span className="tech-name recommended">{c.a}</span></td>
                <td>{c.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="step-card">
        <h2>📅 学习计划</h2>
        <p className="step-desc">四周学习计划，每天 1-2 小时</p>
        <div className="schedule-grid">
          {result.schedule.map((s, i) => (
            <div key={i} className="schedule-week">
              <div className="schedule-week-title">{s.week}</div>
              <div className="schedule-items">
                {s.items.map((item, j) => {
                  const [day, content] = item.split(':');
                  return (
                    <div key={j} className="schedule-item">
                      <div className="schedule-day">{day}</div>
                      <div className="schedule-content">{content}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-card">
        <h2><i className="fas fa-rocket"></i> 一键开始</h2>
        <p className="step-desc">选择你想做的事情</p>
        <div className="actions-grid">
          <div className="action-card" onClick={onOpenTasks}>
            <div className="action-icon"><i className="fas fa-check-circle"></i></div>
            <div className="action-title">我的任务</div>
            <div className="action-desc">查看学习任务</div>
          </div>
          <div className="action-card" onClick={onOpenGraph}>
            <div className="action-icon"><i className="fas fa-project-diagram"></i></div>
            <div className="action-title">查看图谱</div>
            <div className="action-desc">探索技术关系</div>
          </div>
          <div className="action-card" onClick={onOpenProposal}>
            <div className="action-icon"><i className="fas fa-box"></i></div>
            <div className="action-title">模板项目</div>
            <div className="action-desc">开箱即用的 Demo</div>
          </div>
          <div className="action-card" onClick={onRestart}>
            <div className="action-icon"><i className="fas fa-redo"></i></div>
            <div className="action-title">重新开始</div>
            <div className="action-desc">输入新目标</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== 主页面 ==========
export function CopilotPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [goal, setGoal] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [hasContinue, setHasContinue] = useState(false);

  useEffect(() => {
    if (hasActivePlan()) {
      setHasContinue(true);
    }
  }, []);

  const getQuestionnaire = (): Question[] => {
    const lower = goal.toLowerCase();
    if (lower.includes('ai') || lower.includes('大模型') || lower.includes('llm')) {
      return questionnaireData['ai应用'];
    } else if (lower.includes('官网') || lower.includes('企业') || lower.includes('网站')) {
      return questionnaireData['企业官网'];
    } else if (lower.includes('前端') || lower.includes('学习')) {
      return questionnaireData['前端学习'];
    }
    return questionnaireData['default'];
  };

  const getResultData = (): ResultData => {
    const lower = goal.toLowerCase();
    if (lower.includes('ai') || lower.includes('大模型')) {
      return resultsData['ai应用'];
    } else if (lower.includes('官网') || lower.includes('企业')) {
      return resultsData['企业官网'];
    } else if (lower.includes('前端') || lower.includes('学习')) {
      return resultsData['前端学习'];
    }
    if (userAnswers[0] === 0) {
      return resultsData['ai应用'];
    }
    return resultsData['前端学习'];
  };

  const handleStartQuestionnaire = () => {
    if (!goal.trim()) {
      alert('请输入你的目标');
      return;
    }
    saveUserGoal(goal);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setCurrentStep(2);
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const newAnswers = [...userAnswers, index];
    setUserAnswers(newAnswers);
    saveUserAnswers(newAnswers);

    setTimeout(() => {
      const questionnaire = getQuestionnaire();
      if (currentQuestion + 1 < questionnaire.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      } else {
        showResults();
      }
    }, 400);
  };

  const showResults = () => {
    setLoading(true);
    setCurrentStep(3);
    setTimeout(() => {
      const resultData = getResultData();
      setResult(resultData);
      setLoading(false);

      const userProfile = {
        goal,
        recommendTitle: resultData.title,
        answers: userAnswers,
        createdAt: new Date().toISOString()
      };
      saveUserProfile(userProfile);

      const tasks: Task[] = [];
      let taskId = 1;
      resultData.schedule.forEach(week => {
        week.items.forEach(item => {
          const [day, content] = item.split(':');
          tasks.push({
            id: 'task_' + taskId++,
            week: week.week,
            day: day.trim(),
            title: content.trim(),
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        });
      });
      saveUserTasks(tasks);
    }, 1500);
  };

  const handleRestart = () => {
    clearUserData();
    setCurrentStep(1);
    setGoal('');
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setResult(null);
    setHasContinue(false);
  };

  const questionnaire = getQuestionnaire();
  const profile = getUserProfile();
  const progress = getUserProgress();

  return (
    <div className="copilot-page">
      <Header />

      {hasContinue && currentStep === 1 && (
        <div className="main">
          <div className="continue-banner">
            <div className="continue-info">
              <div className="continue-icon">
                <i className="fas fa-rotate-right"></i>
              </div>
              <div className="continue-text">
                <h3>继续学习：{profile?.goal}</h3>
                <p>进度 {progress.percentage}% 完成</p>
              </div>
              <div className="progress-badge">进行中</div>
            </div>
            <button className="btn btn-primary" onClick={() => window.location.href = '/tasks'}>
              继续 <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      <div className="main">
        <Steps currentStep={currentStep} />

        {currentStep === 1 && (
          <GoalInput value={goal} onChange={setGoal} onSubmit={handleStartQuestionnaire} />
        )}

        {currentStep === 2 && !loading && questionnaire[currentQuestion] && (
          <Questionnaire
            question={questionnaire[currentQuestion]}
            currentIndex={currentQuestion}
            total={questionnaire.length}
            selectedIndex={selectedOption}
            onSelect={handleSelectOption}
          />
        )}

        {loading && (
          <div className="loading show">
            <div className="spinner"></div>
            <p>AI 正在分析你的答案...</p>
          </div>
        )}

        {currentStep === 3 && result && (
          <Result
            result={result}
            onOpenTasks={() => window.location.href = '/tasks'}
            onOpenGraph={() => window.location.href = `/graph?goal=${encodeURIComponent(goal)}`}
            onOpenProposal={() => window.location.href = '/proposal'}
            onRestart={handleRestart}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
