/**
 * 任务详情本地存储工具
 * 处理任务计划、学习记录的本地持久化
 */

import type { Schedule } from '../../../../types/api';
import { pathmindStorage } from '../../../../utils/storage';

export const readLocalSchedules = (sessionId?: string): Schedule[] => {
  return pathmindStorage.plan.load(sessionId);
};

/** 本地降级回复 */
export const generateLocalReply = (taskTitle: string, message: string) => {
  const lower = message.toLowerCase();

  if (message.includes('拆解') || message.includes('步骤') || lower.includes('step')) {
    return `可以把 **${taskTitle}** 拆成 4 步：

1. 先明确这个任务要解决的问题和最终产出。
2. 找一个最小示例，跑通关键概念。
3. 记录 3 个容易混淆的点，并用自己的话解释。
4. 做一个小练习或复盘，把结论沉淀成笔记。`;
  }

  if (message.includes('资料') || message.includes('推荐') || lower.includes('resource')) {
    return `建议按这个顺序准备 **${taskTitle}** 的资料：

- 官方文档或权威教程：用来确认概念边界。
- 一篇完整实战文章：用来理解真实流程。
- 一个可运行 demo：用来把知识变成手感。

看资料时重点记三件事：核心概念、常见坑、可以复用的代码或流程。`;
  }

  if (message.includes('练习') || message.includes('题')) {
    return `这里有一个适合 **${taskTitle}** 的练习：

**练习目标**：用 30 分钟做一个最小可验证版本。

**要求**：

1. 写出你对任务目标的 3 句话理解。
2. 找到一个最小示例并运行或推演。
3. 总结"输入、处理、输出"分别是什么。
4. 写下一个还没搞懂的问题，下一轮重点解决。`;
  }

  if (message.includes('完成') || message.includes('判断') || lower.includes('done')) {
    return `判断 **${taskTitle}** 是否完成，可以看这 3 个标准：

- 你能不用复制原文，解释它的核心概念。
- 你能完成一个小例子，或说清楚执行步骤。
- 你知道这个任务最容易出错的地方，并能给出规避方法。`;
  }

  return `我会围绕 **${taskTitle}** 帮你拆解。你可以问我学习步骤、资料推荐、练习设计、完成标准，或者直接说你卡在哪个概念上。`;
};