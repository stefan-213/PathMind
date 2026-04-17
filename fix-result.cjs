const fs = require('fs');
let content = fs.readFileSync('d:/React/PathMind/src/pages/Consult/ConsultPage.tsx', 'utf8');

// 1. 修改 sendToConsultation 函数，添加 goal/base 解析
const oldSendFn = `const sendToConsultation = async (message: string, agentId: string, sessionId: string) => {
    try {
      const res = await conversationApi.consultation({ agentId, sessionId, message });
      // 拦截器转换后: res.data = { success, data: { message: string } }
      const content = res.data?.message || '';
      console.log('API response content:', content);

      // 解析 AI 回复中的思考过程和 JSON 内容
      // 格式1: {"question": "...", "options": [...]}
      // 格式2:<think>...思考内容...</think>{"question": "...", "options": [...]}
      const thinkMatch = content.match(/<think>[\\s\\S]*?<\\/think>([\\s\\S]*)$/);
      if (!thinkMatch) {
        return { thinking: '', question: '', options: [] as string[], rawContent: content };
      }

      const thinking = thinkMatch[0].replace(/<\\/think>$/, '').replace(/<think>/, '').trim();
      const jsonStr = thinkMatch[1].trim();

      try {
        const parsed = JSON.parse(jsonStr);
        return {
          thinking,
          question: parsed.question || '',
          options: parsed.options || [],
          rawContent: content
        };
      } catch {
        // JSON 解析失败，返回原始内容
        return { thinking: '', question: '', options: [], rawContent: content };
      }
    } catch (error) {
      console.error('Consultation API error:', error);
      return { thinking: '', question: '', options: [], rawContent: '' };
    }
  };`;

const newSendFn = `const sendToConsultation = async (message: string, agentId: string, sessionId: string) => {
    try {
      const res = await conversationApi.consultation({ agentId, sessionId, message });
      // 拦截器转换后: res.data = { success, data: { message: string } }
      const content = res.data?.message || '';
      console.log('API response content:', content);

      // 解析 AI 回复中的思考过程和 JSON 内容
      // 格式1: {"question": "...", "options": [...]}
      // 格式2:<think>...思考内容...</think>{"question": "...", "options": [...]}
      // 格式3: {"goal": "...", "base": "..."} (RESULT 步骤)
      let thinking = '';
      let jsonStr = content.trim();

      const thinkMatch = content.match(/<think>[\\s\\S]*?<\\/think>([\\s\\S]*)$/);
      if (thinkMatch) {
        thinking = thinkMatch[0].replace(/<\\/think>$/, '').replace(/<think>/, '').trim();
        jsonStr = thinkMatch[1].trim();
      }

      try {
        const parsed = JSON.parse(jsonStr);
        return {
          thinking,
          question: parsed.question || '',
          options: parsed.options || [],
          goal: parsed.goal || '',
          base: parsed.base || '',
          rawContent: content
        };
      } catch {
        // JSON 解析失败，如果有思考标签则返回thinking，否则返回原始内容
        if (thinking) {
          return { thinking, question: '', options: [], goal: '', base: '', rawContent: content };
        }
        return { thinking: '', question: content, options: [], goal: '', base: '', rawContent: content };
      }
    } catch (error) {
      console.error('Consultation API error:', error);
      return { thinking: '', question: '', options: [], goal: '', base: '', rawContent: '' };
    }
  };`;

content = content.replace(oldSendFn, newSendFn);

// 2. 修改 processInput 函数，添加 goal/base 处理
const oldProcessInputAskScale = `if (step === 'ASK_SCALE') {
      let s = '个人项目';
      if (input.includes('团队')) s = '团队协作';
      else if (input.includes('生产') || input.includes('高并发')) s = '生产级';
      profile.scale = s;

      addMessage('assistant', \`<p>📦 场景：<strong>\${s}</strong></p><p>信息收集完成，正在生成方案...</p>\`);
      updateSession({ currentStep: 'RESULT', userProfile: profile });
      return;
    }`;

