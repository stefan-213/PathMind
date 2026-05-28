# PathMind Codex Instructions

Codex 在修改 PathMind 项目前，必须先阅读并遵守本文档。

## 1. 项目技术栈

PathMind 使用：

- Vite
- React
- TypeScript
- Sass / SCSS

必须生成 React + TypeScript 代码。
新增组件使用 `.tsx`，样式使用 `.scss`。
不要生成 JS / JSX 组件。

禁止未经说明引入：

- Tailwind
- CSS Modules
- styled-components
- Less
- 新 UI 框架
- 新图标库
- 新状态管理库

---

## 2. 修改前必须阅读

修改或新增代码前，必须先阅读：

- `package.json`
- `tsconfig.app.json`
- `src/routes/routes.tsx`
- `src/index.scss`
- `src/styles/_variables.scss`
- `src/styles/_mixins.scss`
- `src/styles/_animations.scss`
- `src/styles/global.scss`
- `src/components/common`
- `src/components/common/index.ts`
- `src/components/layout`

并根据需求阅读相关目录：

- `src/pages`
- `src/stores`
- `src/api`
- `src/types`
- `src/utils`

---

## 3. 核心原则

必须遵守：

1. 先理解现有项目，再写代码。
2. 先复用已有组件，再新增组件。
3. 先复用现有样式变量、mixin、全局类，再新增样式。
4. 不确定类型优先使用 `unknown`，不要用 `any` 逃避类型问题。
5. 能局部修改，不做无关大范围重构。
6. 保持 PathMind 当前视觉风格，不另起一套 UI 体系。

---

## 4. TypeScript 规则

必须遵守：

- 避免使用 `any`。
- 不确定类型优先使用 `unknown`。
- 使用 `unknown` 后必须类型收窄。
- 组件 props 必须有明确类型。
- API 数据、状态数据、工具函数参数和返回值必须有明确类型。
- 类型-only 引入使用 `import type`。
- 不留下未使用变量、未使用参数、隐式 any、不可达代码。

允许临时使用 `any` 的情况：

- 第三方库缺少类型。
- 历史代码迁移。
- 当前任务无法合理完成完整建模。

但必须添加注释说明原因，并限制作用范围。

---

## 5. 组件复用规则

新增 UI 前必须先检查：

- `src/components/common`
- `src/components/common/index.ts`
- `src/components/layout`

优先复用：

- `Button`
- `Card`
- `Badge`
- `Input`
- `Textarea`
- `EmptyState`
- `Spin`
- `Header`
- `Footer`

禁止重复创建已有的按钮、卡片、徽章、输入框、文本域、空状态、加载态、导航和页脚。

组件复用优先级：

1. 直接复用已有组件。
2. 通过 props 配置已有组件。
3. 组合多个已有组件。
4. 扩展已有组件。
5. 最后才新增组件。

如果新增组件，必须说明为什么不能复用已有组件。

---

## 6. 样式规则

PathMind 当前风格是：

- 现代 SaaS
- 浅色
- 清爽
- 卡片化
- 轻阴影
- 主蓝色 + 强调橙色

必须优先使用现有设计令牌：

- `$primary-blue` / `var(--primary-blue)`
- `$blue-hover` / `var(--blue-hover)`
- `$accent-orange` / `var(--accent-orange)`
- `$orange-hover` / `var(--orange-hover)`
- `$text-title` / `var(--text-title)`
- `$text-body` / `var(--text-body)`
- `$text-caption` / `var(--text-caption)`
- `$bg-white` / `var(--bg-white)`
- `$bg-soft` / `var(--bg-soft)`
- `$border-light` / `var(--border-light)`
- `$radius-card` / `var(--radius-card)`
- `$radius-xl` / `var(--radius-xl)`
- `$space-xs` 到 `$space-3xl`
- `$shadow-card` / `var(--shadow-card)`
- `$shadow-hover` / `var(--shadow-hover)`

禁止随意硬编码重复的颜色、间距、字号、圆角和阴影。

页面样式放在页面同目录 `.scss` 文件中。
组件样式放在组件同目录 `.scss` 文件中。

需要变量或 mixin 时使用：

```scss
@use "../../styles/variables" as *;
@use "../../styles/mixins" as *;
```

相对路径根据文件位置调整。

---

## 7. 页面与目录规则

新增页面使用：

```text
src/pages/Feature/
  FeaturePage.tsx
  FeaturePage.scss
  index.ts
```

新增页面后必须在：

```text
src/routes/routes.tsx
```

注册路由。

新增通用组件使用：

```text
src/components/common/ComponentName/
  ComponentName.tsx
  ComponentName.scss
  index.ts
```

除非确实通用，否则页面专属组件应放在对应页面目录下。

---

## 8. 数据、状态、接口规则

必须遵守：

- API 请求逻辑放在 `src/api`。
- 业务类型放在 `src/types`。
- 通用工具函数放在 `src/utils`。
- 页面局部状态使用 `useState` / `useReducer`。
- 跨页面共享状态使用已有 Zustand store 模式，放在 `src/stores`。
- 不要在页面组件中散落请求配置和复杂数据转换逻辑。
- 对接口、localStorage、URL query、第三方返回值等不可信数据做类型保护和 fallback。

---

## 9. UI 状态要求

页面或组件必须根据需求考虑：

- loading
- empty
- error
- disabled
- hover
- focus
- 移动端适配

移动端必须检查：

- 按钮不溢出。
- 卡片不拥挤。
- 文本不重叠。
- 网格或列表能降为单列。

---

## 10. 完成后输出格式

每次修改完成后，必须按以下格式总结：

```text
修改目标：
- ...

参考文件：
- ...

复用组件：
- ...

新增文件：
- ...

修改文件：
- ...

样式说明：
- ...

类型说明：
- ...

建议运行：
- npm run lint
- npm run build
```

如果没有复用组件，必须说明原因。
如果新增依赖，必须说明必要性和影响范围。

---

## 11. 建议验证命令

完成后根据项目实际脚本运行或建议运行：

```bash
npm run lint
npm run build
```

如果存在以下脚本，也应运行：

```bash
npm run type-check
npm run test
```

如果项目使用 pnpm 或 yarn，则使用项目已有包管理器，不要混用。

---

## 12. 详细规范

更详细的组件 props、样式变量、API 规则、文案规则、测试规则，放在：

```text
docs/ai-coding-rules.md
```

如果当前任务涉及复杂 UI、接口、状态或表单，必须同时阅读该文档。
