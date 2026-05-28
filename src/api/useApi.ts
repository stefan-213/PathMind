import * as realAuth from './auth';
import * as realTasks from './tasks';
import * as realConversation from './conversation';
import * as realGraph from './graph';
import * as realKnowledgeBase from './knowledgeBase';

export const authApi = realAuth;
export const tasksApi = realTasks;
export const conversationApi = realConversation;
export const graphApi = realGraph;
export const knowledgeBaseApi = realKnowledgeBase;
export const consultApi = realConversation;
export const { deleteChatSession, getChatSessions } = realConversation;