const newProcessInputAskScale = `if (step === 'ASK_SCALE') {
      let s = '个人项目';
      if (input.includes('团队')) s = '团队协作';
      else if (input.includes('生产') || input.includes('高并发')) s = '生产级';
      profile.scale = s;

      // 发送最终请求获取方案
      const { goal, base } = await sendToConsultation(input, currentSession.agentId!, currentSession.sessionId!);

      if (goal && base) {
        // 方案数据格式：显示查看方案按钮
        const aiContent = \`<p>我已生成方案</p><button class="view-plan-btn" data-goal="\${goal}" data-base="\${base}">点击查看</button><button class="regenerate-btn">重新生成</button>\`;
        addMessage('assistant', aiContent, true);
        updateSession({ currentStep: 'RESULT', userProfile: profile, consultationGoal: goal, consultationBase: base });
      } else {
        addMessage('assistant', \`<p>📦 场景：<strong>\${s}</strong></p><p>信息收集完成，正在生成方案...</p>\`);
        updateSession({ currentStep: 'RESULT', userProfile: profile });
      }
      return;
    }`;

content = content.replace(oldProcessInputAskScale, newProcessInputAskScale);

// 3. 修改 processInput 中的结果处理，存储 goal/base
const oldResultHandling = `// 渲染 AI 返回的 question，存储 options 到 quickOptions
    const aiContent = question ? \`<p>\${question}</p>\` : '';
    addMessage('assistant', aiContent, true);
    updateSession({ currentStep: nextStep, userProfile: profile, quickOptions: options });`;

const newResultHandling = `// 渲染 AI 返回的 question，存储 options 到 quickOptions
    const aiContent = question ? \`<p>\${question}</p>\` : '';
    addMessage('assistant', aiContent, true);
    updateSession({ currentStep: nextStep, userProfile: profile, quickOptions: options, consultationGoal: goal, consultationBase: base });`;

content = content.replace(oldResultHandling, newResultHandling);

// 4. 修改 handleQuickSelect 中 ASK_SCALE 处理
const oldQuickSelectScale = `if (step === 'ASK_SCALE') {
      let scale = '个人项目';
      if (option.includes('团队')) scale = '团队协作';
      else if (option.includes('生产') || option.includes('高并发')) scale = '生产级';
      profile.scale = scale;

      const aiMsg: Message = { role: 'assistant', content: \`<p>📦 场景：<strong>\${scale}</strong></p><p>信息收集完成，正在生成方案...</p>\`, isHtml: true, timestamp: Date.now() };
      setSessions(prev => prev.map(sess => {
        if (sess.id === session.id) {
          return { ...sess, messages: [...newMessages, aiMsg], currentStep: 'RESULT', userProfile: profile };
        }
        return sess;
      }));

      setIsTyping(false);
      setWaitingForAI(false);
      return;
    }`;

const newQuickSelectScale = `if (step === 'ASK_SCALE') {
      let scale = '个人项目';
      if (option.includes('团队')) scale = '团队协作';
      else if (option.includes('生产') || option.includes('高并发')) scale = '生产级';
      profile.scale = scale;

      // 发送最终请求获取方案
      const { goal, base } = await sendToConsultation(option, currentSession.agentId!, currentSession.sessionId!);

      if (goal && base) {
        const aiContent = \`<p>我已生成方案</p><button class="view-plan-btn" data-goal="\${goal}" data-base="\${base}">点击查看</button><button class="regenerate-btn">重新生成</button>\`;
        const aiMsg: Message = { role: 'assistant', content: aiContent, isHtml: true, timestamp: Date.now() };
        setSessions(prev => prev.map(sess => {
          if (sess.id === session.id) {
            return { ...sess, messages: [...newMessages, aiMsg], currentStep: 'RESULT', userProfile: profile, consultationGoal: goal, consultationBase: base };
          }
          return sess;
        }));
      } else {
        const aiMsg: Message = { role: 'assistant', content: \`<p>📦 场景：<strong>\${scale}</strong></p><p>信息收集完成，正在生成方案...</p>\`, isHtml: true, timestamp: Date.now() };
        setSessions(prev => prev.map(sess => {
          if (sess.id === session.id) {
            return { ...sess, messages: [...newMessages, aiMsg], currentStep: 'RESULT', userProfile: profile };
          }
          return sess;
        }));
      }

      setIsTyping(false);
      setWaitingForAI(false);
      return;
    }`;

