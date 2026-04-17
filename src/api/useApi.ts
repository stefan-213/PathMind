/**
 * API 导出配置
 * 直接导出真实 API
 */
import * as realAuth from './auth';
import * as realTasks from './tasks';
import * as realConversation from './conversation';
import * as realGraph from './graph';

export const authApi = realAuth;
export const tasksApi = realTasks;
export const conversationApi = realConversation;
export const graphApi = realGraph;
export const consultApi = realConversation;
export const { deleteChatSession, getChatSessions } = realConversation;