content = content.replace(oldQuickSelectScale, newQuickSelectScale);

// 5. 修改 handleQuickSelect 中的结果处理
const oldQuickResultHandling = `// 渲染 AI 返回的 question，存储 options 到 quickOptions
    const aiContent = question ? \`<p>\${question}</p>\` : '';
    const aiMsgHtml: Message = { role: 'assistant', content: aiContent, isHtml: true, timestamp: Date.now() };
    setSessions(prev => prev.map(sess => {
      if (sess.id === session.id) {
        return { ...sess, messages: [...newMessages, aiMsgHtml], currentStep: nextStep, userProfile: profile, quickOptions: options };
      }
      return sess;
    }));`;

const newQuickResultHandling = `// 渲染 AI 返回的 question，存储 options 到 quickOptions
    const aiContent = question ? \`<p>\${question}</p>\` : '';
    const aiMsgHtml: Message = { role: 'assistant', content: aiContent, isHtml: true, timestamp: Date.now() };
    setSessions(prev => prev.map(sess => {
      if (sess.id === session.id) {
        return { ...sess, messages: [...newMessages, aiMsgHtml], currentStep: nextStep, userProfile: profile, quickOptions: options, consultationGoal: goal, consultationBase: base };
      }
      return sess;
    }));`;

content = content.replace(oldQuickResultHandling, newQuickResultHandling);

// 6. 修改 Session 接口，添加 consultationGoal 和 consultationBase
const oldSessionInterface = `agentId?: string;
  sessionId?: string;
  quickOptions: string[]; // AI 返回的快捷选项
}`;

const newSessionInterface = `agentId?: string;
  sessionId?: string;
  quickOptions: string[]; // AI 返回的快捷选项
  consultationGoal?: string; // 最终方案的 goal
  consultationBase?: string; // 最终方案的 base
}`;

content = content.replace(oldSessionInterface, newSessionInterface);

// 7. 修改 getDefaultSession，添加默认值
const oldDefaultSession = `planDetails: [],
  quickOptions: [],
};`;

const newDefaultSession = `planDetails: [],
  quickOptions: [],
  consultationGoal: '',
  consultationBase: '',
};`;

content = content.replace(oldDefaultSession, newDefaultSession);

// 8. 修改持久化，添加 consultationGoal 和 consultationBase
const oldPersistence = `agentId: s.agentId,
        sessionId: s.sessionId,
        quickOptions: s.quickOptions,
      }));`;

const newPersistence = `agentId: s.agentId,
        sessionId: s.sessionId,
        quickOptions: s.quickOptions,
        consultationGoal: s.consultationGoal,
        consultationBase: s.consultationBase,
      }));`;

content = content.replace(oldPersistence, newPersistence);

// 9. 修改 localStorage 读取，添加默认值
const oldStorageRead = `setSessions(parsed.map((s: Session) => ({ ...s, messages: s.messages || [], quickOptions: s.quickOptions || [] })));`;

const newStorageRead = `setSessions(parsed.map((s: Session) => ({ ...s, messages: s.messages || [], quickOptions: s.quickOptions || [], consultationGoal: s.consultationGoal || '', consultationBase: s.consultationBase || '' })));`;

content = content.replace(oldStorageRead, newStorageRead);

fs.writeFileSync('d:/React/PathMind/src/pages/Consult/ConsultPage.tsx', content);
console.log('Done');